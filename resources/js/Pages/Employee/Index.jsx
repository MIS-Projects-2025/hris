import { useState, useEffect, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/Components/ui/input";
import EmployeeTable from "@/Components/Employee/EmployeeTable";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Combobox } from "@/Components/ui/combobox";

export default function EmployeeIndex({ employees, filters, lookups, isStaffOnly = false }) {
    // ─────────────────────────────
    // SERVER STATE (source of truth)
    // ─────────────────────────────
    const serverFilters = {
        search: filters.search ?? "",
        company: filters.company ?? "",
        department: filters.department ?? "",
        status: filters.status ?? "",
        class: filters.class ?? "",
        per_page: String(employees.per_page ?? filters.per_page ?? "25"),
    };

    // ─────────────────────────────
    // LOCAL STATE (UI only)
    // ─────────────────────────────
    const [localFilters, setLocalFilters] = useState(serverFilters);

    // ─────────────────────────────
    // REQUEST CONTROL (ENTERPRISE FIX)
    // ─────────────────────────────
    const lastRequestRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // ─────────────────────────────
    // ENCODE (UNCHANGED)
    // ─────────────────────────────
    function encodeFilters(f) {
        return btoa(JSON.stringify(f));
    }

    // ─────────────────────────────
    // SAFE APPLY FILTERS (NO DUPLICATES)
    // ─────────────────────────────
    function applyFilters(f) {
        const encoded = encodeFilters(f);

        // 🚨 prevent duplicate requests
        if (lastRequestRef.current === encoded) return;

        lastRequestRef.current = encoded;

        router.get(
            route("employees.index"),
            { filters: encoded },
            {
                preserveScroll: true,
                replace: true,
                preserveState: true,
            },
        );
    }

    // ─────────────────────────────
    // PAGINATION
    // ─────────────────────────────
    function goToPage(page) {
        const updated = { ...localFilters, page };
        setLocalFilters(updated);
        applyFilters(updated);
    }

    // ─────────────────────────────
    // SERVER → UI SYNC (SAFE, NO LOOP)
    // ─────────────────────────────
    useEffect(() => {
        setLocalFilters(serverFilters);
    }, [employees.current_page, employees.per_page]);

    // ─────────────────────────────
    // SEARCH DEBOUNCE ONLY (ENTERPRISE)
    // ─────────────────────────────
    useEffect(() => {
        if (localFilters.search === serverFilters.search) return;

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            applyFilters({ ...localFilters, page: 1 });
        }, 400);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [localFilters.search]);

    // ─────────────────────────────
    // PAGINATION CALC
    // ─────────────────────────────
    const { current_page, last_page, total, per_page } = employees;

    const from = (current_page - 1) * per_page + 1;
    const to = Math.min(current_page * per_page, total);

    function pageWindow() {
        const pages = [];
        const start = Math.max(1, current_page - 2);
        const end = Math.min(last_page, current_page + 2);

        if (start > 1) pages.push(1);
        if (start > 2) pages.push("...");

        for (let i = start; i <= end; i++) pages.push(i);

        if (end < last_page - 1) pages.push("...");
        if (end < last_page) pages.push(last_page);

        return pages;
    }

    const toOptions = (obj) =>
        Object.entries(obj).map(([value, label]) => ({
            value,
            label,
        }));

    // ─────────────────────────────
    // RENDER
    // ─────────────────────────────
    return (
        <AuthenticatedLayout>
            <Head title="Employees" />

            <div className="min-h-screen bg-background">
                {/* HEADER */}
                <div className="border-b border-border/50 px-6 py-4">
                    <h1 className="text-[18px] font-semibold">
                        {isStaffOnly ? "My Staff" : "Employees"}
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        {total.toLocaleString()} active employee
                        {total !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="px-6 py-6">
                    {/* FILTERS */}
                    <div className="flex items-center gap-2 mb-5 overflow-x-auto">
                        {/* SEARCH (debounced) */}
                        <div className="relative shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
                            <Input
                                value={localFilters.search}
                                onChange={(e) =>
                                    setLocalFilters((f) => ({
                                        ...f,
                                        search: e.target.value,
                                    }))
                                }
                                placeholder="Search name or ID…"
                                className="pl-8 w-56 text-[12px] h-8"
                            />
                        </div>

                        <div className="h-5 w-px bg-border shrink-0" />

                        {/* COMBOBOX FILTERS (instant apply) */}
                        {[
                            ["company", lookups.companies, "All Companies"],
                            [
                                "department",
                                lookups.departments,
                                "All Departments",
                            ],
                            ["status", lookups.statuses, "All Statuses"],
                            ["class", lookups.classes, "All Classes"],
                        ].map(([key, options, placeholder]) => (
                            <Combobox
                                key={key}
                                options={toOptions(options)}
                                value={localFilters[key]}
                                onChange={(val) => {
                                    const updated = {
                                        ...localFilters,
                                        [key]: val || "",
                                    };

                                    setLocalFilters(updated);
                                    applyFilters({ ...updated, page: 1 });
                                }}
                                placeholder={placeholder}
                                className="h-8 text-[12px]"
                            />
                        ))}

                        {/* CLEAR */}
                        {(localFilters.search ||
                            localFilters.company ||
                            localFilters.department ||
                            localFilters.status ||
                            localFilters.class) && (
                            <button
                                onClick={() => {
                                    const cleared = {
                                        search: "",
                                        company: "",
                                        department: "",
                                        status: "",
                                        class: "",
                                        per_page: localFilters.per_page,
                                    };

                                    setLocalFilters(cleared);
                                    applyFilters({ ...cleared, page: 1 });
                                }}
                                className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground"
                            >
                                × Clear
                            </button>
                        )}
                    </div>

                    {/* TABLE */}
                    <EmployeeTable data={employees.data} />

                    {/* PAGINATION */}
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-[12px] text-muted-foreground/60 font-mono">
                            Showing {from.toLocaleString()}–
                            {to.toLocaleString()} of {total.toLocaleString()}
                        </p>

                        <Combobox
                            options={[10, 25, 50, 100].map((n) => ({
                                value: String(n),
                                label: `${n} / page`,
                            }))}
                            value={String(localFilters.per_page)}
                            onChange={(val) => {
                                const updated = {
                                    ...localFilters,
                                    per_page: val,
                                };

                                setLocalFilters(updated);
                                applyFilters({ ...updated, page: 1 });
                            }}
                            className="h-7 text-[12px] w-[110px]"
                            clearable={false}
                        />

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={current_page === 1}
                                onClick={() => goToPage(current_page - 1)}
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>

                            {pageWindow().map((p, i) =>
                                p === "..." ? (
                                    <span
                                        key={i}
                                        className="px-1 text-[12px] text-muted-foreground/40"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-7 h-7 rounded text-[11px] font-mono ${
                                            current_page === p
                                                ? "bg-foreground text-background"
                                                : "hover:bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ),
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={current_page === last_page}
                                onClick={() => goToPage(current_page + 1)}
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
