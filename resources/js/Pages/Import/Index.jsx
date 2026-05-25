import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { useImport } from "@/Hooks/useImport";

const SHEET_DESCRIPTIONS = [
    ["Sheet 1", "Employee Details — personal info, static dropdowns"],
    ["Sheet 2", "Work Details — department, shift, etc. (live dropdowns)"],
    ["Sheet 3", "Address — current & permanent"],
    ["Sheet 4", "Government Info — TIN, SSS, PhilHealth, Pag-IBIG"],
    ["Sheet 5", "Approver — approver 1, 2, 3 (by employee ID)"],
    ["Sheet 6", "Parents — one row per parent"],
    ["Sheet 7", "Spouse — one row per spouse"],
    ["Sheet 8", "Children — one row per child"],
    ["Sheet 9", "Siblings — one row per sibling"],
];

export default function ImportIndex() {
    const { fileInputRef, file, dragging, setDragging, uploading, handleFile, handleDrop, handleSubmit } =
        useImport();

    return (
        <AuthenticatedLayout>
            <Head title="Employee Import" />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="border-b border-border/50 px-6 py-4">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
                            Employee Import
                        </h1>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                            Bulk-create or update employees via Excel template
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                    {/* Step 1 — Download template */}
                    <div className="rounded-xl border border-border/50 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[13px] font-semibold text-foreground">
                                    Step 1 — Download the template
                                </p>
                                <p className="text-[12px] text-muted-foreground mt-1">
                                    The template includes all sheets with live
                                    dropdowns populated from the current lookup
                                    tables.
                                </p>
                            </div>
                            <a href={route("import.template")} className="shrink-0">
                                <Button variant="outline" size="sm" className="text-[12px] gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Template
                                </Button>
                            </a>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px] text-muted-foreground/70">
                            {SHEET_DESCRIPTIONS.map(([sheet, desc]) => (
                                <div key={sheet} className="flex gap-2">
                                    <span className="font-mono font-semibold text-foreground/50 w-16 shrink-0">{sheet}</span>
                                    <span>{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 2 — Upload */}
                    <div className="rounded-xl border border-border/50 p-5">
                        <p className="text-[13px] font-semibold text-foreground mb-3">
                            Step 2 — Upload filled template
                        </p>

                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-lg px-6 py-10 text-center cursor-pointer transition-colors
                                ${dragging
                                    ? "border-primary bg-primary/5"
                                    : "border-border/50 hover:border-border hover:bg-muted/20"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />

                            {file ? (
                                <div className="space-y-1">
                                    <svg className="w-8 h-8 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-[13px] font-medium text-foreground">{file.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB — click to change
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <svg className="w-8 h-8 text-muted-foreground/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-[13px] text-muted-foreground">
                                        Drop your .xlsx file here, or click to browse
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={!file || uploading}
                                size="sm"
                                className="text-[12px] min-w-[110px]"
                            >
                                {uploading ? "Importing…" : "Import"}
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
