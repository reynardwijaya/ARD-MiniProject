"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import SummaryCards from "./components/SummaryCards";
import HighSeverityPending from "./components/HighSeverity";

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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Report Overview
                </h1>
                <p className="text-gray-500 mt-1">
                    Summary of report performance and activity
                </p>
            </div>
            <SummaryCards data={data} loading={loading} />

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* High Severity */}
                <div className="lg:col-span-1">
                    <HighSeverityPending />
                </div>

                {/* Future Section */}
                <div className="lg:col-span-3 hidden lg:block">
                    {/* Future content */}
                </div>
            </div>
        </div>
    );
}
