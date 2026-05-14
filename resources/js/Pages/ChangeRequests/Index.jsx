import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/Components/ui/combobox";
import { DatePicker } from "@/Components/ui/date-picker";
import StatusBadge from "@/Components/ChangeRequest/StatusBadge";
import DiffCell from "@/Components/ChangeRequest/DiffCell";
import ActionCell from "@/Components/ChangeRequest/ActionCell";
import AttachmentCell from "@/Components/ChangeRequest/AttachmentCell";
import { useChangeRequests } from "@/Hooks/useChangeRequests";

// ─── Reusable request table ───────────────────────────────────────────────────

function RequestTable({ requests, shuttles, onApprove, onReject, showActions, selectedIds, onToggle, onToggleAll, onPageChange }) {
    // ResourceCollection wraps pagination under `.meta`
    const meta = requests.meta ?? {};
    const allSelected =
        requests.data.length > 0 &&
        requests.data.every((r) => selectedIds.includes(r.id));

    const cols = showActions
        ? ["", "Employee", "Category", "Changes", "Attachment", "Submitted By", "Date", "Status", "Actions"]
        : ["Employee", "Category", "Changes", "Attachment", "Submitted By", "Date", "Status"];

    return (
        <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                            {showActions && (
                                <th className="px-4 py-3 w-8">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(e) => onToggleAll(e.target.checked)}
                                        className="rounded border-border"
                                    />
                                </th>
                            )}
                            {cols.slice(showActions ? 1 : 0).map((col) => (
                                <th
                                    key={col}
                                    className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono px-4 py-3 whitespace-nowrap"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {requests.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={cols.length}
                                    className="text-center py-12 text-[13px] text-muted-foreground/40 italic"
                                >
                                    No change requests found.
                                </td>
                            </tr>
                        )}
                        {requests.data.map((req) => (
                            <tr
                                key={req.id}
                                className="hover:bg-muted/20 transition-colors align-top"
                            >
                                {showActions && (
                                    <td className="px-4 py-3">
                                        {req.status === "pending" && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(req.id)}
                                                onChange={() => onToggle(req.id)}
                                                className="rounded border-border"
                                            />
                                        )}
                                    </td>
                                )}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-[13px] font-mono font-semibold text-foreground">
                                        {req.employid}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-[11px] font-mono font-semibold bg-muted/50 border border-border/40 rounded px-2 py-0.5 text-muted-foreground">
                                        {req.category_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 max-w-[280px]">
                                    <DiffCell
                                        oldValue={req.old_value}
                                        newValue={req.new_value}
                                        category={req.category}
                                        shuttles={shuttles}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <AttachmentCell attachment={req.attachment} />
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-[12.5px] text-foreground/80">
                                        {req.requested_by?.name}
                                    </p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-[12px] font-mono text-muted-foreground/70">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={req.status} />
                                    {req.remarks && (
                                        <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[140px]">
                                            {req.remarks}
                                        </p>
                                    )}
                                </td>
                                {showActions && (
                                    <td className="px-4 py-3">
                                        <ActionCell
                                            request={req}
                                            onApprove={onApprove}
                                            onReject={onReject}
                                        />
                                        {req.status === "approved" && (
                                            <p className="text-[11px] text-muted-foreground/50 font-mono">
                                                by {req.reviewed_by?.name}
                                            </p>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {meta.total > 0 && (
                <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between bg-muted/10">
                    <p className="text-[12px] text-muted-foreground/60 font-mono">
                        {meta.from != null
                            ? `Showing ${meta.from}–${meta.to} of ${meta.total}`
                            : `${meta.total} record${meta.total !== 1 ? "s" : ""}`}
                    </p>
                    {meta.last_page > 1 && (
                        <div className="flex gap-1">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    className={`w-7 h-7 rounded text-[11px] font-mono transition-colors
                                        ${meta.current_page === page
                                            ? "bg-foreground text-background"
                                            : "hover:bg-muted text-muted-foreground"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkActionBar({ selectedIds, onClear }) {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [approveRemarks, setApproveRemarks] = useState("");
    const [rejectRemarks, setRejectRemarks] = useState("");
    const [loading, setLoading] = useState(false);

    const count = selectedIds.length;
    if (count === 0) return null;

    const handleBulkApprove = () => {
        setLoading(true);
        router.post(
            route("change-requests.bulk-approve"),
            { ids: selectedIds, remarks: approveRemarks },
            {
                preserveScroll: true,
                only: ["requests"],
                onFinish: () => {
                    setLoading(false);
                    setApproveRemarks("");
                    onClear();
                },
            }
        );
    };

    const handleBulkReject = () => {
        if (!rejectRemarks.trim()) return;
        setLoading(true);
        router.post(
            route("change-requests.bulk-reject"),
            { ids: selectedIds, remarks: rejectRemarks },
            {
                preserveScroll: true,
                only: ["requests"],
                onFinish: () => {
                    setLoading(false);
                    setRejectRemarks("");
                    setShowRejectForm(false);
                    onClear();
                },
            }
        );
    };

    return (
        <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 flex flex-wrap items-start gap-3">
            <span className="text-[12px] font-mono font-semibold text-foreground/70 pt-1.5">
                {count} selected
            </span>

            <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Approve with optional remarks */}
                <div className="flex items-center gap-1.5">
                    <Input
                        value={approveRemarks}
                        onChange={(e) => setApproveRemarks(e.target.value)}
                        placeholder="Approve remarks (optional)…"
                        className="h-8 text-[12px] w-52"
                    />
                    <button
                        onClick={handleBulkApprove}
                        disabled={loading}
                        className="h-8 px-3 rounded bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Approve All
                    </button>
                </div>

                <span className="text-muted-foreground/40 text-[12px]">|</span>

                {/* Reject with required remarks */}
                {!showRejectForm ? (
                    <button
                        onClick={() => setShowRejectForm(true)}
                        className="h-8 px-3 rounded border border-destructive/60 text-destructive text-[12px] font-semibold hover:bg-destructive/10"
                    >
                        Reject All…
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <Input
                            value={rejectRemarks}
                            onChange={(e) => setRejectRemarks(e.target.value)}
                            placeholder="Rejection reason (required)…"
                            className="h-8 text-[12px] w-60"
                        />
                        <button
                            onClick={handleBulkReject}
                            disabled={loading || !rejectRemarks.trim()}
                            className="h-8 px-3 rounded bg-destructive text-white text-[12px] font-semibold hover:bg-destructive/90 disabled:opacity-50"
                        >
                            Confirm Reject
                        </button>
                        <button
                            onClick={() => setShowRejectForm(false)}
                            className="h-8 px-3 rounded text-[12px] text-muted-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={onClear}
                className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground pt-1.5"
            >
                × Clear
            </button>
        </div>
    );
}

// ─── Shared filter bar ────────────────────────────────────────────────────────

function FilterBar({ localFilters, setLocalFilters, applyFilters, categories, showEmployeeSearch = true }) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex gap-1 border border-border/50 rounded-lg p-1 bg-muted/20">
                {["pending", "approved", "rejected", "all"].map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setLocalFilters((f) => ({ ...f, status: s }));
                            applyFilters({ status: s });
                        }}
                        className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors
                            ${localFilters.status === s
                                ? "bg-background text-foreground shadow-sm border border-border/50"
                                : "text-muted-foreground/60 hover:text-muted-foreground"
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <Combobox
                options={Object.entries(categories).map(([k, v]) => ({ value: k, label: v }))}
                value={localFilters.category ?? ""}
                onChange={(val) => {
                    const category = val ?? "";
                    setLocalFilters((f) => ({ ...f, category }));
                    applyFilters({ category });
                }}
                placeholder="All Categories"
                allowCustomValue={false}
                className="h-8 text-[12px] w-44"
            />

            {showEmployeeSearch && (
                <Input
                    value={localFilters.employid ?? ""}
                    onChange={(e) =>
                        setLocalFilters((f) => ({ ...f, employid: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    placeholder="Employee ID…"
                    className="w-36 text-[12px] h-8 font-mono"
                />
            )}

            <DatePicker
                value={localFilters.date_from ?? ""}
                onChange={(val) => {
                    const date_from = val ?? "";
                    setLocalFilters((f) => ({ ...f, date_from }));
                    applyFilters({ date_from });
                }}
                placeholder="From date"
                className="w-36"
            />
            <span className="text-muted-foreground/40 text-[12px]">—</span>
            <DatePicker
                value={localFilters.date_to ?? ""}
                onChange={(val) => {
                    const date_to = val ?? "";
                    setLocalFilters((f) => ({ ...f, date_to }));
                    applyFilters({ date_to });
                }}
                placeholder="To date"
                className="w-36"
            />
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChangeRequestsIndex({
    // Admin props
    requests,
    // Non-admin props
    isAdmin = true,
    hasStaff = false,
    ownRequests,
    staffRequests,
    // Shared
    filters,
    categories,
    shuttles = [],
}) {
    const { localFilters, setLocalFilters, applyFilters, handleApprove, handleReject } =
        useChangeRequests(filters);

    // Admin bulk selection state
    const [selectedIds, setSelectedIds] = useState([]);
    const toggleId = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    const toggleAll = (checked) => {
        if (!requests) return;
        const pendingIds = requests.data
            .filter((r) => r.status === "pending")
            .map((r) => r.id);
        setSelectedIds(checked ? pendingIds : []);
    };

    // Non-admin tab state
    const [activeTab, setActiveTab] = useState("own");

    // ─── Admin view ───────────────────────────────────────────────────────────
    if (isAdmin) {
        return (
            <AuthenticatedLayout>
                <Head title="Change Requests — HR Queue" />

                <div className="min-h-screen bg-background">
                    <div className="border-b border-border/50 px-6 py-4">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
                                Change Requests
                            </h1>
                            <p className="text-[13px] text-muted-foreground mt-0.5">
                                Review and action employee profile update requests
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <FilterBar
                            localFilters={localFilters}
                            setLocalFilters={setLocalFilters}
                            applyFilters={applyFilters}
                            categories={categories}
                            showEmployeeSearch
                        />

                        <BulkActionBar
                            selectedIds={selectedIds}
                            onClear={() => setSelectedIds([])}
                        />

                        <RequestTable
                            requests={requests}
                            shuttles={shuttles}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            showActions
                            selectedIds={selectedIds}
                            onToggle={toggleId}
                            onToggleAll={toggleAll}
                            onPageChange={(page) => applyFilters({ page })}
                        />
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // ─── Non-admin view (own + optional staff tabs) ───────────────────────────
    const activeRequests = activeTab === "own" ? ownRequests : staffRequests;

    return (
        <AuthenticatedLayout>
            <Head title="Change Requests" />

            <div className="min-h-screen bg-background">
                <div className="border-b border-border/50 px-6 py-4">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-[18px] font-semibold text-foreground tracking-tight">
                            Change Requests
                        </h1>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                            Track submitted profile update requests
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Tabs */}
                    {hasStaff && (
                        <div className="border-b border-border/50 flex gap-5 mb-6">
                            {[
                                { key: "own", label: "Own Records" },
                                { key: "staff", label: "Staff Records" },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`pb-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                                        activeTab === key
                                            ? "border-foreground text-foreground"
                                            : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    <FilterBar
                        localFilters={localFilters}
                        setLocalFilters={setLocalFilters}
                        applyFilters={applyFilters}
                        categories={categories}
                        showEmployeeSearch={activeTab === "staff"}
                    />

                    {activeRequests && (
                        <RequestTable
                            requests={activeRequests}
                            shuttles={shuttles}
                            onApprove={null}
                            onReject={null}
                            showActions={false}
                            selectedIds={[]}
                            onToggle={() => {}}
                            onToggleAll={() => {}}
                            onPageChange={(page) => applyFilters({ page })}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
