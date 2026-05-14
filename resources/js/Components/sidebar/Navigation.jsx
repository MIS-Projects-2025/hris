import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";

import { User, Users, ClipboardList, Upload, Database, Download } from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data, is_admin } = usePage().props;

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("employees.show", btoa(emp_data.emp_id))}
                label="Details"
                icon={<User className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
            {is_admin && (
                <SidebarLink
                    href={route("employees.index")}
                    label="Employee List"
                    icon={<Users className="w-5 h-5" />}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
            <SidebarLink
                href={route("change-requests.index")}
                label="Change Requests"
                icon={<ClipboardList className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
            {is_admin && (
                <>
                    <SidebarLink
                        href={route("import.index")}
                        label="Import"
                        icon={<Upload className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />
                    <SidebarLink
                        href={route("export.index")}
                        label="Export"
                        icon={<Download className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />
                    <SidebarLink
                        href={route("lookups.index")}
                        label="Lookups"
                        icon={<Database className="w-5 h-5" />}
                        isSidebarOpen={isSidebarOpen}
                    />
                </>
            )}
        </nav>
    );
}
