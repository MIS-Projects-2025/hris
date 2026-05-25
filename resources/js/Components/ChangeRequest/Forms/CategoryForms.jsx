import { useState } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Combobox } from "@/Components/ui/combobox";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
            {label}
        </Label>
        {children}
    </div>
);

// Used for fields with ≤5 options (no search needed)
const Select = ({ value, onChange, options, placeholder = "Select..." }) => (
    <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
        <option value="" disabled>
            {placeholder}
        </option>
        {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>
                {o.label ?? o}
            </option>
        ))}
    </select>
);

// Used for fields with >5 options — searchable combobox
const SearchSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
}) => (
    <Combobox
        options={options}
        value={value ?? ""}
        onChange={(v) => onChange(v ?? "")}
        placeholder={placeholder}
        clearable={false}
        allowCustomValue
    />
);

// ─── NameForm ─────────────────────────────────────────────────────────────────

export function NameForm({ value, onChange }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

    return (
        <div className="grid grid-cols-1 gap-4">
            <Field label="First Name">
                <Input
                    value={value.firstname ?? ""}
                    onChange={set("firstname")}
                />
            </Field>
            <Field label="Middle Name">
                <Input
                    value={value.middlename ?? ""}
                    onChange={set("middlename")}
                />
            </Field>
            <Field label="Last Name">
                <Input
                    value={value.lastname ?? ""}
                    onChange={set("lastname")}
                />
            </Field>
        </div>
    );
}

// ─── CivilStatusForm — 5 options, plain Select ────────────────────────────────

const CIVIL_STATUS_OPTIONS = [
    "Single",
    "Married",
    "Widowed",
    "Separated",
    "Annulled",
];

export function CivilStatusForm({ value, onChange }) {
    return (
        <Field label="Civil Status">
            <Select
                value={value.civil_status}
                onChange={(v) => onChange({ civil_status: v })}
                options={CIVIL_STATUS_OPTIONS}
            />
        </Field>
    );
}

// ─── AddressForm ──────────────────────────────────────────────────────────────

export function AddressForm({ value, onChange }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

    return (
        <div className="space-y-5">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 font-mono mb-3">
                    Current Address
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="House / Unit No.">
                        <Input
                            value={value.house_no ?? ""}
                            onChange={set("house_no")}
                        />
                    </Field>
                    <Field label="Barangay">
                        <Input
                            value={value.brgy ?? ""}
                            onChange={set("brgy")}
                        />
                    </Field>
                    <Field label="City / Municipality">
                        <Input
                            value={value.city ?? ""}
                            onChange={set("city")}
                        />
                    </Field>
                    <Field label="Province">
                        <Input
                            value={value.province ?? ""}
                            onChange={set("province")}
                        />
                    </Field>
                </div>
            </div>

            <div className="border-t border-border/40 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 font-mono mb-3">
                    Permanent Address
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="House / Unit No.">
                        <Input
                            value={value.perma_house_no ?? ""}
                            onChange={set("perma_house_no")}
                        />
                    </Field>
                    <Field label="Barangay">
                        <Input
                            value={value.perma_brgy ?? ""}
                            onChange={set("perma_brgy")}
                        />
                    </Field>
                    <Field label="City / Municipality">
                        <Input
                            value={value.perma_city ?? ""}
                            onChange={set("perma_city")}
                        />
                    </Field>
                    <Field label="Province">
                        <Input
                            value={value.perma_province ?? ""}
                            onChange={set("perma_province")}
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
}

// ─── EducationForm — 7 options, searchable ────────────────────────────────────

const EDUCATION_OPTIONS = [
    "Elementary Graduate",
    "High School Graduate",
    "Senior High School Graduate",
    "Vocational / Technical",
    "College Level",
    "College Graduate",
    "Post Graduate",
].map((v) => ({ value: v, label: v }));

export function EducationForm({ value, onChange }) {
    return (
        <Field label="Educational Attainment">
            <SearchSelect
                value={value.educational_attainment}
                onChange={(v) => onChange({ educational_attainment: v })}
                options={EDUCATION_OPTIONS}
            />
        </Field>
    );
}

// ─── ParentForm (Father & Mother) ─────────────────────────────────────────────

export function ParentForm({ value, onChange, gender }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
                <Field label="Full Name">
                    <Input
                        value={value.parent_name ?? ""}
                        onChange={set("parent_name")}
                    />
                </Field>
            </div>
            <Field label="Birthday">
                <Input
                    type="date"
                    value={value.parent_bday ?? ""}
                    onChange={set("parent_bday")}
                />
            </Field>
            <Field label="Age">
                <Input
                    type="number"
                    value={value.parent_age ?? ""}
                    onChange={set("parent_age")}
                />
            </Field>
            {/* Gender is fixed — shown as read-only */}
            <div className="col-span-2">
                <Field label="Gender">
                    <Input
                        value={gender}
                        readOnly
                        className="bg-muted/30 cursor-not-allowed"
                    />
                </Field>
            </div>
        </div>
    );
}

// ─── FamilyTableForm (Children & Siblings) ────────────────────────────────────

// 2 options — plain Select
const GENDER_OPTIONS = ["Male", "Female"];

