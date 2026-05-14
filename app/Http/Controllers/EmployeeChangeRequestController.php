<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChangeRequestResource;
use App\Models\EmployeeChangeRequest;
use App\Repositories\ShuttleRepository;
use App\Services\EmployeeAttachmentService;
use App\Services\EmployeeChangeRequestService;
use App\Services\EmployeeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class EmployeeChangeRequestController extends Controller
{
    public function __construct(
        protected EmployeeChangeRequestService $service,
        protected EmployeeAttachmentService    $attachmentService,
        protected ShuttleRepository            $shuttleRepository,
        protected EmployeeService              $employeeService,
    ) {}

    // ─── Table Page ──────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $isAdmin = (int) session('emp_data.emp_id') === 0;

        if (!$isAdmin) {
            return $this->indexForEmployee($request);
        }

        $encoded = $request->query('filters', '');
        $decoded = [];
        if ($encoded) {
            $json    = base64_decode($encoded, strict: true);
            $decoded = ($json !== false) ? (json_decode($json, associative: true) ?? []) : [];
        }

        $filters = array_intersect_key(
            array_map('strval', $decoded),
            array_flip(['status', 'category', 'date_from', 'date_to', 'employid', 'per_page', 'page'])
        );
        $filters['status'] ??= 'pending';

        return Inertia::render('ChangeRequests/Index', [
            'requests'   => ChangeRequestResource::collection($this->service->getAllForHR($filters)),
            'filters'    => $filters,
            'categories' => EmployeeChangeRequest::CATEGORIES,
            'shuttles'   => $this->shuttleRepository->getAll(),
            'isAdmin'    => true,
            'hasStaff'   => false,
        ]);
    }

    private function indexForEmployee(Request $request): Response
    {
        $empId = (int) session('emp_data.emp_id');

        $encoded = $request->query('filters', '');
        $decoded = [];
        if ($encoded) {
            $json    = base64_decode($encoded, strict: true);
            $decoded = ($json !== false) ? (json_decode($json, associative: true) ?? []) : [];
        }

        $filters = array_intersect_key(
            array_map('strval', $decoded),
            array_flip(['status', 'category', 'date_from', 'date_to', 'employid', 'per_page', 'page'])
        );

        $staffIds = $this->employeeService->getDirectReportIds($empId);
        $hasStaff = !empty($staffIds);

        $ownRequests   = $this->service->getOwnRequests($empId, $filters);
        $staffRequests = $hasStaff ? $this->service->getStaffRequests($staffIds, $filters) : null;

        return Inertia::render('ChangeRequests/Index', [
            'isAdmin'       => false,
            'hasStaff'      => $hasStaff,
            'ownRequests'   => ChangeRequestResource::collection($ownRequests),
            'staffRequests' => $staffRequests ? ChangeRequestResource::collection($staffRequests) : null,
            'filters'       => $filters,
            'categories'    => EmployeeChangeRequest::CATEGORIES,
            'shuttles'      => $this->shuttleRepository->getAll(),
        ]);
    }

    // ─── HR Approve / Reject ─────────────────────────────────────────────────

    public function approve(int $id): \Illuminate\Http\RedirectResponse
    {
        try {
            $this->service->approve($id, session('emp_data.emp_id'));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }

        return back();
    }

    public function reject(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'remarks' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $this->service->reject($id, $validated['remarks'], session('emp_data.emp_id'));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }

        return back();
    }

    // ─── HR Bulk Actions ─────────────────────────────────────────────────────

    public function bulkApprove(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'     => ['required', 'array', 'min:1'],
            'ids.*'   => ['integer'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $result = $this->service->bulkApprove(
                $validated['ids'],
                session('emp_data.emp_id'),
                $validated['remarks'] ?? ''
            );

            $msg = "Approved {$result['approved']} request(s).";
            if (!empty($result['errors'])) {
                $msg .= ' Some failed: ' . implode('; ', $result['errors']);
            }

            return back()->with('success', $msg);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function bulkReject(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'     => ['required', 'array', 'min:1'],
            'ids.*'   => ['integer'],
            'remarks' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $result = $this->service->bulkReject(
                $validated['ids'],
                $validated['remarks'],
                session('emp_data.emp_id')
            );

            return back()->with('success', "Rejected {$result['rejected']} request(s).");
        } catch (\RuntimeException $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    // ─── Employee Submit ─────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'old_value' => json_decode($request->old_value, true),
            'new_value' => json_decode($request->new_value, true),
        ]);

        $validated = $request->validate([
            'employid'         => ['required', 'integer'],
            'category'         => ['required', 'string', 'in:' . implode(',', array_keys(EmployeeChangeRequest::CATEGORIES))],
            'old_value'        => ['required', 'array'],
            'new_value'        => ['required', 'array'],
            'attachment_id'    => ['nullable', 'integer', 'exists:employee_attachments,id'],
            'file'             => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'file_description' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $changeRequest = $this->service->submit(
                employid: $validated['employid'],
                category: $validated['category'],
                oldValue: $validated['old_value'],
                newValue: $validated['new_value'],
                attachmentId: $validated['attachment_id'] ?? null,
                file: $request->file('file'),
                fileDescription: $validated['file_description'] ?? '',
            );

            return back()->with('success', 'Change request submitted. Pending HR approval.');
        } catch (\RuntimeException $e) {
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    // ─── Attachments ─────────────────────────────────────────────────────────

    public function uploadAttachment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employid'    => ['required', 'integer'],
            'file'        => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $attachment = $this->attachmentService->store(
            employid: $validated['employid'],
            uploadedBy: $validated['employid'],
            file: $request->file('file'),
            description: $validated['description'] ?? '',
        );

        return response()->json(['success' => true, 'data' => $attachment]);
    }

    public function listAttachments(Request $request): JsonResponse
    {
        $attachments = $this->service->getAttachmentsForEmployee($request->integer('employid'));

        return response()->json([
            'success' => true,
            'data'    => $attachments->map(fn($a) => [
                'id'            => $a->id,
                'original_name' => $a->original_name,
                'description'   => $a->description,
                'size'          => $a->size_formatted,
                'is_image'      => $a->is_image,
                'url'           => $a->url,
                'created_at'    => $a->created_at->toDateTimeString(),
            ]),
        ]);
    }
}
