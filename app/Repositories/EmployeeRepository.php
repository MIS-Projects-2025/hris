<?php

namespace App\Repositories;

use App\Models\EmployeeAddress;
use App\Models\EmployeeApprover;
use App\Models\EmployeeChild;
use App\Models\EmployeeClass;
use App\Models\EmployeeCompany;
use App\Models\EmployeeDepartment;
use App\Models\EmployeeDetail;
use App\Models\EmployeeGovInfo;
use App\Models\EmployeeParent;
use App\Models\EmployeePosition;
use App\Models\EmployeeShift;
use App\Models\EmployeeSibling;
use App\Models\EmployeeSpouse;
use App\Models\EmployeeStatus;
use App\Models\EmployeeWorkDetail;
use App\Models\JobTitle;
use App\Models\MasterlistLogs;
use App\Models\Prodline;
use App\Models\Shuttle;
use App\Models\Station;
use App\Models\Team;
use Illuminate\Support\Collection;

class EmployeeRepository
{
    public function getFullDetailByEmployid(int $employid): ?EmployeeDetail
    {
        return EmployeeDetail::with([
            'workDetail.companyRel',
            'workDetail.departmentRel',
            'workDetail.jobTitleRel',
            'workDetail.prodLineRel',
            'workDetail.stationRel',
            'workDetail.empPositionRel',
            'workDetail.statusRel',
            'workDetail.teamRel',
            'workDetail.classRel',
            'workDetail.shiftRel',
            'workDetail.shuttleRel',
            'workDetail.govInfo',
            'workDetail.approver.approver1Detail',
            'workDetail.approver.approver2Detail',
            'workDetail.approver.approver3Detail',
            'address',
            'parents',
            'spouse',
            'siblings',
            'children',
        ])->where('employid', $employid)->first();
    }

    public function getAuthDetailByEmployid(int $employid): ?EmployeeDetail
    {
        return EmployeeDetail::with([
            'workDetail',
        ])->where('employid', $employid)->first();
    }

