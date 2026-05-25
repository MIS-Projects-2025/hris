import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";

export default function ActionCell({ request, onApprove, onReject }) {
    const [rejecting, setRejecting] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [processing, setProcessing] = useState(false);

    if (request.status !== "pending") return null;

    const handleApprove = () => {
        setProcessing(true);
        onApprove(request.id, () => setProcessing(false));
    };

    const handleReject = () => {
        if (!remarks.trim()) {
            toast.error("Please enter rejection remarks.");
            return;
        }
        setProcessing(true);
        onReject(request.id, remarks, () => {
            setProcessing(false);
            setRejecting(false);
            setRemarks("");
        });
    };

    if (rejecting) {
        return (
            <div className="space-y-2 min-w-[200px]">
                <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Rejection reason…"
                    className="text-xs h-8"
                    autoFocus
                />
                <div className="flex gap-1.5">
                    <Button
                        size="sm"
                        variant="destructive"
                        className="text-[11px] h-7"
                        onClick={handleReject}
                        disabled={processing}
                    >
                        Confirm Reject
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-[11px] h-7"
                        onClick={() => { setRejecting(false); setRemarks(""); }}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                className="text-[11px] h-7 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={processing}
            >
                Approve
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="text-[11px] h-7 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                onClick={() => setRejecting(true)}
                disabled={processing}
            >
                Reject
            </Button>
        </div>
    );
}
