import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import { Combobox } from "@/Components/ui/combobox";
import { initials, avatarPalette } from "@/Helpers/employee";

export default function AdminApproverCard({ label, value, approverField, approverId, employid }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState(approverId ?? null);
    const [saving, setSaving]   = useState(false);

    const namePart = value
        ? (value.includes(" - ") ? value.split(" - ").slice(1).join(" - ") : value)
        : null;
    const idPart = value?.includes(" - ") ? value.split(" - ")[0] : null;
    const resolvedId = idPart ? parseInt(idPart, 10) : null;
    const pal = avatarPalette(resolvedId ?? 0);

    const loadOptions = useCallback((search, page) =>
        new Promise((resolve) => {
            router.reload({
                only: ["activeEmployees"],
                data: { q: btoa(JSON.stringify({ search, page, per_page: 50 })) },
                onSuccess: (pg) => {
                    const result = pg.props.activeEmployees;
                    resolve({
                        options: (result?.data ?? result ?? []).map((emp) => ({
                            value: emp.employid,
                            label: `${emp.employid} — ${emp.emp_name}`,
                        })),
                        hasMore: (result?.current_page ?? 1) < (result?.last_page ?? 1),
                    });
                },
                onError: () => resolve({ options: [], hasMore: false }),
            });
        }), []);

    const save = () => {
        setSaving(true);
        router.patch(
            route("employees.admin-update", { employid }),
            { table: "approver", field: approverField, value: draft },
            {
                preserveScroll: true,
                onSuccess: () => { setEditing(false); setSaving(false); },
                onError:   () => setSaving(false),
            },
        );
    };

    if (editing) {
        return (
            <div className="flex flex-col gap-2 rounded-xl border border-border/50 px-4 py-3 bg-muted/10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">{label}</p>
                <Combobox
                    value={draft}
                    onChange={setDraft}
                    loadOptions={loadOptions}
                    clearable
                    style={{ height: "30px", fontSize: "12px" }}
                    placeholder="Search employee…"
                />
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-foreground text-background hover:bg-foreground/80 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setEditing(false); setDraft(approverId ?? null); }}
                        disabled={saving}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/70"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 bg-muted/10 group cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => { setDraft(approverId ?? null); setEditing(true); }}
            title="Click to edit"
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 ${namePart ? pal.bg + " " + pal.text : "bg-muted text-muted-foreground"}`}>
                {namePart ? initials(namePart) : "?"}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5 flex items-center gap-1.5">
                    {label}
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-0 group-hover:opacity-60 transition-opacity">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293z"/>
                    </svg>
                </p>
                <p className="text-[13px] font-medium text-foreground truncate leading-snug">
                    {namePart ?? <span className="text-muted-foreground/30 font-normal italic">Not set</span>}
                </p>
                {idPart && <p className="text-[11px] font-mono text-muted-foreground/50">ID {idPart}</p>}
            </div>
        </div>
    );
}
