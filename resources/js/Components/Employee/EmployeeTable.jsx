import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Columns2 } from "lucide-react";

const COLUMN_DEFS = [
    // ── Personal ─────────────────────────────────────────────────────────────
    { accessorKey: "emp_id",                header: "ID",             group: "Personal" },
    { accessorKey: "firstname",             header: "First Name",     group: "Personal" },
    { accessorKey: "middlename",            header: "Middle Name",    group: "Personal" },
    { accessorKey: "lastname",              header: "Last Name",      group: "Personal" },
    { accessorKey: "nickname",              header: "Nickname",       group: "Personal" },
    { accessorKey: "birthday",              header: "Birthday",       group: "Personal" },
    { accessorKey: "place_of_birth",        header: "Birthplace",     group: "Personal" },
    { accessorKey: "emp_sex",               header: "Sex",            group: "Personal" },
    { accessorKey: "civil_status",          header: "Civil Status",   group: "Personal" },
    { accessorKey: "religion",              header: "Religion",       group: "Personal" },
    { accessorKey: "blood_type",            header: "Blood Type",     group: "Personal" },
    { accessorKey: "height",               header: "Height",         group: "Personal" },
    { accessorKey: "weight",               header: "Weight",         group: "Personal" },
    { accessorKey: "email",                header: "Email",          group: "Personal" },
    { accessorKey: "contact_no",           header: "Contact No.",    group: "Personal" },
    { accessorKey: "educational_attainment", header: "Education",    group: "Personal" },

    // ── Work ─────────────────────────────────────────────────────────────────
    { accessorKey: "company",      header: "Company",        group: "Work" },
    { accessorKey: "dept",         header: "Department",     group: "Work" },
    { accessorKey: "job_title",    header: "Job Title",      group: "Work" },
    { accessorKey: "prod_line",    header: "Prod. Line",     group: "Work" },
    { accessorKey: "station",      header: "Station",        group: "Work" },
    { accessorKey: "team",         header: "Team",           group: "Work" },
    { accessorKey: "emp_position", header: "Position",       group: "Work" },
    { accessorKey: "emp_status",   header: "Status",         group: "Work" },
    { accessorKey: "emp_class",    header: "Class",          group: "Work" },
    { accessorKey: "shift_type",   header: "Shift",          group: "Work" },
    { accessorKey: "shuttle",      header: "Shuttle",        group: "Work" },
    { accessorKey: "date_hired",   header: "Date Hired",     group: "Work" },
    { accessorKey: "date_reg",     header: "Date Reg.",      group: "Work" },
    { accessorKey: "service_length", header: "Service Length", group: "Work" },

    // ── Government ───────────────────────────────────────────────────────────
    { accessorKey: "tin_no",        header: "TIN",        group: "Government" },
    { accessorKey: "sss_no",        header: "SSS",        group: "Government" },
    { accessorKey: "philhealth_no", header: "PhilHealth", group: "Government" },
    { accessorKey: "pagibig_no",    header: "Pag-IBIG",   group: "Government" },
    { accessorKey: "bank_acct_no",  header: "Bank Acct.", group: "Government" },
];

const DEFAULT_VISIBLE = new Set([
    "emp_id", "firstname", "lastname", "company", "dept", "job_title", "emp_status", "date_hired",
]);

const GROUPS = ["Personal", "Work", "Government"];

export default function EmployeeTable({ data }) {
    const [columnVisibility, setColumnVisibility] = useState(
        Object.fromEntries(COLUMN_DEFS.map((c) => [c.accessorKey, DEFAULT_VISIBLE.has(c.accessorKey)]))
    );

    const columns = useMemo(
        () =>
            COLUMN_DEFS.map((def) => ({
                accessorKey: def.accessorKey,
                header: def.header,
                meta:   { group: def.group },
                cell: ({ getValue }) => {
                    const val = getValue();
                    return val != null && val !== "" ? (
                        <span>{val}</span>
                    ) : (
                        <span className="text-muted-foreground/40">—</span>
                    );
                },
            })),
        []
    );

    const table = useReactTable({
        data,
        columns,
        state: { columnVisibility },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

    const groupedColumns = useMemo(() => {
        const map = Object.fromEntries(GROUPS.map((g) => [g, []]));
        table.getAllColumns().forEach((col) => {
            const group = col.columnDef.meta?.group;
            if (group && map[group]) map[group].push(col);
        });
        return map;
    }, [table]);

    function handleRowClick(empId) {
        router.visit(route("employees.show", { employid: btoa(empId) }));
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-[12px]">
                            <Columns2 className="size-3.5" />
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 max-h-[420px] overflow-y-auto">
                        {GROUPS.map((group) => (
                            <div key={group}>
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider px-2 py-1">
                                    {group}
                                </DropdownMenuLabel>
                                {groupedColumns[group].map((col) => (
                                    <DropdownMenuCheckboxItem
                                        key={col.id}
                                        checked={col.getIsVisible()}
                                        onCheckedChange={(val) => col.toggleVisibility(val)}
                                        className="text-[12px]"
                                    >
                                        {col.columnDef.header}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                <DropdownMenuSeparator />
                            </div>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border/50 overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                                {hg.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap px-3 py-2.5"
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getVisibleLeafColumns().length}
                                    className="text-center text-[13px] text-muted-foreground py-12"
                                >
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => handleRowClick(row.original.emp_id)}
                                    className="cursor-pointer hover:bg-muted/40 transition-colors text-[12px]"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="whitespace-nowrap px-3 py-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
