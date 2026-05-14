<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (int) session('emp_data.emp_id') === 0;
    }

    public function rules(): array
    {
        return [
            'table'       => ['required', 'string', 'in:personal,address,work,approver,family,gov_info'],
            'field'       => ['required', 'string', 'max:64'],
            'value'       => ['nullable'],
            'family_type' => ['nullable', 'string', 'in:parent,spouse,sibling,child'],
            'row_id'      => ['nullable', 'integer'],
        ];
    }
}
