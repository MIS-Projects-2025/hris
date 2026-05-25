<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Model;

class EmployeeWorkDetail extends Model
{
    use Loggable;
    protected $table = 'employee_work_details';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'employid',
        'company',
        'department',
        'prodline',
        'job_title',
        'station',
        'team',
        'empstatus',
        'empclass',
        'empposition',
        'shift_type',
        'shuttle',
        'date_hired',
        'date_reg',
        'service_length',
    ];
    public function getAccstatusAttribute()
    {
        return $this->employee ? $this->employee->accstatus : null;
    }
    public function employee()
    {
        return $this->belongsTo(EmployeeDetail::class, 'employid', 'employid');
    }

    // =========================
    // LOOKUP RELATIONSHIPS
    // =========================
    public function companyRel()
    {
        return $this->belongsTo(EmployeeCompany::class, 'company');
    }
    public function departmentRel()
    {
        return $this->belongsTo(EmployeeDepartment::class, 'department');
    }

    public function empPositionRel()
    {
        return $this->belongsTo(EmployeePosition::class, 'empposition');
    }

    public function jobTitleRel()
    {
        return $this->belongsTo(JobTitle::class, 'job_title');
    }

    public function prodLineRel()
    {
        return $this->belongsTo(Prodline::class, 'prodline');
    }

    public function stationRel()
    {
        return $this->belongsTo(Station::class, 'station');
    }
    public function teamRel()
    {
        return $this->belongsTo(Team::class, 'team');
    }

    public function statusRel()
    {
        return $this->belongsTo(EmployeeStatus::class, 'empstatus');
    }

    public function classRel()
    {
        return $this->belongsTo(EmployeeClass::class, 'empclass');
    }

    public function shiftRel()
    {
        return $this->belongsTo(EmployeeShift::class, 'shift_type');
    }

    public function shuttleRel()
    {
        return $this->belongsTo(Shuttle::class, 'shuttle');
    }

    // Update this relationship to include the detail relationships
    public function approver()
    {
        return $this->hasOne(EmployeeApprover::class, 'employid', 'employid');
    }

    public function govInfo()
    {
        return $this->hasOne(EmployeeGovInfo::class, 'employid', 'employid');
    }
}
