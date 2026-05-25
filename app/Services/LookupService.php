<?php

namespace App\Services;

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
use App\Repositories\LookupRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class LookupService
{
    protected array $registry = [
        'companies' => [
            'label'     => 'Companies',
            'model'     => EmployeeCompany::class,
            'nameField' => 'company_name',
            'fields'    => [
                ['name' => 'company_name', 'label' => 'Company Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'departments' => [
            'label'     => 'Departments',
            'model'     => EmployeeDepartment::class,
            'nameField' => 'dept_name',
            'fields'    => [
                ['name' => 'dept_name',      'label' => 'Department Name', 'type' => 'text',   'required' => true],
                ['name' => 'pl_name',        'label' => 'Production Line', 'type' => 'text',   'required' => false],
                ['name' => 'dept_head_id',   'label' => 'Dept Head ID',    'type' => 'number', 'required' => false],
                ['name' => 'dept_head_name', 'label' => 'Dept Head Name',  'type' => 'text',   'required' => false],
            ],
        ],
        'prodlines' => [
            'label'     => 'Production Lines',
            'model'     => Prodline::class,
            'nameField' => 'pl_name',
            'fields'    => [
                ['name' => 'pl_name',    'label' => 'Production Line Name', 'type' => 'text',   'required' => true],
                ['name' => 'pl_head_id', 'label' => 'PL Head ID',           'type' => 'number', 'required' => false],
            ],
        ],
        'jobtitles' => [
            'label'     => 'Job Titles',
            'model'     => JobTitle::class,
            'nameField' => 'position',
            'fields'    => [
                ['name' => 'position',       'label' => 'Position',        'type' => 'text',     'required' => true],
                ['name' => 'application_id', 'label' => 'Application ID',  'type' => 'text',     'required' => false],
                ['name' => 'department',     'label' => 'Department',      'type' => 'text',     'required' => false],
                ['name' => 'position_level', 'label' => 'Position Level',  'type' => 'text',     'required' => false],
                ['name' => 'station',        'label' => 'Station',         'type' => 'text',     'required' => false],
                ['name' => 'status',         'label' => 'Status',          'type' => 'text',     'required' => false],
                ['name' => 'job_desc',       'label' => 'Job Description', 'type' => 'textarea', 'required' => false],
                ['name' => 'job_quali',      'label' => 'Qualifications',  'type' => 'textarea', 'required' => false],
            ],
        ],
        'stations' => [
            'label'     => 'Stations',
            'model'     => Station::class,
            'nameField' => 'station_name',
            'fields'    => [
                ['name' => 'station_name', 'label' => 'Station Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'statuses' => [
            'label'     => 'Employment Statuses',
            'model'     => EmployeeStatus::class,
            'nameField' => 'status_name',
            'fields'    => [
                ['name' => 'status_name', 'label' => 'Status Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'classes' => [
            'label'     => 'Employee Classes',
            'model'     => EmployeeClass::class,
            'nameField' => 'class_name',
            'fields'    => [
                ['name' => 'class_name', 'label' => 'Class Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'shifts' => [
            'label'     => 'Shift Types',
            'model'     => EmployeeShift::class,
            'nameField' => 'shift_name',
            'fields'    => [
                ['name' => 'shift_name', 'label' => 'Shift Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'shuttles' => [
            'label'     => 'Shuttles',
            'model'     => Shuttle::class,
            'nameField' => 'shuttle_name',
            'fields'    => [
                ['name' => 'shuttle_name', 'label' => 'Shuttle Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'positions' => [
            'label'     => 'Employee Positions',
            'model'     => EmployeePosition::class,
            'nameField' => 'emp_position_name',
            'fields'    => [
                ['name' => 'emp_position_name', 'label' => 'Position Name', 'type' => 'text', 'required' => true],
            ],
        ],
        'teams' => [
            'label'     => 'Teams',
            'model'     => Team::class,
            'nameField' => 'team_name',
            'fields'    => [
                ['name' => 'team_name', 'label' => 'Team Name', 'type' => 'text', 'required' => true],
            ],
        ],
    ];

    public function __construct(
        protected LookupRepository $repository
    ) {}

    /** Returns [slug => label] for all lookup types. */
    public function getTypes(): array
    {
        return array_map(fn($v) => $v['label'], $this->registry);
    }

    /** Returns the config for a given type slug, or aborts 422. */
    public function resolve(string $type): array
    {
        abort_unless(isset($this->registry[$type]), 422, "Unknown lookup type: {$type}");
        return $this->registry[$type];
    }

    public function all(string $type): Collection
    {
        $config = $this->resolve($type);
        return $this->repository->all($config['model'], $config['nameField']);
    }

    public function create(string $type, array $data): Model
    {
        $config = $this->resolve($type);
        return $this->repository->create($config['model'], $data);
    }

    public function update(string $type, int $id, array $data): bool
    {
        $config = $this->resolve($type);
        return $this->repository->update($config['model'], $id, $data);
    }

    public function delete(string $type, int $id): void
    {
        $config = $this->resolve($type);
        $this->repository->delete($config['model'], $id);
    }

    /** Builds Laravel validation rules from the field config. */
    public function validationRules(string $type): array
    {
        $config = $this->resolve($type);
        $rules  = [];

        foreach ($config['fields'] as $field) {
            $base      = $field['required'] ? ['required'] : ['nullable'];
            $typeRules = match ($field['type']) {
                'number'   => ['integer'],
                'textarea' => ['string', 'max:2000'],
                default    => ['string', 'max:255'],
            };

            $rules[$field['name']] = array_merge($base, $typeRules);
        }

        return $rules;
    }
}
