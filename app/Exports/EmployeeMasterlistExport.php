<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeeMasterlistExport implements WithMultipleSheets
{
    public function __construct(
        private readonly Collection $employees,
        private readonly array      $sections,
    ) {}

    public function sheets(): array
    {
        $sheets = [];

        if (in_array('personal', $this->sections)) {
            $sheets[] = $this->makeSheet(
                'Employee Details',
                ['Employee ID', 'First Name', 'Middle Name', 'Last Name', 'Nickname',
                 'Birthday', 'Place of Birth', 'Sex', 'Email', 'Contact No.',
                 'Civil Status', 'Religion', 'Height (cm)', 'Weight (kg)', 'Blood Type',
                 'Educational Attainment'],
                [14, 18, 18, 18, 14, 20, 22, 10, 26, 16, 16, 16, 12, 12, 12, 26],
                $this->employees->map(fn($e) => [
                    $e->employid,
                    $e->firstname,
                    $e->middlename,
                    $e->lastname,
                    $e->nickname,
                    $e->birthday,
                    $e->place_of_birth,
                    $e->emp_sex == 1 ? 'Male' : ($e->emp_sex == 2 ? 'Female' : null),
                    $e->email,
                    $e->contact_no,
                    $e->civil_status,
                    $e->religion,
                    $e->height,
                    $e->weight,
                    $e->blood_type,
                    $e->educational_attainment,
                ])->values()->toArray()
            );
        }

        if (in_array('work', $this->sections)) {
            $sheets[] = $this->makeSheet(
                'Work Details',
                ['Employee ID', 'Company', 'Department', 'Production Line', 'Job Title',
                 'Station', 'Team', 'Employment Status', 'Employment Class', 'Shift Type',
                 'Shuttle', 'Position', 'Date Hired', 'Date Regular'],
                [14, 18, 22, 22, 28, 18, 14, 22, 20, 20, 18, 20, 24, 24],
                $this->employees->map(fn($e) => [
                    $e->employid,
                    $e->workDetail?->companyRel?->company_name,
                    $e->workDetail?->departmentRel?->dept_name,
                    $e->workDetail?->prodLineRel?->pl_name,
                    $e->workDetail?->jobTitleRel?->position,
                    $e->workDetail?->stationRel?->station_name,
                    $e->workDetail?->teamRel?->team_name,
                    $e->workDetail?->statusRel?->status_name,
                    $e->workDetail?->classRel?->class_name,
                    $e->workDetail?->shiftRel?->shift_name,
                    $e->workDetail?->shuttleRel?->shuttle_name,
                    $e->workDetail?->empPositionRel?->emp_position_name,
                    $e->workDetail?->date_hired,
                    $e->workDetail?->date_reg,
                ])->values()->toArray()
            );
        }

        if (in_array('address', $this->sections)) {
            $sheets[] = $this->makeSheet(
                'Address',
                ['Employee ID', 'House No.', 'Barangay', 'City', 'Province',
                 'Perma House No.', 'Perma Barangay', 'Perma City', 'Perma Province'],
                [14, 16, 20, 20, 20, 18, 20, 20, 20],
                $this->employees->map(fn($e) => [
                    $e->employid,
                    $e->address?->first()?->house_no,
                    $e->address?->first()?->brgy,
                    $e->address?->first()?->city,
                    $e->address?->first()?->province,
                    $e->address?->first()?->perma_house_no,
                    $e->address?->first()?->perma_brgy,
                    $e->address?->first()?->perma_city,
                    $e->address?->first()?->perma_province,
                ])->values()->toArray()
            );
        }

        if (in_array('gov_info', $this->sections)) {
            $sheets[] = $this->makeSheet(
                'Government Info',
                ['Employee ID', 'TIN No.', 'SSS No.', 'PhilHealth No.', 'Pag-IBIG No.', 'Bank Account No.'],
                [14, 18, 18, 18, 18, 22],
                $this->employees->map(fn($e) => [
                    $e->employid,
                    $e->workDetail?->govInfo?->tin_no,
                    $e->workDetail?->govInfo?->sss_no,
                    $e->workDetail?->govInfo?->philhealth_no,
                    $e->workDetail?->govInfo?->pagibig_no,
                    $e->workDetail?->govInfo?->bank_acct_no,
                ])->values()->toArray()
            );
        }

        if (in_array('approver', $this->sections)) {
            $sheets[] = $this->makeSheet(
                'Approvers',
                ['Employee ID', 'Approver 1 ID', 'Approver 2 ID', 'Approver 3 ID'],
                [14, 16, 16, 16],
                $this->employees->map(fn($e) => [
                    $e->employid,
                    $e->workDetail?->approver?->approver1,
                    $e->workDetail?->approver?->approver2,
                    $e->workDetail?->approver?->approver3,
                ])->values()->toArray()
            );
        }

        if (in_array('parents', $this->sections)) {
            $rows = [];
            foreach ($this->employees as $e) {
                foreach ($e->parents as $p) {
                    $rows[] = [$e->employid, $p->parent_name, $p->parent_bday, $p->parent_age, $p->parent_gender];
                }
            }
            $sheets[] = $this->makeSheet(
                'Parents',
                ['Employee ID', 'Name', 'Birthday', 'Age', 'Gender'],
                [14, 28, 20, 8, 12],
                $rows
            );
        }

        if (in_array('spouse', $this->sections)) {
            $rows = [];
            foreach ($this->employees as $e) {
                foreach ($e->spouse as $sp) {
                    $rows[] = [$e->employid, $sp->spouse_name, $sp->spouse_bday, $sp->spouse_age, $sp->spouse_gender];
                }
            }
            $sheets[] = $this->makeSheet(
                'Spouse',
                ['Employee ID', 'Name', 'Birthday', 'Age', 'Gender'],
                [14, 28, 20, 8, 12],
                $rows
            );
        }

        if (in_array('children', $this->sections)) {
            $rows = [];
            foreach ($this->employees as $e) {
                foreach ($e->children as $c) {
                    $rows[] = [$e->employid, $c->child_name, $c->child_bday, $c->child_age, $c->child_gender];
                }
            }
            $sheets[] = $this->makeSheet(
                'Children',
                ['Employee ID', 'Name', 'Birthday', 'Age', 'Gender'],
                [14, 28, 20, 8, 12],
                $rows
            );
        }

        if (in_array('siblings', $this->sections)) {
            $rows = [];
            foreach ($this->employees as $e) {
                foreach ($e->siblings as $s) {
                    $rows[] = [$e->employid, $s->sibling_name, $s->sibling_bday, $s->sibling_age, $s->sibling_gender];
                }
            }
            $sheets[] = $this->makeSheet(
                'Siblings',
                ['Employee ID', 'Name', 'Birthday', 'Age', 'Gender'],
                [14, 28, 20, 8, 12],
                $rows
            );
        }

        return $sheets;
    }

    private function makeSheet(string $title, array $headings, array $widths, array $data): object
    {
        return new class($title, $headings, $widths, $data) implements
            WithTitle, WithHeadings, FromArray, WithColumnWidths, WithStyles
        {
            public function __construct(
                private string $sheetTitle,
                private array  $sheetHeadings,
                private array  $colWidths,
                private array  $rows,
            ) {}

            public function title(): string  { return $this->sheetTitle; }
            public function headings(): array { return $this->sheetHeadings; }
            public function array(): array    { return $this->rows; }

            public function columnWidths(): array
            {
                $letters = range('A', 'Z');
                $result  = [];
                foreach ($this->colWidths as $i => $w) {
                    $result[$letters[$i]] = $w;
                }
                return $result;
            }

            public function styles(Worksheet $sheet): array
            {
                $sheet->freezePane('A2');
                return [
                    1 => [
                        'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                        'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E3A5F']],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    ],
                ];
            }
        };
    }
}
