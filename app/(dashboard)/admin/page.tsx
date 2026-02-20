"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import SummaryCards from "./components/SummaryCards";
import HighSeverityPending from "./components/HighSeverity";
import InboxAdmin from "./components/InboxAdmin";

interface DashboardData {
    totalReports: number;
    submitted: number;
    reviewed: number;
    highSeverity: number;
    trendPercentage: number;
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData>({
        totalReports: 0,
        submitted: 0,
        reviewed: 0,
        highSeverity: 0,
        trendPercentage: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: result, error } = await supabase.rpc(
                "get_admin_dashboard_summary"
            );

            if (error) {
                console.error("Error:", error);
                setLoading(false);
                return;
            }

            if (result && result[0]?.result_json) {
                const json = result[0].result_json;
                setData({
                    totalReports: json.totalReports || 0,
                    submitted: json.submitted || 0,
                    reviewed: json.reviewed || 0,
                    highSeverity: json.highSeverity || 0,
                    trendPercentage: json.trendPercentage || 0,
                });
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {" "}
            <div className="mb-8">
                {" "}
                <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                </h1>{" "}
                <p className="text-gray-500 mt-1">
                    Overview of your report analytics
                </p>{" "}
            </div>
            <SummaryCards data={data} loading={loading} />
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - High Severity */}
                <div className="lg:col-span-2">
                    <HighSeverityPending />
                </div>

                {/* Right - Placeholder for future chart
                <div className="hidden lg:block">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full min-h-[300px]">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Quick Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pending</span>
                                <span className="font-semibold text-gray-900">
                                    {data.submitted + data.reviewed}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">This Week</span>
                                <span className="font-semibold text-gray-900">
                                    {Math.round(data.totalReports * 0.3)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    Avg. Resolution
                                </span>
                                <span className="font-semibold text-gray-900">
                                    2.5 days
                                </span>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
            {/* Inbox Admin - Full Width */}
            <div className="mt-6">
                <InboxAdmin />
            </div>
        </div>
    );
}
