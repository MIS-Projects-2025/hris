<?php

namespace App\Repositories;

use App\Models\EmployeeChangeRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EmployeeChangeRequestRepository
{
    // ─── Employee-facing ─────────────────────────────────────────────────────

    /**
     * All non-cancelled requests for a specific employee.
     */
    public function getForEmployee(int $employid): Collection
    {
        return EmployeeChangeRequest::with(['attachment', 'requester', 'reviewer'])
            ->where('employid', $employid)
            ->whereNot('status', EmployeeChangeRequest::STATUS_CANCELLED)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get the single active pending request for a specific category.
     */
    public function getPendingForCategory(int $employid, string $category): ?EmployeeChangeRequest
    {
        return EmployeeChangeRequest::with('attachment')
            ->where('employid', $employid)
            ->where('category', $category)
            ->where('status', EmployeeChangeRequest::STATUS_PENDING)
            ->latest()
            ->first();
    }

    // ─── HR-facing ───────────────────────────────────────────────────────────

    /**
     * Paginated list for the HR table with filters.
     */
    public function getAllForHR(array $filters = []): LengthAwarePaginator
    {
        $query = EmployeeChangeRequest::with(['attachment', 'requester', 'reviewer'])
            ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected', 'cancelled')")
            ->orderByDesc('created_at');

        // Status filter — default to pending
        $status = $filters['status'] ?? 'pending';
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Category filter
        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        // Date range
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Employee search
        if (!empty($filters['employid'])) {
            $query->where('employid', $filters['employid']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Paginated own change requests for a single employee (non-admin view).
     */
    public function getAllForEmployee(int $employid, array $filters = []): LengthAwarePaginator
    {
        $query = EmployeeChangeRequest::with(['attachment', 'requester', 'reviewer'])
            ->where('employid', $employid)
            ->orderByDesc('created_at');

        $status = $filters['status'] ?? 'all';
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Paginated change requests for a set of direct-report employee IDs.
     */
    public function getAllForStaff(array $employids, array $filters = []): LengthAwarePaginator
    {
        $query = EmployeeChangeRequest::with(['attachment', 'requester', 'reviewer'])
            ->whereIn('employid', $employids)
            ->orderByDesc('created_at');

        $status = $filters['status'] ?? 'all';
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        if (!empty($filters['employid'])) {
            $query->where('employid', $filters['employid']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Bulk-approve pending requests. Returns count approved.
     */
    public function bulkApprove(array $ids, ?int $reviewerId = null, string $remarks = ''): int
    {
        $count = 0;
        EmployeeChangeRequest::whereIn('id', $ids)
            ->where('status', EmployeeChangeRequest::STATUS_PENDING)
            ->each(function ($request) use ($reviewerId, $remarks, &$count) {
                $data = [
                    'status'      => EmployeeChangeRequest::STATUS_APPROVED,
                    'reviewed_at' => now(),
                    'remarks'     => $remarks ?: null,
                ];
                if ($reviewerId !== null) {
                    $data['reviewed_by'] = $reviewerId;
                }
                $request->update($data);
                $count++;
            });

        return $count;
    }

    /**
     * Bulk-reject pending requests. Returns count rejected.
     */
    public function bulkReject(array $ids, string $remarks, ?int $reviewerId = null): int
    {
        $count = 0;
        EmployeeChangeRequest::whereIn('id', $ids)
            ->where('status', EmployeeChangeRequest::STATUS_PENDING)
            ->each(function ($request) use ($reviewerId, $remarks, &$count) {
                $data = [
                    'status'      => EmployeeChangeRequest::STATUS_REJECTED,
                    'reviewed_at' => now(),
                    'remarks'     => $remarks,
                ];
                if ($reviewerId !== null) {
                    $data['reviewed_by'] = $reviewerId;
                }
                $request->update($data);
                $count++;
            });

        return $count;
    }

    public function findById(int $id): ?EmployeeChangeRequest
    {
        return EmployeeChangeRequest::with(['attachment', 'requester', 'reviewer'])
            ->find($id);
    }

    // ─── Mutation ────────────────────────────────────────────────────────────

    /**
     * Cancel all pending requests for the same employee + category.
     */
    public function cancelPreviousPending(int $employid, string $category): void
    {
        EmployeeChangeRequest::where('employid', $employid)
            ->where('category', $category)
            ->where('status', EmployeeChangeRequest::STATUS_PENDING)
            ->update(['status' => EmployeeChangeRequest::STATUS_CANCELLED]);
    }

    public function create(array $data): EmployeeChangeRequest
    {
        return EmployeeChangeRequest::create($data);
    }

    public function approve(int $id, ?int $reviewerId = null): EmployeeChangeRequest
    {
        $request = EmployeeChangeRequest::findOrFail($id);

        $updateData = [
            'status'      => EmployeeChangeRequest::STATUS_APPROVED,
            'reviewed_at' => now(),
            'remarks'     => null,
        ];

        // Only set reviewed_by if a reviewer ID is provided
        if ($reviewerId !== null) {
            $updateData['reviewed_by'] = $reviewerId;
        }

        $request->update($updateData);
        return $request->fresh();
    }

    public function reject(int $id, ?int $reviewerId = null, string $remarks): EmployeeChangeRequest
    {
        $request = EmployeeChangeRequest::findOrFail($id);

        $updateData = [
            'status'      => EmployeeChangeRequest::STATUS_REJECTED,
            'reviewed_at' => now(),
            'remarks'     => $remarks,
        ];

        // Only set reviewed_by if a reviewer ID is provided
        if ($reviewerId !== null) {
            $updateData['reviewed_by'] = $reviewerId;
        }

        $request->update($updateData);
        return $request->fresh();
    }
}
