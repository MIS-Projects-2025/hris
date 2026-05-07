<?php

namespace App\Services;

use App\Repositories\EmployeeRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class EmployeeService
{
    public function __construct(
        protected EmployeeRepository $repository
    ) {}

    public function getFullDetail(int $employid): array
    {
        $employee = $this->repository->getFullDetailByEmployid($employid);

        if (!$employee) {
            return $this->notFound();
        }

        $work = $employee->workDetail;

        return [
            'success' => true,
            'message' => 'OK',
            'data'    => [
                // 👤 Personal
                'emp_id'                  => $employee->employid,
                'emp_name' => trim(implode('', array_filter([
                    $employee->lastname ? $employee->lastname . ', ' : '',
                    $employee->firstname ?? '',
                    $employee->middlename ? ' ' . strtoupper(substr($employee->middlename, 0, 1)) . '.' : ''
                ]))),
                'emp_firstname'           => $employee->firstname,
                'emp_middlename'          => $employee->middlename,
                'emp_lastname'            => $employee->lastname,
                'nickname'                => $employee->nickname,
                'birthday'                => $employee->birthday,
                'place_of_birth'          => $employee->place_of_birth,
                'emp_sex'                 => $employee->emp_sex,
                'email'                   => $employee->email,
                'contact_no'              => $employee->contact_no,
                'civil_status'            => $employee->civil_status,
                'religion'                => $employee->religion,
                'height'                  => $employee->height,
                'weight'                  => $employee->weight,
                'blood_type'              => $employee->blood_type,
                'educational_attainment'  => $employee->educational_attainment,
                'accstatus_id'            => $employee->accstatus,
                'accstatus'               => $employee->accstatus == 1 ? 'Active' : ($employee->accstatus == 2 ? 'Inactive' : 'Unknown'),
                // 🏠 Address
                'address' => $employee->address?->first() ? [
                    'house_no'       => $employee->address->first()->house_no,
                    'brgy'           => $employee->address->first()->brgy,
                    'city'           => $employee->address->first()->city,
                    'province'       => $employee->address->first()->province,

                    'perma_house_no' => $employee->address->first()->perma_house_no,
                    'perma_brgy'     => $employee->address->first()->perma_brgy,
                    'perma_city'     => $employee->address->first()->perma_city,
                    'perma_province' => $employee->address->first()->perma_province,
                ] : null,
                // 👨‍👩‍👧‍👦 Parents
                'parent' =>  $employee->parents->map(fn($p) => [
                    'id'             => $p->id,
                    'parent_name'   => $p->parent_name,
                    'parent_bday'   => $p->parent_bday,
                    'parent_age'    => $p->parent_age,
                    'parent_gender' => $p->parent_gender,
                ]),

                // 💍 Spouse
                'spouse' => $employee->spouse->map(fn($sp) => [
                    'id'             => $sp->id,
                    'spouse_name'   => $sp->spouse_name,
                    'spouse_bday'   => $sp->spouse_bday,
                    'spouse_age'    => $sp->spouse_age,
                    'spouse_gender' => $sp->spouse_gender,
                ]),

                // 👨‍👩‍👧 Family
                'siblings' =>  $employee->siblings->map(fn($s) => [
                    'id'             => $s->id,
                    'sibling_name'   => $s->sibling_name,
                    'sibling_bday'   => $s->sibling_bday,
                    'sibling_age'    => $s->sibling_age,
                    'sibling_gender' => $s->sibling_gender,
                ]),

                'children' => $employee->children->map(fn($c) => [
                    'id'           => $c->id,
                    'child_name'   => $c->child_name,
                    'child_bday'   => $c->child_bday,
                    'child_age'    => $c->child_age,
                    'child_gender' => $c->child_gender,
                ]),

                // 🏢 Work
                'company_id'      => $work->company       ?? null,
                'company'         => $work->companyRel->company_name ?? null,
                'emp_dept_id'      => $work->department   ?? null,
                'emp_dept'         => $work->departmentRel->dept_name ?? null,
                'emp_jobtitle_id'  => $work->job_title    ?? null,
                'emp_jobtitle'     => $work->jobTitleRel->position ?? null,
                'emp_prodline_id'  => $work->prodline     ?? null,
                'emp_prodline'     => $work->prodLineRel->pl_name ?? null,
                'emp_station_id'   => $work->station      ?? null,
                'emp_station'      => $work->stationRel->station_name ?? null,
                'team_id'          => $work->team         ?? null,
                'team'             => $work->teamRel->team_name ?? null,
                'emp_position_id'  => $work->empposition  ?? null,
                'emp_position'     => $work->empPositionRel->emp_position_name  ?? null,
                'emp_status_id'    => $work->empstatus    ?? null,
                'emp_status'       => $work->statusRel->status_name  ?? null,
                'emp_class_id'     => $work->empclass     ?? null,
                'emp_class'        => $work->classRel->class_name  ?? null,
                'shift_type_id'    => $work->shift_type   ?? null,
                'shift_type'       => $work->shiftRel->shift_name  ?? null,
                'shuttle_id'       => $work->shuttle      ?? null,
                'shuttle'          => $work->shuttleRel->shuttle_name ?? null,
                'date_hired'       => $work->date_hired   ?? null,
                'date_reg'         => $work->date_reg     ?? null,
                'service_length'   => $work->service_length ?? null,

                // 🏛 Government Info
                'gov_info' => $work && $work->govInfo ? [
                    'tin_no'         => $work->govInfo->tin_no,
                    'sss_no'         => $work->govInfo->sss_no,
                    'philhealth_no'  => $work->govInfo->philhealth_no,
                    'pagibig_no'     => $work->govInfo->pagibig_no,
                    'bank_acct_no'   => $work->govInfo->bank_acct_no,
                ] : null,

                // 👤 Approvers - Using eager loaded data (NO N+1 queries!)
                'approver' => $this->formatApproverData($work->approver ?? null),
            ],
        ];
    }

    /**
     * Format approver data using already loaded relationships
     * This method does NOT execute additional database queries
     */
    private function formatApproverData($approver): ?array
    {
        if (!$approver) {
            return null;
        }

        return [
            // Approver 1
            'approver1_id' => $approver->approver1,
            'approver1' => $this->formatApproverName($approver->approver1, $approver->approver1Detail),

            // Approver 2
            'approver2_id' => $approver->approver2,
            'approver2' => $this->formatApproverName($approver->approver2, $approver->approver2Detail),

            // Approver 3
            'approver3_id' => $approver->approver3,
            'approver3' => $this->formatApproverName($approver->approver3, $approver->approver3Detail),
        ];
    }

    /**
     * Format single approver name as "ID - Full Name"
     */
    private function formatApproverName($approverId, $approverDetail): ?string
    {
        if (!$approverId) {
            return null;
        }

        if ($approverDetail) {
            $fullName = trim(implode(' ', array_filter([$approverDetail->firstname, $approverDetail->middlename, $approverDetail->lastname])));
            return $approverId . ' - ' . $fullName;
        }

        return (string) $approverId;
    }

    public function getIndexLookups(): array
    {
        return $this->repository->getIndexLookups();
    }

    public function getAdminLookups(): array
    {
        return $this->repository->getAdminLookups();
    }

    // ── Admin direct-write methods ────────────────────────────────────────────

    private const PERSONAL_FIELDS = [
        'firstname',
        'middlename',
        'lastname',
        'nickname',
        'birthday',
        'place_of_birth',
        'emp_sex',
        'email',
        'contact_no',
        'civil_status',
        'religion',
        'height',
        'weight',
        'blood_type',
        'educational_attainment',
        'accstatus',
    ];
    private const WORK_FIELDS = [
        'company',
        'department',
        'job_title',
        'prodline',
        'station',
        'team',
        'empposition',
        'empstatus',
        'empclass',
        'shift_type',
        'shuttle',
        'date_hired',
        'date_reg',
    ];
    private const ADDRESS_FIELDS = [
        'house_no',
        'brgy',
        'city',
        'province',
        'perma_house_no',
        'perma_brgy',
        'perma_city',
        'perma_province',
    ];
    private const APPROVER_FIELDS = ['approver1', 'approver2', 'approver3'];
    private const FAMILY_FIELDS = [
        'parent'  => ['parent_name', 'parent_bday', 'parent_age', 'parent_gender'],
        'spouse'  => ['spouse_name', 'spouse_bday', 'spouse_age', 'spouse_gender'],
        'sibling' => ['sibling_name', 'sibling_bday', 'sibling_age', 'sibling_gender'],
        'child'   => ['child_name', 'child_bday', 'child_age', 'child_gender'],
    ];

    public function adminUpdateField(int $empId, string $table, string $field, mixed $value, ?string $familyType = null, ?int $rowId = null): void
    {
        match ($table) {
            'address'  => $this->guardAndCall(self::ADDRESS_FIELDS,  $field, fn() => $this->repository->updateAddressField($empId, $field, $value)),
            'approver' => $this->guardAndCall(self::APPROVER_FIELDS, $field, fn() => $this->repository->updateApproverField($empId, $field, $value)),
            'work'     => $this->guardAndCall(self::WORK_FIELDS,     $field, fn() => $this->repository->updateWorkField($empId, $field, $value)),
            'family'   => $this->doFamilyUpdate($familyType, $rowId, $empId, $field, $value),
            default    => $this->guardAndCall(self::PERSONAL_FIELDS,  $field, fn() => $this->repository->updatePersonalField($empId, $field, $value)),
        };
    }

    public function adminAddFamilyRow(int $empId, string $familyType, array $data): void
    {
        abort_if(!array_key_exists($familyType, self::FAMILY_FIELDS), 422, 'Unknown family type.');

        $bdayKey = match ($familyType) {
            'parent'  => 'parent_bday',
            'spouse'  => 'spouse_bday',
            'sibling' => 'sibling_bday',
            'child'   => 'child_bday',
        };
        if (!empty($data[$bdayKey])) {
            $ageKey = str_replace('_bday', '_age', $bdayKey);
            $data[$ageKey] = Carbon::parse($data[$bdayKey])->age;
        }

        $this->repository->addFamilyRow($familyType, $empId, $data);
    }

    public function adminDeleteFamilyRow(int $empId, string $familyType, int $rowId): void
    {
        abort_if(!array_key_exists($familyType, self::FAMILY_FIELDS), 422, 'Unknown family type.');
        $this->repository->deleteFamilyRow($familyType, $rowId, $empId);
    }

    private function guardAndCall(array $allowed, string $field, callable $fn): void
    {
        abort_if(!in_array($field, $allowed), 422, "Unknown field: {$field}");
        $fn();
    }

    private function doFamilyUpdate(?string $familyType, ?int $rowId, int $empId, string $field, mixed $value): void
    {
        abort_if(!$familyType || !array_key_exists($familyType, self::FAMILY_FIELDS), 422, 'Unknown family type.');
        abort_if(!in_array($field, self::FAMILY_FIELDS[$familyType]), 422, "Unknown family field: {$field}");
        abort_if(!$rowId, 422, 'row_id required for family update.');

        $payload = [$field => $value ?: null];
        if (str_ends_with($field, '_bday') && $value) {
            $ageField = str_replace('_bday', '_age', $field);
            $payload[$ageField] = Carbon::parse($value)->age;
        }

        $this->repository->updateFamilyRow($familyType, $rowId, $empId, $payload);
    }

    public function getAuthDetail(int $employid): array
    {
        $employee = $this->repository->getAuthDetailByEmployid($employid);

        if (!$employee) {
            return $this->notFound();
        }

        $work = $employee->workDetail;

        return [
            'success' => true,
            'message' => 'OK',
            'data'    => [
                'emp_id'          => $employee->employid,
                'emp_name'        => trim(implode(' ', array_filter([$employee->firstname, $employee->middlename, $employee->lastname]))),
                'emp_firstname'   => $employee->firstname,
                'accstatus'       => $employee->accstatus,
                'emp_dept_id'     => $work->department    ?? null,
                'emp_jobtitle_id' => $work->job_title     ?? null,
                'emp_prodline_id' => $work->prodline      ?? null,
                'emp_position_id' => $work->empposition   ?? null,
                'emp_station_id'  => $work->station       ?? null,
            ],
        ];
    }

    public function getWorkDetail(int $employid): array
    {
        $work = $this->repository->getWorkDetailByEmployid($employid);

        if (!$work) {
            return $this->notFound();
        }

        return [
            'success' => true,
            'message' => 'OK',
            'data'    => [
                'accstatus'        => $work->accstatus ?? null,
                'emp_id'          => $work->employid,
                'emp_dept_id'     => $work->department,
                'emp_dept'        => $work->departmentRel->dept_name          ?? null,
                'emp_jobtitle_id' => $work->job_title,
                'emp_jobtitle'    => $work->jobTitleRel->position              ?? null,
                'emp_prodline_id' => $work->prodline,
                'emp_prodline'    => $work->prodLineRel->pl_name               ?? null,
                'emp_station_id'  => $work->station,
                'emp_station'     => $work->stationRel->station_name           ?? null,
                'company_id'      => $work->company,
                'company'         => $work->companyRel->company_name           ?? null,
                'team_id'     => $work->team,
                'team'        => $work->teamRel->team_name                 ?? null,
                'emp_position_id' => $work->empposition,
                'emp_position'    => $work->empPositionRel->emp_position_name  ?? null,
                'emp_status_id'    => $work->empstatus    ?? null,
                'emp_status'       => $work->statusRel->status_name  ?? null,
                'emp_class_id'     => $work->empclass     ?? null,
                'emp_class'        => $work->classRel->class_name  ?? null,
                'shift_type_id'    => $work->shift_type   ?? null,
                'shift_type'       => $work->shiftRel->shift_name  ?? null,
                'shuttle_id'       => $work->shuttle      ?? null,
                'shuttle'          => $work->shuttleRel->shuttle_name ?? null,
                'date_hired'      => $work->date_hired,
                'date_reg'        => $work->date_reg,
                'service_length'  => $work->service_length,
                // Add approvers to work detail as well
                'approver'        => $this->formatApproverData($work->approver ?? null),
            ],
        ];
    }
    public function getEmployeeListForTable(array $params = []): array
    {
        $result = $this->repository->getEmployeeListWithWorkDetail($params);

        $result['data'] = array_map(function ($e) {
            $work = $e->workDetail;

            return [
                // Personal
                'emp_id'                 => $e->employid,
                'firstname'              => $e->firstname,
                'middlename'             => $e->middlename,
                'lastname'               => $e->lastname,
                'nickname'               => $e->nickname,
                'birthday'               => $e->birthday,
                'place_of_birth'         => $e->place_of_birth,
                'emp_sex'                => $e->emp_sex == 1 ? 'Male' : ($e->emp_sex == 2 ? 'Female' : null),
                'civil_status'           => $e->civil_status,
                'religion'               => $e->religion,
                'blood_type'             => $e->blood_type,
                'height'                 => $e->height,
                'weight'                 => $e->weight,
                'email'                  => $e->email,
                'contact_no'             => $e->contact_no,
                'educational_attainment' => $e->educational_attainment,

                // Work
                'company'       => $work?->companyRel?->company_name,
                'dept'          => $work?->departmentRel?->dept_name,
                'job_title'     => $work?->jobTitleRel?->position,
                'prod_line'     => $work?->prodLineRel?->pl_name,
                'station'       => $work?->stationRel?->station_name,
                'team'          => $work?->teamRel?->team_name,
                'emp_position'  => $work?->empPositionRel?->emp_position_name,
                'emp_status'    => $work?->statusRel?->status_name,
                'emp_class'     => $work?->classRel?->class_name,
                'shift_type'    => $work?->shiftRel?->shift_name,
                'shuttle'       => $work?->shuttleRel?->shuttle_name,
                'date_hired'    => $work?->date_hired,
                'date_reg'      => $work?->date_reg,
                'service_length' => $work?->service_length,

                // Government
                'tin_no'        => $work?->govInfo?->tin_no,
                'sss_no'        => $work?->govInfo?->sss_no,
                'philhealth_no' => $work?->govInfo?->philhealth_no,
                'pagibig_no'    => $work?->govInfo?->pagibig_no,
                'bank_acct_no'  => $work?->govInfo?->bank_acct_no,
            ];
        }, $result['data']);

        return $result;
    }

    public function getActiveEmployeeList(array $params = []): array
    {
        $result = $this->repository->getActiveEmployeeList($params);

        // Format the data with department and team
        $result['data'] = array_map(function ($e) {
            $work = $e->workDetail;

            return [
                'employid' => $e->employid,
                'emp_name' => trim(implode('', array_filter([
                    !empty($e->lastname) ? $e->lastname . ', ' : '',
                    $e->firstname ?? '',
                    !empty($e->middlename) ? ' ' . strtoupper(substr($e->middlename, 0, 1)) . '.' : ''
                ]))),

                'department' => $work->departmentRel->dept_name ?? null,
                'team' => $work->teamRel->team_name ?? null,
            ];
        }, $result['data']);

        return $result;
    }
    public function getActivityHistory(int $empId, int $page): array
    {
        $result = $this->repository->getActivityLogs($empId, $page);

        $actorIds = $result['items']->pluck('action_by')->filter()->unique()->values()->toArray();
        $names    = $this->repository->getEmployeeNames($actorIds);

        $data = $result['items']->map(function ($log) use ($names) {
            $id = $log->action_by;

            $actorName = match (true) {
                $id === 0        => 'System Admin',
                $names->has($id) => trim(implode(' ', array_filter([
                    $names[$id]->firstname,
                    $names[$id]->middlename,
                    $names[$id]->lastname,
                ]))),
                default          => "Employee #{$id}",
            };

            return [
                'id'             => $log->id,
                'action_type'    => $log->action_type,
                'section'        => class_basename($log->loggable_type),
                'action_by_id'   => $id,
                'action_by_name' => $actorName,
                'action_at'      => $log->action_at?->format('Y-m-d H:i:s'),
                'old_values'     => $log->old_values,
                'new_values'     => $log->new_values,
                'remarks'        => $log->remarks,
            ];
        });

        return [
            'data'         => $data->values()->toArray(),
            'current_page' => $result['current_page'],
            'last_page'    => $result['last_page'],
            'total'        => $result['total'],
            'has_more'     => $result['has_more'],
        ];
    }
    public function getDirectReports(int $empId): array
    {
        $employees = $this->repository->getDirectReports($empId);

        $data = $employees->map(function ($e) {
            $work = $e->workDetail;

            return [
                'emp_id'         => $e->employid,
                'emp_name' => trim(
                    (!empty($e->lastname) ? $e->lastname . ', ' : '') .
                        ($e->firstname ?? '') .
                        (!empty($e->middlename) ? ' ' . strtoupper(substr($e->middlename, 0, 1)) . '.' : '')
                ),
                'prodline_id'    => $work->prodline ?? null,
                'prodline'       => $work->prodLineRel->pl_name ?? null,
                'department_id'  => $work->department ?? null,
                'department'     => $work->departmentRel->dept_name ?? null,
                'station_id'     => $work->station ?? null,
                'station'        => $work->stationRel->station_name ?? null,
            ];
        })->values()->all();

        return [
            'success' => true,
            'message' => 'OK',
            'data'    => $data,
        ];
    }

    public function getOperationDirector(): ?array
    {
        $director = $this->repository->getOperationDirector();

        if (!$director) {
            return null;
        }

        return [
            'emp_id' => $director->employid,
            'name'   => trim(implode(' ', array_filter([$director->firstname, $director->middlename, $director->lastname]))),
        ];
    }
    public function getBulkStaffInfo(array $empNos): array
    {
        $data = $this->repository->getBulkStaffInfo($empNos)
            ->mapWithKeys(fn($e) => [
                $e->employid => [
                    'emp_name'   => trim(
                        (!empty($e->lastname)    ? $e->lastname . ', ' : '') .
                            ($e->firstname           ?? '') .
                            (!empty($e->middlename)  ? ' ' . strtoupper(substr($e->middlename, 0, 1)) . '.' : '')
                    ),
                    'department' => $e->workDetail?->departmentRel?->dept_name,
                    'prodline'   => $e->workDetail?->prodLineRel?->pl_name,
                    'station'    => $e->workDetail?->stationRel?->station_name,
                    'team'       => $e->workDetail?->teamRel?->team_name,
                    'shift'      => $e->workDetail?->shiftRel?->shift_name,
                ],
            ])->all();

        return ['success' => true, 'message' => 'OK', 'data' => $data];
    }


    public function getBulkNames(array $employids): array
    {
        $names = $this->repository->getEmployeeNames($employids);

        $data = $names->map(fn($e) => [
            'emp_id'   => $e->employid,
            'emp_name' => trim(implode('', array_filter([
                !empty($e->lastname)   ? $e->lastname . ', ' : '',
                $e->firstname          ?? '',
                !empty($e->middlename) ? ' ' . strtoupper(substr($e->middlename, 0, 1)) . '.' : '',
            ]))),
        ])->all();

        return [
            'success' => true,
            'message' => 'OK',
            'data'    => $data, // keyed by employid for O(1) lookup
        ];
    }
    private function notFound(): array
    {
        return [
            'success' => false,
            'message' => 'Employee not found.',
        ];
    }
}
