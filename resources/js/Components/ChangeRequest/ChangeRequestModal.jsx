import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";

// ─── Attachment Picker ────────────────────────────────────────────────────────

function AttachmentPicker({ value, onChange, loading }) {
    const { attachments: existing = [] } = usePage().props;
    const [tab, setTab] = useState("upload"); // "upload" | "existing"
    const [dragActive, setDragActive] = useState(false);

    const handleFile = (file) => {
        if (!file) return;
        const valid = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf",
        ];
        if (!valid.includes(file.type)) {
            toast.error("Only JPEG, PNG, or PDF allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File must be under 5MB.");
            return;
        }
        onChange({ type: "new", file });
    };

    const handleExisting = (attachment) => {
        onChange({ type: "existing", attachmentId: attachment.id, attachment });
    };

    return (
        <div className="space-y-3">
            {/* Tabs */}
            <div className="flex border-b border-border/50 gap-4">
                {["upload", "existing"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`pb-2 text-[11px] font-semibold uppercase tracking-widest font-mono transition-colors relative
                            ${tab === t ? "text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                    >
                        {t === "upload"
                            ? "Upload New"
                            : `Use Existing (${existing.length ?? 0})`}
                        {tab === t && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {tab === "upload" && (
                <div
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
                        ${dragActive ? "border-primary/60 bg-primary/5" : "border-border/50 hover:border-border"}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        handleFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() =>
                        document.getElementById("cr-file-input")?.click()
                    }
                >
                    <input
                        id="cr-file-input"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                    {value?.type === "new" ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="text-[13px] font-medium text-foreground">
                                {value.file.name}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(null);
                                }}
                                className="text-muted-foreground/60 hover:text-foreground ml-1"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <>
                            <svg
                                className="w-7 h-7 mx-auto text-muted-foreground/40 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <p className="text-[12px] text-muted-foreground">
                                Drag & drop or click to upload
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1">
                                PDF, JPEG, PNG — max 5MB
                            </p>
                        </>
                    )}
                </div>
            )}

            {tab === "existing" && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {loading && (
                        <p className="text-[12px] text-muted-foreground/50 py-4 text-center">
                            Loading...
                        </p>
                    )}
                    {!loading && existing.length === 0 && (
                        <p className="text-[12px] text-muted-foreground/50 py-4 text-center italic">
                            No uploaded files yet.
                        </p>
                    )}
                    {existing.map((att) => (
                        <button
                            key={att.id}
                            onClick={() => handleExisting(att)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors
                                ${
                                    value?.type === "existing" &&
                                    value.attachmentId === att.id
                                        ? "border-primary/60 bg-primary/5"
                                        : "border-border/40 hover:border-border hover:bg-muted/30"
                                }`}
                        >
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                {att.is_image ? (
                                    <svg
                                        className="w-4 h-4 text-muted-foreground"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M4 16l4-4 4 4 4-6 4 6M4 4h16v16H4z"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-4 h-4 text-muted-foreground"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 12h6m-3-3v6M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[12.5px] font-medium text-foreground truncate">
                                    {att.original_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground/60">
                                    {att.description} · {att.size}
                                </p>
                            </div>
                            {value?.type === "existing" &&
                                value.attachmentId === att.id && (
                                    <svg
                                        className="w-4 h-4 text-primary shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Diff Preview ─────────────────────────────────────────────────────────────

function DiffPreview({ oldValue, newValue }) {
    const keys = [
        ...new Set([
            ...Object.keys(oldValue ?? {}),
            ...Object.keys(newValue ?? {}),
        ]),
    ];

    const formatVal = (v) => {
        if (v === null || v === undefined || v === "")
            return (
                <span className="text-muted-foreground/40 italic">empty</span>
            );
        if (Array.isArray(v))
            return (
                <span className="text-muted-foreground/60 text-[11px]">
                    {v.length} row(s)
                </span>
            );
        return String(v);
    };

    const changed = keys.filter(
        (k) => String(oldValue?.[k] ?? "") !== String(newValue?.[k] ?? ""),
    );

    if (changed.length === 0) return null;

    return (
        <div className="rounded-lg border border-border/40 overflow-hidden">
            <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/60">
                Changes preview
            </div>
            <div className="divide-y divide-border/30">
                {changed.map((key) => (
                    <div
                        key={key}
                        className="grid grid-cols-3 items-start px-3 py-2 text-[12.5px]"
                    >
                        <span className="text-muted-foreground/60 font-mono text-[11px] pt-0.5">
                            {key}
                        </span>
                        <span className="text-red-600 dark:text-red-400 line-through pr-2 break-words">
                            {formatVal(oldValue?.[key])}
                        </span>
                        <span className="text-green-700 dark:text-green-400 break-words">
                            {formatVal(newValue?.[key])}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const ATTACHMENT_REQUIRED = ["name", "civil_status", "education", "spouse"];

const CATEGORY_LABELS = {
    name: "Name",
    civil_status: "Civil Status",
    address: "Address",
    education: "Education",
    father: "Father",
    mother: "Mother",
    spouse: "Spouse",
    children: "Children",
    siblings: "Siblings",
    others: "Others",
};

export default function ChangeRequestModal({
    open,
    onClose,
    employid,
    category,
    oldValue,
    newValue, // controlled from parent form
    children, // the form component rendered inside
    onSuccess,
    existingRequest, // pending request for this category (if any)
    attachmentsLoading = false,
}) {
    const [attachment, setAttachment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const requiresAttachment = ATTACHMENT_REQUIRED.includes(category);

    // Reset attachment when modal opens
    useEffect(() => {
        if (open) setAttachment(null);
    }, [open, category]);

    const handleSubmit = () => {
        if (requiresAttachment && !attachment) {
            toast.error("Please attach a supporting document.");
            return;
        }

        setSubmitting(true);

        const formData = new FormData();
        formData.append("employid", employid);
        formData.append("category", category);
        formData.append("old_value", JSON.stringify(oldValue));
        formData.append("new_value", JSON.stringify(newValue));

        if (attachment?.type === "new") {
            formData.append("file", attachment.file);
        } else if (attachment?.type === "existing") {
            formData.append("attachment_id", attachment.attachmentId);
        }

        router.post(route("change-requests.store"), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Change request submitted. Pending HR approval.");
                onClose();
            },
            onError: (errors) => {
                toast.error(errors.message ?? "Failed to submit request.");
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[15px]">
                        Edit {CATEGORY_LABELS[category]}
                        {existingRequest?.status === "pending" && (
                            <Badge className="text-[10px] font-mono bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0">
                                pending approval
                            </Badge>
                        )}
                        {existingRequest?.status === "rejected" && (
                            <Badge
                                variant="destructive"
                                className="text-[10px] font-mono"
                            >
                                previously rejected
                            </Badge>
                        )}
                    </DialogTitle>
                    {existingRequest?.status === "rejected" &&
                        existingRequest.remarks && (
                            <p className="text-[12px] text-red-600 dark:text-red-400 mt-1">
                                HR note: {existingRequest.remarks}
                            </p>
                        )}
                </DialogHeader>

                <div className="space-y-5 mt-2">
                    {/* Form content injected from parent */}
                    {children}

                    {/* Diff preview */}
                    <DiffPreview oldValue={oldValue} newValue={newValue} />

                    {/* Attachment */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
                                Supporting Document
                            </p>
                            {requiresAttachment ? (
                                <span className="text-[10px] text-red-500 font-mono">
                                    required
                                </span>
                            ) : (
                                <span className="text-[10px] text-muted-foreground/40 font-mono">
                                    optional
                                </span>
                            )}
                        </div>
                        <AttachmentPicker
                            value={attachment}
                            onChange={setAttachment}
                            loading={attachmentsLoading}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit for Approval"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
