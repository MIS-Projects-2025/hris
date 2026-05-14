import { memo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";

import EditSectionDropdown from "@/Components/ChangeRequest/EditSectionDropdown";
import ChangeRequestModal from "@/Components/ChangeRequest/ChangeRequestModal";
import {
    NameForm,
    CivilStatusForm,
    AddressForm,
    EducationForm,
    ParentForm,
    SpouseForm,
    FamilyTableForm,
    OthersForm,
} from "@/Components/ChangeRequest/Forms/CategoryForms";

import {
    Field,
    SectionDivider,
    MetaChip,
    FamilyTable,
    TabBtn,
    ApproverCard,
} from "@/Components/Employee/EmployeeComponents";
import AdminEditableField from "@/Components/Employee/AdminEditableField";
import AdminFamilyTable from "@/Components/Employee/AdminFamilyTable";
import AdminApproverCard from "@/Components/Employee/AdminApproverCard";
import FilesTab from "@/Components/Employee/FilesTab";
import ActivityLogModal from "@/Components/Employee/ActivityLogModal";
import { useEmployeeShow } from "@/Hooks/useEmployeeShow";
import { Clock, ClockIcon } from "lucide-react";

const EmployeeCombobox = memo(Combobox);

const SEX_LABELS = { 1: "Male", 2: "Female" };
const SEX_OPTIONS = [
    { value: 1, label: "Male" },
    { value: 2, label: "Female" },
];
const CIVIL_STATUS_OPTIONS = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Widowed", label: "Widowed" },
    { value: "Separated", label: "Separated" },
    { value: "Divorced", label: "Divorced" },
];
const ACCOUNT_STATUS_OPTIONS = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
];
// ─── Pending badge shown under a section title ────────────────────────────────