    public function getWorkDetailByEmployid(int $employid)
    {
        return EmployeeWorkDetail::with([
            'employee:employid,accstatus',
            'companyRel',
            'departmentRel',
            'jobTitleRel',
            'prodLineRel',
            'stationRel',
            'teamRel',
            'empPositionRel',
            'statusRel',
            'classRel',
            'shiftRel',
            'shuttleRel',
            'approver.approver1Detail',
            'approver.approver2Detail',
            'approver.approver3Detail',
            'govInfo'
        ])->where('employid', $employid)->first();
    }
    public function getEmployeeListWithWorkDetail(array $params = []): array
    {
        $query = EmployeeDetail::with([
            'workDetail.companyRel',
            'workDetail.departmentRel',
            'workDetail.jobTitleRel',
            'workDetail.prodLineRel',
            'workDetail.stationRel',
            'workDetail.teamRel',
            'workDetail.empPositionRel',
            'workDetail.statusRel',
            'workDetail.classRel',
            'workDetail.shiftRel',
            'workDetail.shuttleRel',
            'workDetail.govInfo',
        ])
            ->where('accstatus', 1)
            ->where('employid', '!=', 0)
            ->whereRaw("CAST(employid AS CHAR) NOT LIKE '5%'");

        if (!empty($params['search'])) {
            $s = $params['search'];
            $query->where(function ($q) use ($s) {
                $q->where('employid', 'like', "%{$s}%")
                    ->orWhere('firstname', 'like', "%{$s}%")
                    ->orWhere('lastname', 'like', "%{$s}%")
                    ->orWhere('middlename', 'like', "%{$s}%");
            });
        }

        $hasWorkFilter = !empty($params['company']) || !empty($params['department'])
            || !empty($params['status']) || !empty($params['class']);

        if ($hasWorkFilter) {
            $query->whereHas('workDetail', function ($q) use ($params) {
                if (!empty($params['company']))    $q->where('company',    $params['company']);
                if (!empty($params['department'])) $q->where('department', $params['department']);
                if (!empty($params['status']))     $q->where('empstatus',  $params['status']);
                if (!empty($params['class']))      $q->where('empclass',   $params['class']);
            });
        }

        $query->orderBy('firstname');
        $perPage   = $params['per_page'] ?? 50;
        $paginated = $query->paginate($perPage, ['*'], 'page', $params['page'] ?? 1);

        return [
            'data'         => $paginated->items(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
        ];
    }

    // ── Lookup tables ─────────────────────────────────────────────────────────

    public function getIndexLookups(): array
    {
        return [
            'companies'   => EmployeeCompany::on('masterlist')->orderBy('company_name')->pluck('company_name', 'id'),
            'departments' => EmployeeDepartment::on('masterlist')->orderBy('dept_name')->pluck('dept_name', 'id'),
            'statuses'    => EmployeeStatus::on('masterlist')->orderBy('status_name')->pluck('status_name', 'id'),
            'classes'     => EmployeeClass::on('masterlist')->orderBy('class_name')->pluck('class_name', 'id'),
        ];
    }

    public function getAdminLookups(): array
    {
        $toOptions = fn($items, $labelKey) => $items->map(fn($r) => ['value' => $r->id, 'label' => $r->$labelKey])->values()->all();

        return [
            'companies'   => $toOptions(EmployeeCompany::on('masterlist')->orderBy('company_name')->get(),   'company_name'),
            'departments' => $toOptions(EmployeeDepartment::on('masterlist')->orderBy('dept_name')->get(),    'dept_name'),
            'jobTitles'   => $toOptions(JobTitle::on('masterlist')->orderBy('position')->get(),               'position'),
            'prodLines'   => $toOptions(Prodline::on('masterlist')->orderBy('pl_name')->get(),                'pl_name'),
            'stations'    => $toOptions(Station::on('masterlist')->orderBy('station_name')->get(),            'station_name'),
            'teams'       => $toOptions(Team::on('masterlist')->orderBy('team_name')->get(),                  'team_name'),
            'positions'   => $toOptions(EmployeePosition::on('masterlist')->orderBy('emp_position_name')->get(), 'emp_position_name'),
            'statuses'    => $toOptions(EmployeeStatus::on('masterlist')->orderBy('status_name')->get(),      'status_name'),
            'classes'     => $toOptions(EmployeeClass::on('masterlist')->orderBy('class_name')->get(),        'class_name'),
            'shifts'      => $toOptions(EmployeeShift::on('masterlist')->orderBy('shift_name')->get(),        'shift_name'),
            'shuttles'    => $toOptions(Shuttle::on('masterlist')->orderBy('shuttle_name')->get(),            'shuttle_name'),
        ];
    }

    // ── Admin direct-write methods ────────────────────────────────────────────

    public function updatePersonalField(int $empId, string $field, mixed $value): void
    {
        EmployeeDetail::on('masterlist')->where('employid', $empId)->first()
            ?->fill([$field => $value ?: null])->save();
    }

    public function updateWorkField(int $empId, string $field, mixed $value): void
    {
        EmployeeWorkDetail::on('masterlist')->where('employid', $empId)->first()
            ?->fill([$field => $value ?: null])->save();
    }

    public function updateAddressField(int $empId, string $field, mixed $value): void
    {
        EmployeeAddress::on('masterlist')->where('employid', $empId)->first()
            ?->fill([$field => $value ?: null])->save();
    }

    public function updateApproverField(int $empId, string $field, mixed $value): void
    {
        EmployeeApprover::on('masterlist')->where('employid', $empId)->first()
            ?->fill([$field => $value ?: null])->save();
    }

    public function updateGovInfoField(int $empId, string $field, mixed $value): void
    {
        EmployeeGovInfo::on('masterlist')->where('employid', $empId)->first()
            ?->fill([$field => $value ?: null])->save();
    }

    public function updateFamilyRow(string $familyType, int $rowId, int $empId, array $payload): void
    {
        $model = match ($familyType) {
            'parent'  => EmployeeParent::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
            'spouse'  => EmployeeSpouse::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
            'sibling' => EmployeeSibling::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
            'child'   => EmployeeChild::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
        };
        $model?->fill($payload)->save();
    }

    public function addFamilyRow(string $familyType, int $empId, array $data): void
    {
        $payload = array_merge(['employid' => $empId], $data);

        match ($familyType) {
            'parent'  => EmployeeParent::on('masterlist')->create($payload),
            'spouse'  => EmployeeSpouse::on('masterlist')->create($payload),
            'sibling' => EmployeeSibling::on('masterlist')->create($payload),
            'child'   => EmployeeChild::on('masterlist')->create($payload),
        };
    }

    public function deleteFamilyRow(string $familyType, int $rowId, int $empId): void
    {
        $model = match ($familyType) {
            'parent'  => EmployeeParent::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
            'spouse'  => EmployeeSpouse::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
            'sibling' => EmployeeSibling::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
            'child'   => EmployeeChild::on('masterlist')->where('id', $rowId)->where('employid', $empId)->first(),
        };
        $model?->delete();
    }

    public function getActivityLogs(int $empId, int $page): array
    {
        $relatedIds = [
            EmployeeWorkDetail::class => EmployeeWorkDetail::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeAddress::class    => EmployeeAddress::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeApprover::class   => EmployeeApprover::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeGovInfo::class    => EmployeeGovInfo::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeParent::class     => EmployeeParent::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeSpouse::class     => EmployeeSpouse::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeSibling::class    => EmployeeSibling::on('masterlist')->where('employid', $empId)->pluck('id'),
            EmployeeChild::class      => EmployeeChild::on('masterlist')->where('employid', $empId)->pluck('id'),
        ];

        $paginated = MasterlistLogs::on('masterlist')
            ->where(function ($q) use ($empId, $relatedIds) {
                $q->where('related_id', $empId)
                    ->orWhere(function ($q2) use ($empId) {
                        $q2->where('loggable_type', EmployeeDetail::class)
                            ->where('loggable_id', $empId);
                    });

                foreach ($relatedIds as $type => $ids) {
                    if ($ids->isNotEmpty()) {
                        $q->orWhere(function ($q2) use ($type, $ids) {
                            $q2->where('loggable_type', $type)
                                ->whereIn('loggable_id', $ids);
                        });
                    }
                }
            })
            ->orderBy('action_at', 'desc')
            ->paginate(5, ['*'], 'page', $page);

        return [
            'items'        => $this->resolveLogValues($paginated->getCollection()),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'total'        => $paginated->total(),
            'has_more'     => $paginated->hasMorePages(),
        ];
    }

    private function resolveLogValues(Collection $logs): Collection
    {
        // FK fields → [model, label column]
        $fkMap = [
            'company'     => [EmployeeCompany::class,    'company_name'],
            'department'  => [EmployeeDepartment::class, 'dept_name'],
            'job_title'   => [JobTitle::class,           'position'],
            'prodline'    => [Prodline::class,           'pl_name'],
            'station'     => [Station::class,            'station_name'],
            'team'        => [Team::class,               'team_name'],
            'empposition' => [EmployeePosition::class,   'emp_position_name'],
            'empstatus'   => [EmployeeStatus::class,     'status_name'],
            'empclass'    => [EmployeeClass::class,      'class_name'],
            'shift_type'  => [EmployeeShift::class,      'shift_name'],
            'shuttle'     => [Shuttle::class,            'shuttle_name'],
        ];

        $staticMap = [
            'emp_sex'   => [1 => 'Male',   2 => 'Female'],
            'accstatus' => [1 => 'Active', 2 => 'Inactive'],
        ];

        $approverFields = ['approver1', 'approver2', 'approver3'];

        // Collect unique IDs per FK field across all log entries
        $fieldIds    = array_fill_keys(array_keys($fkMap), []);
        $approverIds = [];

        foreach ($logs as $log) {
            $allValues = array_merge($log->old_values ?? [], $log->new_values ?? []);

            foreach ($fkMap as $field => $_) {
                if (isset($allValues[$field]) && is_numeric($allValues[$field])) {
                    $fieldIds[$field][] = (int) $allValues[$field];
                }
            }
            foreach ($approverFields as $field) {
                if (isset($allValues[$field]) && is_numeric($allValues[$field])) {
                    $approverIds[] = (int) $allValues[$field];
                }
            }
        }

        // Batch-load only the lookup tables that are actually needed
        $lookups = [];
        foreach ($fkMap as $field => [$model, $labelCol]) {
            $ids = array_values(array_unique(array_filter($fieldIds[$field])));
            $lookups[$field] = $ids
                ? $model::on('masterlist')->whereIn('id', $ids)->pluck($labelCol, 'id')
                : collect();
        }

        // Batch-load approver names
        $approverNames = collect();
        $uniqueApproverIds = array_values(array_unique(array_filter($approverIds)));
        if ($uniqueApproverIds) {
            $approverNames = EmployeeDetail::on('masterlist')
                ->whereIn('employid', $uniqueApproverIds)
                ->get(['employid', 'firstname', 'middlename', 'lastname'])
                ->mapWithKeys(fn($e) => [
                    $e->employid => trim(implode(' ', array_filter([
                        $e->firstname,
                        $e->middlename,
                        $e->lastname,
                    ]))),
                ]);
        }

        $resolve = function (?array $values) use ($fkMap, $staticMap, $approverFields, $lookups, $approverNames): ?array {
            if ($values === null) return null;

            foreach ($values as $field => &$val) {
                if (isset($fkMap[$field]) && is_numeric($val)) {
                    $val = $lookups[$field]->get((int) $val, $val);
                } elseif (isset($staticMap[$field])) {
                    $val = $staticMap[$field][$val] ?? $val;
                } elseif (in_array($field, $approverFields) && is_numeric($val)) {
                    $val = $approverNames->get((int) $val, $val);
                }
            }

            return $values;
        };

        return $logs->map(function ($log) use ($resolve) {
            $log->old_values = $resolve($log->old_values);
            $log->new_values = $resolve($log->new_values);
            return $log;
        });
    }

    public function getEmployeeNames(array $employids): Collection
    {
        if (empty($employids)) {
            return collect();
        }

        return EmployeeDetail::on('masterlist')
            ->whereIn('employid', $employids)
            ->get(['employid', 'firstname', 'middlename', 'lastname'])
            ->keyBy('employid');
    }

    public function getActiveEmployeeList(array $params = []): array
    {
        $query = EmployeeDetail::where('accstatus', 1)
            ->where('employid', '!=', 0)
            ->whereRaw("CAST(employid AS CHAR) NOT LIKE '5%'")
            ->with(['workDetail.departmentRel', 'workDetail.teamRel']);

        // Search functionality
        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('employid', 'like', "%{$search}%")
                    ->orWhere('firstname', 'like', "%{$search}%")
                    ->orWhere('middlename', 'like', "%{$search}%")
                    ->orWhere('lastname', 'like', "%{$search}%");
            });
        }

        // Ordering
        $query->orderBy('firstname');

        // Pagination
        $perPage = $params['per_page'] ?? 50;
        $page = $params['page'] ?? 1;
        $paginated = $query->paginate($perPage, ['employid', 'firstname', 'middlename', 'lastname'], 'page', $page);

        return [
            'data' => $paginated->items(), // Now includes workDetail with relationships
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ];
    }
    public function getDirectReportIds(int $empId): array
    {
        return EmployeeDetail::where('accstatus', 1)
            ->where('employid', '!=', 0)
            ->whereHas('workDetail.approver', function ($q) use ($empId) {
                $q->where('approver1', $empId)
                    ->orWhere('approver2', $empId)
                    ->orWhere('approver3', $empId);
            })
            ->pluck('employid')
            ->toArray();
    }

    public function getStaffListWithWorkDetail(int $empId, array $params = []): array
    {
        $staffIds = $this->getDirectReportIds($empId);

        if (empty($staffIds)) {
            return [
                'data'         => [],
                'current_page' => 1,
                'last_page'    => 1,
                'per_page'     => (int) ($params['per_page'] ?? 25),
                'total'        => 0,
            ];
        }

        $query = EmployeeDetail::with([
            'workDetail.companyRel',
            'workDetail.departmentRel',
            'workDetail.jobTitleRel',
            'workDetail.prodLineRel',
            'workDetail.stationRel',
            'workDetail.teamRel',
            'workDetail.empPositionRel',
            'workDetail.statusRel',
            'workDetail.classRel',
            'workDetail.shiftRel',
            'workDetail.shuttleRel',
            'workDetail.govInfo',
        ])->whereIn('employid', $staffIds);

        if (!empty($params['search'])) {
            $s = $params['search'];
            $query->where(function ($q) use ($s) {
                $q->where('employid', 'like', "%{$s}%")
                    ->orWhere('firstname', 'like', "%{$s}%")
                    ->orWhere('lastname', 'like', "%{$s}%")
                    ->orWhere('middlename', 'like', "%{$s}%");
            });
        }

        $hasWorkFilter = !empty($params['company']) || !empty($params['department'])
            || !empty($params['status']) || !empty($params['class']);

        if ($hasWorkFilter) {
            $query->whereHas('workDetail', function ($q) use ($params) {
                if (!empty($params['company']))    $q->where('company',    $params['company']);
                if (!empty($params['department'])) $q->where('department', $params['department']);
                if (!empty($params['status']))     $q->where('empstatus',  $params['status']);
                if (!empty($params['class']))      $q->where('empclass',   $params['class']);
            });
        }

        $query->orderBy('firstname');
        $perPage   = (int) ($params['per_page'] ?? 25);
        $paginated = $query->paginate($perPage, ['*'], 'page', $params['page'] ?? 1);

        return [
            'data'         => $paginated->items(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
        ];
    }

    public function getAllForExport(array $params = []): Collection
    {
        $query = EmployeeDetail::with([
            'workDetail.companyRel',
            'workDetail.departmentRel',
            'workDetail.jobTitleRel',
            'workDetail.prodLineRel',
            'workDetail.stationRel',
            'workDetail.teamRel',
            'workDetail.empPositionRel',
            'workDetail.statusRel',
            'workDetail.classRel',
            'workDetail.shiftRel',
            'workDetail.shuttleRel',
            'workDetail.govInfo',
            'workDetail.approver.approver1Detail',
            'workDetail.approver.approver2Detail',
            'workDetail.approver.approver3Detail',
            'address',
            'parents',
            'spouse',
            'siblings',
            'children',
        ])
            ->where('accstatus', 1)
            ->where('employid', '!=', 0)
            ->whereRaw("CAST(employid AS CHAR) NOT LIKE '5%'");

        if (!empty($params['company'])) {
            $query->whereHas('workDetail', fn($q) => $q->where('company', $params['company']));
        }
        if (!empty($params['department'])) {
            $query->whereHas('workDetail', fn($q) => $q->where('department', $params['department']));
        }
        if (!empty($params['status'])) {
            $query->whereHas('workDetail', fn($q) => $q->where('empstatus', $params['status']));
        }
        if (!empty($params['class'])) {
            $query->whereHas('workDetail', fn($q) => $q->where('empclass', $params['class']));
        }

        return $query->orderBy('firstname')->get();
    }

    public function getDirectReports(int $empId): Collection
    {
        return EmployeeDetail::with([
            'workDetail.prodLineRel',
            'workDetail.departmentRel',
            'workDetail.stationRel',
            'workDetail.teamRel',
        ])
            ->where('accstatus', 1)
            ->where('employid', '!=', 0)
            ->whereHas('workDetail.approver', function ($q) use ($empId) {
                $q->where('approver1', $empId)
                    ->orWhere('approver2', $empId)
                    ->orWhere('approver3', $empId);
            })
            ->orderBy('firstname')
            ->get();
    }

    public function getOperationDirector(): ?EmployeeDetail
    {
        return EmployeeDetail::with('workDetail')
            ->whereHas('workDetail', fn($q) => $q->where('empposition', 6))
            ->first();
    }

    public function getBulkStaffInfo(array $empNos): Collection
    {
        return EmployeeDetail::with([
            'workDetail.departmentRel',
            'workDetail.prodLineRel',
            'workDetail.stationRel',
            'workDetail.teamRel',
            'workDetail.shiftRel',
        ])
            ->whereIn('employid', $empNos)
            ->get(['employid', 'firstname', 'middlename', 'lastname']);
    }
}
