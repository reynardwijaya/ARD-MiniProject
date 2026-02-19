"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { AlertTriangle } from "lucide-react";

interface HighSeverityReport {
    id: string;
    title: string;
    reporter_name: string;
    status: string;
    created_at: string;
}

function getRelativeTime(dateString: string): {
    text: string;
    isOverdue: boolean;
} {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return {
            text: `${diffDays} day${diffDays > 1 ? "s" : ""} ago`,
            isOverdue: diffDays >= 1,
        };
    } else if (diffHours > 0) {
        return {
            text: `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`,
            isOverdue: false,
        };
    } else {
        return { text: "Just now", isOverdue: false };
    }
}

export default function HighSeverityPending() {
    const router = useRouter();
    const [reports, setReports] = useState<HighSeverityReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase.rpc(
                "get_high_severity_pending"
            );

            if (error) {
                console.error("Error fetching high severity:", error);
                setLoading(false);
                return;
            }

            setReports(data || []);
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleView = (id: string) => {
        router.push(`/admin/reports/${id}`);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="h-6 w-56 bg-gray-100 rounded animate-pulse mb-6"></div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 bg-gray-50 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50">
                        <AlertTriangle
                            className="w-5 h-5 text-red-500"
                            strokeWidth={2}
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            High Severity Pending
                        </h2>
                        <p className="text-sm text-gray-500">
                            Requires immediate attention
                        </p>
                    </div>
                </div>

                <div className="text-sm font-semibold text-red-500">
                    {reports.length}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {reports.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                        No high severity reports pending ✓
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((report) => {
                            const { text: timeText, isOverdue } =
                                getRelativeTime(report.created_at);

                            return (
                                <div
                                    key={report.id}
                                    onClick={() => handleView(report.id)}
                                    className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {report.title}
                                            </h3>

                                            {isOverdue && (
                                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-gray-500">
                                                {report.reporter_name ||
                                                    "Unknown"}
                                            </span>

                                            <span className="text-gray-300">
                                                •
                                            </span>

                                            <span
                                                className={`text-sm ${
                                                    isOverdue
                                                        ? "text-red-600 font-medium"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {timeText}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleView(report.id);
                                        }}
                                        className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        View
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
