<?php

namespace App\Http\Controllers\General;

use App\Http\Controllers\Controller;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function __construct(
        protected ExportService $exportService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Export/Index', [
            'lookups' => $this->exportService->getLookups(),
        ]);
    }

    public function download(Request $request): BinaryFileResponse
    {
        $filters = $request->validate([
            'company'    => ['nullable', 'string'],
            'department' => ['nullable', 'string'],
            'status'     => ['nullable', 'string'],
            'class'      => ['nullable', 'string'],
            'sections'   => ['nullable', 'array'],
            'sections.*' => ['string', 'in:personal,work,address,gov_info,approver,parents,spouse,children,siblings'],
        ]);

        $export = $this->exportService->buildExport($filters);

        return Excel::download($export, 'masterlist-export-' . date('Y-m-d') . '.xlsx');
    }
}
