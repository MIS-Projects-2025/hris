import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const ALL_SECTIONS = [
    { key: "personal",  label: "Employee Details (Personal)" },
    { key: "work",      label: "Work Details" },
    { key: "address",   label: "Address" },
    { key: "gov_info",  label: "Government Information" },
    { key: "approver",  label: "Approvers" },
    { key: "parents",   label: "Parents" },
    { key: "spouse",    label: "Spouse" },
    { key: "children",  label: "Children" },
    { key: "siblings",  label: "Siblings" },
];

export default function ExportIndex({ lookups }) {
    const [filters, setFilters] = useState({
        company:    "",
        department: "",
        status:     "",
        class:      "",
    });
    const [sections, setSections] = useState(
        ALL_SECTIONS.map((s) => s.key)
    );
    const [loading, setLoading] = useState(false);

    const toOptions = (obj) =>
        Object.entries(obj).map(([value, label]) => ({ value, label }));

    const toggleSection = (key) => {
        setSections((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleDownload = () => {
        if (sections.length === 0) return;
        setLoading(true);

        // Build form and submit (triggers file download)
        const form = document.createElement("form");
        form.method = "POST";
        form.action = route("export.download");

        // CSRF
        const csrf = document.createElement("input");
        csrf.type = "hidden";
        csrf.name = "_token";
        csrf.value = document.querySelector('meta[name="csrf-token"]')?.content ?? "";
        form.appendChild(csrf);

        // Filters
        Object.entries(filters).forEach(([key, val]) => {
            if (val) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = val;
                form.appendChild(input);
            }
        });

        // Sections
        sections.forEach((sec) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "sections[]";
            input.value = sec;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Re-enable button after a short delay (download is async on client side)
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Export Masterlist" />

            <div className="min-h-screen bg-background">
                <div className="border-b border-border/50 px-6 py-4">
                    <h1 className="text-[18px] font-semibold">Export Masterlist</h1>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        Filter employees and select sections to export as Excel
                    </p>
                </div>

                <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                    {/* ── Filters ── */}
                    <section>
                        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono mb-4">
                            Filters
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ["company",    lookups.companies,   "All Companies"],
                                ["department", lookups.departments, "All Departments"],
                                ["status",     lookups.statuses,    "All Statuses"],
                                ["class",      lookups.classes,     "All Classes"],
                            ].map(([key, options, placeholder]) => (
                                <div key={key}>
                                    <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-1.5">
                                        {placeholder.replace("All ", "")}
                                    </label>
                                    <Combobox
                                        options={toOptions(options)}
                                        value={filters[key]}
                                        onChange={(val) =>
                                            setFilters((f) => ({ ...f, [key]: val ?? "" }))
                                        }
                                        placeholder={placeholder}
                                        className="h-9 text-[13px]"
                                    />
                                </div>
                            ))}
                        </div>

                        {(filters.company || filters.department || filters.status || filters.class) && (
                            <button
                                onClick={() =>
                                    setFilters({ company: "", department: "", status: "", class: "" })
                                }
                                className="mt-2 text-[12px] text-muted-foreground/50 hover:text-muted-foreground"
                            >
                                × Clear filters
                            </button>
                        )}
                    </section>

                    {/* ── Sections ── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
                                Sections to Export
                            </h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSections(ALL_SECTIONS.map((s) => s.key))}
                                    className="text-[12px] text-muted-foreground hover:text-foreground"
                                >
                                    Select all
                                </button>
                                <button
                                    onClick={() => setSections([])}
                                    className="text-[12px] text-muted-foreground hover:text-foreground"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {ALL_SECTIONS.map(({ key, label }) => (
                                <label
                                    key={key}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                                        sections.includes(key)
                                            ? "border-foreground/40 bg-muted/40"
                                            : "border-border/40 hover:border-border/70"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={sections.includes(key)}
                                        onChange={() => toggleSection(key)}
                                        className="rounded border-border"
                                    />
                                    <span className="text-[13px]">{label}</span>
                                </label>
                            ))}
                        </div>

                        {sections.length === 0 && (
                            <p className="mt-2 text-[12px] text-destructive/70">
                                Select at least one section to export.
                            </p>
                        )}
                    </section>

                    {/* ── Download ── */}
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            onClick={handleDownload}
                            disabled={loading || sections.length === 0}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            {loading ? "Preparing…" : "Download Excel"}
                        </Button>
                        <p className="text-[12px] text-muted-foreground/50">
                            Exports all active employees matching the selected filters.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
