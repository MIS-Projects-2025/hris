<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminUpdateFieldRequest;
use App\Services\EmployeeAttachmentService;
use App\Services\EmployeeChangeRequestService;
use App\Services\EmployeeService;
use App\Services\ShuttleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeService              $employeeService,
        protected ShuttleService               $shuttleService,
        protected EmployeeAttachmentService    $attachmentService,
        protected EmployeeChangeRequestService $changeRequestService,
    ) {}

    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $isAdmin      = (int) session('emp_data.emp_id') === 0;
        $sessionEmpId = (int) session('emp_data.emp_id');

        $encoded = $request->query('filters', '');
        $decoded = [];
        if ($encoded) {
            $json    = base64_decode($encoded, strict: true);
            $decoded = ($json !== false) ? (json_decode($json, associative: true) ?? []) : [];
        }

        $filters = array_intersect_key(
            array_map('strval', $decoded),
            array_flip(['search', 'company', 'department', 'status', 'class', 'page', 'per_page'])
        );

        if (!$isAdmin) {
            $staffIds = $this->employeeService->getDirectReportIds($sessionEmpId);

            if (empty($staffIds)) {
                return redirect()->route('employees.show', base64_encode($sessionEmpId));
            }

            return Inertia::render('Employee/Index', [
                'employees'   => $this->employeeService->getStaffListForTable($sessionEmpId, $filters),
                'filters'     => $filters,
                'lookups'     => $this->employeeService->getIndexLookups(),
                'isStaffOnly' => true,
            ]);
        }

        return Inertia::render('Employee/Index', [
            'employees'   => $this->employeeService->getEmployeeListForTable($filters),
            'filters'     => $filters,
            'lookups'     => $this->employeeService->getIndexLookups(),
            'isStaffOnly' => false,
        ]);
    }

    public function show(string $employid, Request $request): Response
    {
        $employid     = $this->decodeEmployid($employid);
        $result       = $this->employeeService->getFullDetail($employid);

        if (!$result['success']) {
            abort(404, 'Employee not found.');
        }

        $isAdmin      = (int) session('emp_data.emp_id') === 0;
        $sessionEmpId = (int) session('emp_data.emp_id');

        // Determine access level
        $viewMode = 'own';
        $staffIds = [];

        if ($isAdmin) {
            $viewMode = 'admin';
        } elseif ($employid !== $sessionEmpId) {
            $staffIds = $this->employeeService->getDirectReportIds($sessionEmpId);
            if (!in_array($employid, $staffIds)) {
                abort(403, 'Access denied.');
            }
            $viewMode = 'staff';
        } else {
            // own profile — check if they also have staff for the combobox
            $staffIds = $this->employeeService->getDirectReportIds($sessionEmpId);
        }

        $hasStaff = !empty($staffIds);

        return Inertia::render('Employee/Show', [
            'employee'       => $result['data'],
            'shuttles'       => $this->shuttleService->getAll(),
            'adminLookups'   => $isAdmin ? $this->employeeService->getAdminLookups() : null,
            'changeRequests' => $viewMode === 'own'
                ? $this->changeRequestService->getPendingMapForEmployee($employid)
                : [],
            'viewMode'       => $viewMode,
            'hasStaff'       => $hasStaff,

            'attachments' => Inertia::lazy(
                fn() => $this->attachmentService->getForEmployee($employid)
            ),

            'activeEmployees' => Inertia::lazy(function () use ($request, $isAdmin, $sessionEmpId) {
                if (!$isAdmin) {
                    return $this->employeeService->getDirectReportsForCombobox($sessionEmpId);
                }
                $encoded = $request->query('q', '');
                $params  = [];
                if ($encoded) {
                    $json   = base64_decode($encoded, strict: true);
                    $params = ($json !== false) ? (json_decode($json, associative: true) ?? []) : [];
                }
                return $this->employeeService->getActiveEmployeeList([
                    'search'   => $params['search']   ?? '',
                    'page'     => (int) ($params['page']     ?? 1),
                    'per_page' => (int) ($params['per_page'] ?? 50),
                ]);
            }),
        ]);
    }
    public function history(string $employid, Request $request)
    {
        $empId = $this->decodeEmployid($employid);
        abort_if(!$empId, 404);

        return response()->json(
            $this->employeeService->getActivityHistory($empId, $request->integer('page', 1))
        );
    }

    public function adminUpdate(string $employid, AdminUpdateFieldRequest $request)
    {
        $this->employeeService->adminUpdateField(
            $this->decodeEmployid($employid),
            $request->input('table', 'personal'),
            $request->input('field'),
            $request->input('value'),
            $request->input('family_type'),
            $request->integer('row_id') ?: null,
        );

        return back();
    }

    public function adminFamilyAdd(string $employid, Request $request)
    {
        if ((int) session('emp_data.emp_id') !== 0) abort(403);

        $this->employeeService->adminAddFamilyRow(
            $this->decodeEmployid($employid),
            $request->input('family_type'),
            $request->input('data', []),
        );

        return back();
    }

    public function adminFamilyDelete(string $employid, int $rowId, Request $request)
    {
        if ((int) session('emp_data.emp_id') !== 0) abort(403);

        $this->employeeService->adminDeleteFamilyRow(
            $this->decodeEmployid($employid),
            $request->input('family_type'),
            $rowId,
        );

        return back();
    }

    private function decodeEmployid(string $employid): int
    {
        $decoded = base64_decode($employid, strict: true);
        return ($decoded !== false && ctype_digit($decoded)) ? (int) $decoded : 0;
    }
}
