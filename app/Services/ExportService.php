<?php

namespace App\Services;

use App\Exports\EmployeeMasterlistExport;
use App\Repositories\EmployeeRepository;

class ExportService
{
    public function __construct(
        protected EmployeeRepository $repository,
    ) {}

    public function getLookups(): array
    {
        return $this->repository->getIndexLookups();
    }

    public function buildExport(array $filters = []): EmployeeMasterlistExport
    {
        $employees = $this->repository->getAllForExport(array_filter([
            'company'    => $filters['company']    ?? null,
            'department' => $filters['department'] ?? null,
            'status'     => $filters['status']     ?? null,
            'class'      => $filters['class']      ?? null,
        ]));

        $sections = $filters['sections'] ?? [
            'personal', 'work', 'address', 'gov_info',
            'approver', 'parents', 'spouse', 'children', 'siblings',
        ];

        return new EmployeeMasterlistExport($employees, $sections);
    }
}