// config: { nameKey, bdayKey, ageKey, genderKey, rowLabel }
export function FamilyTableForm({ value = [], onChange, config }) {
    const { nameKey, bdayKey, ageKey, genderKey, rowLabel } = config;

    const addRow = () =>
        onChange([
            ...value,
            { [nameKey]: "", [bdayKey]: "", [ageKey]: "", [genderKey]: "" },
        ]);

    const updateRow = (idx, key, val) => {
        const next = value.map((row, i) =>
            i === idx ? { ...row, [key]: val } : row,
        );
        onChange(next);
    };

    const removeRow = (idx) => onChange(value.filter((_, i) => i !== idx));

    return (
        <div className="space-y-3">
            {value.length === 0 && (
                <p className="text-[12px] text-muted-foreground/50 italic py-2">
                    No {rowLabel}s added yet.
                </p>
            )}

            {value.map((row, idx) => (
                <div
                    key={idx}
                    className="rounded-lg border border-border/50 p-3 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground/60">
                            {rowLabel} {idx + 1}
                        </span>
                        <button
                            onClick={() => removeRow(idx)}
                            className="text-[11px] text-red-500 hover:text-red-600 font-mono transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Field label="Full Name">
                                <Input
                                    value={row[nameKey] ?? ""}
                                    onChange={(e) =>
                                        updateRow(idx, nameKey, e.target.value)
                                    }
                                />
                            </Field>
                        </div>
                        <Field label="Birthday">
                            <Input
                                type="date"
                                value={row[bdayKey] ?? ""}
                                onChange={(e) =>
                                    updateRow(idx, bdayKey, e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Age">
                            <Input
                                type="number"
                                value={row[ageKey] ?? ""}
                                onChange={(e) =>
                                    updateRow(idx, ageKey, e.target.value)
                                }
                            />
                        </Field>
                        <div className="col-span-2">
                            <Field label="Gender">
                                <Select
                                    value={row[genderKey]}
                                    onChange={(v) =>
                                        updateRow(idx, genderKey, v)
                                    }
                                    options={GENDER_OPTIONS}
                                />
                            </Field>
                        </div>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="w-full text-[12px] font-mono"
            >
                + Add {rowLabel}
            </Button>
        </div>
    );
}

// ─── SpouseForm ───────────────────────────────────────────────────────────────

export function SpouseForm({ value = [], onChange }) {
    return (
        <FamilyTableForm
            value={value}
            onChange={onChange}
            config={{
                nameKey: "spouse_name",
                bdayKey: "spouse_bday",
                ageKey: "spouse_age",
                genderKey: "spouse_gender",
                rowLabel: "Spouse",
            }}
        />
    );
}

// ─── OthersForm ───────────────────────────────────────────────────────────────

// 8 options — searchable
const BLOOD_TYPE_OPTIONS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
].map((v) => ({ value: v, label: v }));

// 7 options — searchable
const RELIGION_OPTIONS = [
    "Roman Catholic",
    "Islam",
    "Iglesia ni Cristo",
    "Born Again Christian",
    "Baptist",
    "Seventh Day Adventist",
    "Others",
].map((v) => ({ value: v, label: v }));

export function OthersForm({ value, onChange, shuttles = [] }) {
    const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

    const shuttleOptions = shuttles.map((s) => ({
        value: s.id,
        label: s.shuttle_name,
    }));

    return (
        <div className="grid grid-cols-2 gap-3">
            <Field label="Nickname">
                <Input
                    value={value.nickname ?? ""}
                    onChange={set("nickname")}
                />
            </Field>
            <Field label="Contact No">
                <Input
                    value={value.contact_no ?? ""}
                    onChange={set("contact_no")}
                />
            </Field>
            <div className="col-span-2">
                <Field label="Email">
                    <Input
                        type="email"
                        value={value.email ?? ""}
                        onChange={set("email")}
                    />
                </Field>
            </div>
            <Field label="Religion">
                <SearchSelect
                    value={value.religion}
                    onChange={(v) => onChange({ ...value, religion: v })}
                    options={RELIGION_OPTIONS}
                />
            </Field>
            <Field label="Blood Type">
                <SearchSelect
                    value={value.blood_type}
                    onChange={(v) => onChange({ ...value, blood_type: v })}
                    options={BLOOD_TYPE_OPTIONS}
                />
            </Field>
            <Field label="Height (cm)">
                <Input
                    type="number"
                    value={value.height ?? ""}
                    onChange={set("height")}
                />
            </Field>
            <Field label="Weight (kg)">
                <Input
                    type="number"
                    value={value.weight ?? ""}
                    onChange={set("weight")}
                />
            </Field>
            <div className="col-span-2">
                <Field label="Shuttle">
                    <Combobox
                        options={shuttleOptions}
                        value={value.shuttle ?? ""}
                        onChange={(v) =>
                            onChange({
                                ...value,
                                shuttle:
                                    v != null && v !== "" ? Number(v) : null,
                            })
                        }
                        placeholder="No shuttle assigned"
                        clearable
                        allowCustomValue={false}
                    />
                </Field>
            </div>
        </div>
    );
}