function PendingBadge({ request }) {
    if (!request) return null;

    if (request.status === "pending") {
        return (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                ⏳ pending approval
            </span>
        );
    }
    if (request.status === "rejected") {
        return (
            <span
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                title={request.remarks ?? ""}
            >
                ❌ rejected {request.remarks ? `— ${request.remarks}` : ""}
            </span>
        );
    }
    return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EmployeeShow({
    employee,
    shuttles = [],
    changeRequests = {},
    attachments,
    adminLookups,
    viewMode = "own",   // "admin" | "own" | "staff"
    hasStaff = false,
}) {
    const { is_admin } = usePage().props;
    // For staff view: treat as read-only (no editing, no CR modal, no gov info)
    const isStaffView = viewMode === "staff";

    const {
        tab,
        attachmentsLoading,
        modalCategory,
        formValue,
        setFormValue,
        oldValueSnapshot,
        pendingMap,
        pal,
        loadOptions,
        employeeOptions,
        handleEmployeeChange,
        openModal,
        closeModal,
        handleSuccess,
        handleTabChange,
    } = useEmployeeShow(employee, changeRequests);

    // base64-encoded employid for admin update route
    const encodedId = btoa(String(employee.emp_id));

    const [historyOpen, setHistoryOpen] = useState(false);

    // Shorthand for admin editable field (read-only for non-admin and staff views)
    const AField = ({
        label,
        value,
        fieldKey,
        idValue,
        options,
        type,
        table,
    }) =>
        is_admin ? (
            <AdminEditableField
                label={label}
                value={value}
                fieldKey={fieldKey}
                idValue={idValue}
                options={options}
                type={type}
                table={table ?? "personal"}
                employid={encodedId}
            />
        ) : (
            <Field label={label} value={value} />
        );

    const renderForm = () => {
        if (!modalCategory || formValue === null) return null;

        switch (modalCategory) {
            case "name":
                return <NameForm value={formValue} onChange={setFormValue} />;
            case "civil_status":
                return (
                    <CivilStatusForm
                        value={formValue}
                        onChange={setFormValue}
                    />
                );
            case "address":
                return (
                    <AddressForm value={formValue} onChange={setFormValue} />
                );
            case "education":
                return (
                    <EducationForm value={formValue} onChange={setFormValue} />
                );
            case "father":
                return (
                    <ParentForm
                        value={formValue}
                        onChange={setFormValue}
                        gender="Male"
                    />
                );
            case "mother":
                return (
                    <ParentForm
                        value={formValue}
                        onChange={setFormValue}
                        gender="Female"
                    />
                );
            case "spouse":
                return <SpouseForm value={formValue} onChange={setFormValue} />;
            case "children":
                return (
                    <FamilyTableForm
                        value={formValue}
                        onChange={setFormValue}
                        config={{
                            nameKey: "child_name",
                            bdayKey: "child_bday",
                            ageKey: "child_age",
                            genderKey: "child_gender",
                            rowLabel: "Child",
                        }}
                    />
                );
            case "siblings":
                return (
                    <FamilyTableForm
                        value={formValue}
                        onChange={setFormValue}
                        config={{
                            nameKey: "sibling_name",
                            bdayKey: "sibling_bday",
                            ageKey: "sibling_age",
                            genderKey: "sibling_gender",
                            rowLabel: "Sibling",
                        }}
                    />
                );
            case "others":
                return (
                    <OthersForm
                        value={formValue}
                        onChange={setFormValue}
                        shuttles={shuttles}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${employee.emp_name} — Employee Profile`} />

            <div className="min-h-screen bg-background">
                {/* ── Sticky Top Bar ──────────────────────────────────── */}
                <div className="border-b border-border/50 bg-background/90 backdrop-blur-md">
                    <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 font-mono whitespace-nowrap">
                            Active Employee
                        </span>
                        {(is_admin || hasStaff) && (
                        <div className="w-72">
                            <EmployeeCombobox
                                options={employeeOptions}
                                value={employee.emp_id}
                                onChange={handleEmployeeChange}
                                placeholder="Select employee…"
                                clearable={false}
                                style={{ height: "32px", fontSize: "13px" }}
                                loadOptions={loadOptions}
                            />
                        </div>
                    )}
                        <div className="flex-1" />
                        {is_admin && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 uppercase tracking-widest">
                                Admin
                            </span>
                        )}
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <span>
                                <ClockIcon className="w-3.5 h-3.5" />
                            </span>{" "}
                            History
                        </button>
                        <Badge
                            variant={
                                employee.accstatus_id == 1
                                    ? "default"
                                    : "destructive"
                            }
                            className="text-[10px] uppercase tracking-widest font-mono px-2"
                        >
                            {employee.accstatus_id == 1 ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-8">
                    {/* ── Profile Header ── */}
                    <div className="flex items-start gap-5 mb-8">
                        <div
                            className={`w-[68px] h-[68px] rounded-2xl flex items-center justify-center text-[20px] font-bold shrink-0 ${pal.bg} ${pal.text}`}
                        >
                            {employee.emp_name
                                ?.split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase() || "?"}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-3 mb-1.5">
                                <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-none">
                                    {employee.emp_name}
                                </h1>
                                {!is_admin && !isStaffView && (
                                    <EditSectionDropdown
                                        onSelect={openModal}
                                        pendingMap={pendingMap}
                                    />
                                )}
                            </div>
                            <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">
                                {[
                                    employee.emp_jobtitle,
                                    employee.emp_dept,
                                    employee.emp_prodline,
                                ]
                                    .filter(Boolean)
                                    .join("  ·  ") || "—"}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <MetaChip>{employee.emp_status}</MetaChip>
                                <MetaChip>{employee.emp_class}</MetaChip>
                                <MetaChip>{employee.shift_type}</MetaChip>
                            </div>
                        </div>

                        <div className="text-right shrink-0 pt-0.5">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 block mb-0.5">
                                Employee ID
                            </span>
                            <span className="text-[28px] font-mono font-bold text-foreground leading-none block">
                                {employee.emp_id}
                            </span>
                            {employee.date_hired && (
                                <span className="text-[11px] text-muted-foreground/50 block mt-1.5">
                                    Hired {employee.date_hired}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="border-b border-border/50 flex gap-5 mb-2">
                        <TabBtn
                            active={tab === "personal"}
                            onClick={() => handleTabChange("personal")}
                        >
                            Personal
                        </TabBtn>
                        <TabBtn
                            active={tab === "work"}
                            onClick={() => handleTabChange("work")}
                        >
                            Work
                        </TabBtn>
                        <TabBtn
                            active={tab === "files"}
                            onClick={() => handleTabChange("files")}
                        >
                            Files
                        </TabBtn>
                    </div>

                    {/* ══ PERSONAL TAB ══ */}
                    {tab === "personal" && (
                        <>
                            <SectionDivider title="Basic Information" />
                            {!is_admin && !isStaffView && (
                                <>
                                    <PendingBadge
                                        request={pendingMap["name"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["civil_status"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["education"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["others"]}
                                    />
                                </>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 mt-3">
                                <AField
                                    label="First Name"
                                    value={employee.emp_firstname}
                                    fieldKey="firstname"
                                />
                                <AField
                                    label="Middle Name"
                                    value={employee.emp_middlename}
                                    fieldKey="middlename"
                                />
                                <AField
                                    label="Last Name"
                                    value={employee.emp_lastname}
                                    fieldKey="lastname"
                                />
                                <AField
                                    label="Nickname"
                                    value={employee.nickname}
                                    fieldKey="nickname"
                                />
                                <AField
                                    label="Birthday"
                                    value={employee.birthday}
                                    fieldKey="birthday"
                                    type="date"
                                />
                                <AField
                                    label="Place of Birth"
                                    value={employee.place_of_birth}
                                    fieldKey="place_of_birth"
                                />
                                <AField
                                    label="Sex"
                                    value={
                                        SEX_LABELS[employee.emp_sex] ??
                                        employee.emp_sex
                                    }
                                    fieldKey="emp_sex"
                                    idValue={employee.emp_sex}
                                    options={SEX_OPTIONS}
                                />
                                <AField
                                    label="Civil Status"
                                    value={employee.civil_status}
                                    fieldKey="civil_status"
                                    idValue={employee.civil_status}
                                    options={CIVIL_STATUS_OPTIONS}
                                />
                                <AField
                                    label="Religion"
                                    value={employee.religion}
                                    fieldKey="religion"
                                />
                                <AField
                                    label="Blood Type"
                                    value={employee.blood_type}
                                    fieldKey="blood_type"
                                />
                                <AField
                                    label="Height(cm)"
                                    value={employee.height}
                                    fieldKey="height"
                                    type="number"
                                />
                                <AField
                                    label="Weight(kg)"
                                    value={employee.weight}
                                    fieldKey="weight"
                                    type="number"
                                />
                                <AField
                                    label="Email"
                                    value={employee.email}
                                    fieldKey="email"
                                />
                                <AField
                                    label="Contact No"
                                    value={employee.contact_no}
                                    fieldKey="contact_no"
                                />
                                <AField
                                    label="Education"
                                    value={employee.educational_attainment}
                                    fieldKey="educational_attainment"
                                />
                                <Field
                                    label="Shuttle"
                                    value={employee.shuttle}
                                />
                                <AField
                                    label="Account Status"
                                    value={employee.accstatus}
                                    fieldKey="accstatus"
                                    idValue={employee.accstatus_id}
                                    options={ACCOUNT_STATUS_OPTIONS}
                                />
                            </div>

                            <SectionDivider title="Address" />
                            {!is_admin && !isStaffView && (
                                <PendingBadge request={pendingMap["address"]} />
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 mt-3">
                                <AField
                                    label="House No."
                                    value={employee.address?.house_no}
                                    fieldKey="house_no"
                                    table="address"
                                />
                                <AField
                                    label="Barangay"
                                    value={employee.address?.brgy}
                                    fieldKey="brgy"
                                    table="address"
                                />
                                <AField
                                    label="City"
                                    value={employee.address?.city}
                                    fieldKey="city"
                                    table="address"
                                />
                                <AField
                                    label="Province"
                                    value={employee.address?.province}
                                    fieldKey="province"
                                    table="address"
                                />
                                <AField
                                    label="Perma House."
                                    value={employee.address?.perma_house_no}
                                    fieldKey="perma_house_no"
                                    table="address"
                                />
                                <AField
                                    label="Perma Brgy."
                                    value={employee.address?.perma_brgy}
                                    fieldKey="perma_brgy"
                                    table="address"
                                />
                                <AField
                                    label="Perma City"
                                    value={employee.address?.perma_city}
                                    fieldKey="perma_city"
                                    table="address"
                                />
                                <AField
                                    label="Perma Prov."
                                    value={employee.address?.perma_province}
                                    fieldKey="perma_province"
                                    table="address"
                                />
                            </div>

                            <SectionDivider title="Family" />
                            {!is_admin && !isStaffView && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <PendingBadge
                                        request={pendingMap["father"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["mother"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["spouse"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["children"]}
                                    />
                                    <PendingBadge
                                        request={pendingMap["siblings"]}
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {is_admin ? (
                                    <AdminFamilyTable
                                        title="Parents"
                                        rows={employee.parent ?? []}
                                        config={{
                                            familyType: "parent",
                                            nameKey: "parent_name",
                                            bdayKey: "parent_bday",
                                            ageKey: "parent_age",
                                            genderKey: "parent_gender",
                                        }}
                                        employid={encodedId}
                                    />
                                ) : (
                                    <FamilyTable
                                        title="Parents"
                                        columns={[
                                            "Name",
                                            "Birthday",
                                            "Age",
                                            "Gender",
                                        ]}
                                        rows={(employee.parent ?? []).map(
                                            (p) => ({
                                                name: p.parent_name,
                                                bday: p.parent_bday,
                                                age: p.parent_age,
                                                gender: p.parent_gender,
                                            }),
                                        )}
                                        emptyMsg="No parents on record."
                                    />
                                )}
                                {is_admin ? (
                                    <AdminFamilyTable
                                        title="Spouse"
                                        rows={employee.spouse ?? []}
                                        config={{
                                            familyType: "spouse",
                                            nameKey: "spouse_name",
                                            bdayKey: "spouse_bday",
                                            ageKey: "spouse_age",
                                            genderKey: "spouse_gender",
                                        }}
                                        employid={encodedId}
                                    />
                                ) : (
                                    <FamilyTable
                                        title="Spouse"
                                        columns={[
                                            "Name",
                                            "Birthday",
                                            "Age",
                                            "Gender",
                                        ]}
                                        rows={(employee.spouse ?? []).map(
                                            (sp) => ({
                                                name: sp.spouse_name,
                                                bday: sp.spouse_bday,
                                                age: sp.spouse_age,
                                                gender: sp.spouse_gender,
                                            }),
                                        )}
                                        emptyMsg="No spouse on record."
                                    />
                                )}
                                {is_admin ? (
                                    <AdminFamilyTable
                                        title="Siblings"
                                        rows={employee.siblings ?? []}
                                        config={{
                                            familyType: "sibling",
                                            nameKey: "sibling_name",
                                            bdayKey: "sibling_bday",
                                            ageKey: "sibling_age",
                                            genderKey: "sibling_gender",
                                        }}
                                        employid={encodedId}
                                    />
                                ) : (
                                    <FamilyTable
                                        title="Siblings"
                                        columns={[
                                            "Name",
                                            "Birthday",
                                            "Age",
                                            "Gender",
                                        ]}
                                        rows={(employee.siblings ?? []).map(
                                            (s) => ({
                                                name: s.sibling_name,
                                                bday: s.sibling_bday,
                                                age: s.sibling_age,
                                                gender: s.sibling_gender,
                                            }),
                                        )}
                                        emptyMsg="No siblings on record."
                                    />
                                )}
                                {is_admin ? (
                                    <AdminFamilyTable
                                        title="Children"
                                        rows={employee.children ?? []}
                                        config={{
                                            familyType: "child",
                                            nameKey: "child_name",
                                            bdayKey: "child_bday",
                                            ageKey: "child_age",
                                            genderKey: "child_gender",
                                        }}
                                        employid={encodedId}
                                    />
                                ) : (
                                    <FamilyTable
                                        title="Children"
                                        columns={[
                                            "Name",
                                            "Birthday",
                                            "Age",
                                            "Gender",
                                        ]}
                                        rows={(employee.children ?? []).map(
                                            (c) => ({
                                                name: c.child_name,
                                                bday: c.child_bday,
                                                age: c.child_age,
                                                gender: c.child_gender,
                                            }),
                                        )}
                                        emptyMsg="No children on record."
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* ══ WORK TAB ══ */}
                    {tab === "work" && (
                        <>
                            <SectionDivider title="Work Information" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                                <AField
                                    label="Company"
                                    value={employee.company}
                                    fieldKey="company"
                                    idValue={employee.company_id}
                                    options={adminLookups?.companies}
                                    table="work"
                                />
                                <AField
                                    label="Department"
                                    value={employee.emp_dept}
                                    fieldKey="department"
                                    idValue={employee.emp_dept_id}
                                    options={adminLookups?.departments}
                                    table="work"
                                />
                                <AField
                                    label="Job Title"
                                    value={employee.emp_jobtitle}
                                    fieldKey="job_title"
                                    idValue={employee.emp_jobtitle_id}
                                    options={adminLookups?.jobTitles}
                                    table="work"
                                />
                                <AField
                                    label="Product Line"
                                    value={employee.emp_prodline}
                                    fieldKey="prodline"
                                    idValue={employee.emp_prodline_id}
                                    options={adminLookups?.prodLines}
                                    table="work"
                                />
                                <AField
                                    label="Station"
                                    value={employee.emp_station}
                                    fieldKey="station"
                                    idValue={employee.emp_station_id}
                                    options={adminLookups?.stations}
                                    table="work"
                                />
                                <AField
                                    label="Team"
                                    value={employee.team}
                                    fieldKey="team"
                                    idValue={employee.team_id}
                                    options={adminLookups?.teams}
                                    table="work"
                                />
                                <AField
                                    label="Position"
                                    value={employee.emp_position}
                                    fieldKey="empposition"
                                    idValue={employee.emp_position_id}
                                    options={adminLookups?.positions}
                                    table="work"
                                />
                                <AField
                                    label="Employee Status"
                                    value={employee.emp_status}
                                    fieldKey="empstatus"
                                    idValue={employee.emp_status_id}
                                    options={adminLookups?.statuses}
                                    table="work"
                                />
                                <AField
                                    label="Employee Class"
                                    value={employee.emp_class}
                                    fieldKey="empclass"
                                    idValue={employee.emp_class_id}
                                    options={adminLookups?.classes}
                                    table="work"
                                />
                                <AField
                                    label="Shift Type"
                                    value={employee.shift_type}
                                    fieldKey="shift_type"
                                    idValue={employee.shift_type_id}
                                    options={adminLookups?.shifts}
                                    table="work"
                                />
                                <AField
                                    label="Date Hired"
                                    value={employee.date_hired}
                                    fieldKey="date_hired"
                                    type="date"
                                    table="work"
                                />
                                <AField
                                    label="Date Regularized"
                                    value={employee.date_reg}
                                    fieldKey="date_reg"
                                    type="date"
                                    table="work"
                                />
                                <Field
                                    label="Service Length"
                                    value={employee.service_length}
                                />
                            </div>

                            {employee.gov_info && !isStaffView && (
                                <>
                                    <SectionDivider title="Government Information" />
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                                        {is_admin ? (
                                            <>
                                                <AdminEditableField label="TIN No" value={employee.gov_info.tin_no} fieldKey="tin_no" table="gov_info" employid={encodedId} />
                                                <AdminEditableField label="SSS No" value={employee.gov_info.sss_no} fieldKey="sss_no" table="gov_info" employid={encodedId} />
                                                <AdminEditableField label="PhilHealth No" value={employee.gov_info.philhealth_no} fieldKey="philhealth_no" table="gov_info" employid={encodedId} />
                                                <AdminEditableField label="Pag-IBIG No" value={employee.gov_info.pagibig_no} fieldKey="pagibig_no" table="gov_info" employid={encodedId} />
                                                <AdminEditableField label="Bank Account" value={employee.gov_info.bank_acct_no} fieldKey="bank_acct_no" table="gov_info" employid={encodedId} />
                                            </>
                                        ) : (
                                            <>
                                                <Field label="TIN No" value={employee.gov_info.tin_no} />
                                                <Field label="SSS No" value={employee.gov_info.sss_no} />
                                                <Field label="PhilHealth No" value={employee.gov_info.philhealth_no} />
                                                <Field label="Pag-IBIG No" value={employee.gov_info.pagibig_no} />
                                                <Field label="Bank Account" value={employee.gov_info.bank_acct_no} />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {(employee.approver || is_admin) && (
                                <>
                                    <SectionDivider title="Approvers" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {is_admin ? (
                                            <>
                                                <AdminApproverCard
                                                    label="Approver 1"
                                                    value={
                                                        employee.approver
                                                            ?.approver1
                                                    }
                                                    approverField="approver1"
                                                    approverId={
                                                        employee.approver
                                                            ?.approver1_id
                                                    }
                                                    employid={encodedId}
                                                />
                                                <AdminApproverCard
                                                    label="Approver 2"
                                                    value={
                                                        employee.approver
                                                            ?.approver2
                                                    }
                                                    approverField="approver2"
                                                    approverId={
                                                        employee.approver
                                                            ?.approver2_id
                                                    }
                                                    employid={encodedId}
                                                />
                                                <AdminApproverCard
                                                    label="Approver 3"
                                                    value={
                                                        employee.approver
                                                            ?.approver3
                                                    }
                                                    approverField="approver3"
                                                    approverId={
                                                        employee.approver
                                                            ?.approver3_id
                                                    }
                                                    employid={encodedId}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <ApproverCard
                                                    label="Approver 1"
                                                    value={
                                                        employee.approver
                                                            .approver1
                                                    }
                                                    colorId={1}
                                                />
                                                <ApproverCard
                                                    label="Approver 2"
                                                    value={
                                                        employee.approver
                                                            .approver2
                                                    }
                                                    colorId={2}
                                                />
                                                <ApproverCard
                                                    label="Approver 3"
                                                    value={
                                                        employee.approver
                                                            .approver3
                                                    }
                                                    colorId={3}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ══ FILES TAB ══ */}
                    {tab === "files" && (
                        <FilesTab
                            attachments={attachments}
                            loading={attachmentsLoading}
                        />
                    )}
                </div>
            </div>

            {/* ── Activity History Modal ── */}
            {historyOpen && (
                <ActivityLogModal
                    employid={encodedId}
                    onClose={() => setHistoryOpen(false)}
                />
            )}

            {/* ── Change Request Modal (own profile only) ── */}
            {!is_admin && !isStaffView && modalCategory && (
                <ChangeRequestModal
                    open
                    onClose={closeModal}
                    employid={employee.emp_id}
                    category={modalCategory}
                    oldValue={oldValueSnapshot}
                    newValue={formValue}
                    existingRequest={pendingMap[modalCategory]}
                    onSuccess={handleSuccess}
                    attachmentsLoading={attachmentsLoading}
                >
                    {renderForm()}
                </ChangeRequestModal>
            )}
        </AuthenticatedLayout>
    );
}
