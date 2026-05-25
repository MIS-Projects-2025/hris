import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    ChevronDown,
    User,
    Heart,
    MapPin,
    GraduationCap,
    Users,
    Baby,
    MoreHorizontal,
} from "lucide-react";

const CATEGORIES = [
    { key: "name",         label: "Name",         icon: User },
    { key: "civil_status", label: "Civil Status",  icon: Heart },
    { key: "address",      label: "Address",       icon: MapPin },
    { key: "education",    label: "Education",     icon: GraduationCap },
    { key: "father",       label: "Father",        icon: User },
    { key: "mother",       label: "Mother",        icon: User },
    { key: "spouse",       label: "Spouse",        icon: Heart },
    { key: "children",     label: "Children",      icon: Baby },
    { key: "siblings",     label: "Siblings",      icon: Users },
    { key: "others",       label: "Others",        icon: MoreHorizontal },
];

// pendingMap: { name: {status:'pending',...}, civil_status: null, ... }
export default function EditSectionDropdown({ onSelect, pendingMap = {} }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-[12px] font-semibold uppercase tracking-wider font-mono"
                >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M2 4h12M2 8h8M2 12h5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    Edit Section
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-150 data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
                {CATEGORIES.map(({ key, label, icon: Icon }) => {
                    const status = pendingMap[key]?.status;
                    return (
                        <DropdownMenuItem
                            key={key}
                            onSelect={() => onSelect(key)}
                            className="flex items-center justify-between px-3.5 py-2.5 text-[13px] cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Icon className="w-[14px] h-[14px] text-muted-foreground/60 shrink-0" />
                                <span className="text-foreground">{label}</span>
                            </div>
                            {status === "pending" && (
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    pending
                                </span>
                            )}
                            {status === "rejected" && (
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                                    rejected
                                </span>
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
