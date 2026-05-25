<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeService $service
    ) {}

    /**
     * GET /api/employees/{employid}
     * Full details — personal + work + resolved names
     */
    public function show(int $employid): JsonResponse
    {
        $result = $this->service->getFullDetail($employid);

        if (!$result['success']) {
            return response()->json($result, 404);
        }

        return response()->json($result);
    }

    /**
     * GET /api/employees/{employid}/auth
     * Slim payload for SSO login — personal identifiers + work IDs only, no resolved names
     */
    public function auth(int $employid): JsonResponse
    {
        $result = $this->service->getAuthDetail($employid);

        if (!$result['success']) {
            return response()->json($result, 404);
        }

        return response()->json($result);
    }

    /**
     * GET /api/employees/{employid}/work
     * Work details only + resolved names
     */
    public function work(int $employid): JsonResponse
    {
        $result = $this->service->getWorkDetail($employid);

        if (!$result['success']) {
            return response()->json($result, 404);
        }

        return response()->json($result);
    }

    public function getActiveEmployeeList(Request $request)
    {
        $encoded = $request->query('q', '');
        $params  = [];
        if ($encoded) {
            $json   = base64_decode($encoded, strict: true);
            $params = ($json !== false) ? (json_decode($json, associative: true) ?? []) : [];
        }
        return response()->json(
            $this->service->getActiveEmployeeList([
                'search'   => $params['search']   ?? '',
                'page'     => (int) ($params['page']     ?? 1),
                'per_page' => (int) ($params['per_page'] ?? 50),
            ])
        );
    }
    /**
     * GET /api/employees/direct-reports/{empId}
     * Returns active employees where empId is approver1, approver2, or approver3
     */
    public function getDirectReports(int $empId): JsonResponse
    {
        return response()->json($this->service->getDirectReports($empId));
    }

    /**
     * POST /api/employees/bulk
     * Accepts { "emp_nos": [101, 202, ...] }
     * Returns { "success": true, "data": { "<emp_no>": { emp_name, department, prodline, station } } }
     */
    public function bulk(Request $request): JsonResponse
    {
        $empNos = array_values(array_filter(
            array_map('intval', (array) $request->input('emp_nos', []))
        ));

        if (empty($empNos)) {
            return response()->json(['success' => false, 'message' => 'emp_nos is required.'], 422);
        }

        return response()->json($this->service->getBulkStaffInfo($empNos));
    }

    public function getOperationDirector(): JsonResponse
    {
        $director = $this->service->getOperationDirector();

        if (!$director) {
            return response()->json([
                'success' => false,
                'message' => 'Operation Director not found.',
                'data'    => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $director,
        ]);
    }

    public function bulkNames(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'emp_ids'   => ['required', 'array', 'min:1', 'max:500'],
            'emp_ids.*' => ['required', 'integer'],
        ]);

        $empIds = array_values(array_unique(array_filter(
            array_map('intval', $validated['emp_ids'])
        )));

        return response()->json($this->service->getBulkNames($empIds));
    }
}
