<?php

namespace App\Imports\Resolvers;

use App\Models\EmployeeClass;
use App\Models\EmployeeCompany;
use App\Models\EmployeeDepartment;
use App\Models\EmployeePosition;
use App\Models\EmployeeShift;
use App\Models\EmployeeStatus;
use App\Models\JobTitle;
use App\Models\Prodline;
use App\Models\Shuttle;
use App\Models\Station;
use App\Models\Team;

class LookupResolver
{
    private array $maps = [];

    public function boot(): void
    {
        $this->maps['company']     = EmployeeCompany::pluck('id', 'company_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['department']  = EmployeeDepartment::pluck('id', 'dept_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['prodline']    = Prodline::pluck('id', 'pl_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['job_title']   = JobTitle::pluck('id', 'position')->map(fn($id) => (int) $id)->toArray();
        $this->maps['station']     = Station::pluck('id', 'station_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['empstatus']   = EmployeeStatus::pluck('id', 'status_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['empclass']    = EmployeeClass::pluck('id', 'class_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['shift_type']  = EmployeeShift::pluck('id', 'shift_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['shuttle']     = Shuttle::pluck('id', 'shuttle_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['empposition'] = EmployeePosition::pluck('id', 'emp_position_name')->map(fn($id) => (int) $id)->toArray();
        $this->maps['team']        = Team::pluck('id', 'team_name')->map(fn($id) => (int) $id)->toArray();
    }

    /**
     * Resolve a display name to its numeric ID.
     * Returns null if the value is blank or not found in the lookup map.
     */
    public function resolve(string $field, mixed $value): ?int
    {
        $value = trim((string) ($value ?? ''));

        if ($value === '') {
            return null;
        }

        return $this->maps[$field][$value] ?? null;
    }

    /**
     * Same as resolve() but adds an error entry when the value cannot be resolved.
     */
    public function resolveOrError(string $field, mixed $value, int $row, string $label, array &$errors): ?int
    {
        $id = $this->resolve($field, $value);

        if ($id === null && trim((string) ($value ?? '')) !== '') {
            $errors[] = [
                'row'     => $row,
                'field'   => $label,
                'message' => "\"$value\" not found in lookup.",
            ];
        }

        return $id;
    }
}
