"use client";

import SummaryCard from "./SummaryCard";
import { BarChart3, Clock, Eye, AlertTriangle } from "lucide-react";

interface DashboardData {
    totalReports: number;
    submitted: number;
    reviewed: number;
    highSeverity: number;
    trendPercentage: number;
}

interface SummaryCardsProps {
    data: DashboardData;
    loading?: boolean;
}

export default function SummaryCards({ data }: SummaryCardsProps) {
    const isPositiveTrend = data.trendPercentage >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <SummaryCard
                title="Total Reports"
                value={data.totalReports}
                subtitle="All time"
                variant="neutral"
                trend={`${Math.abs(data.trendPercentage)}% vs last 30 days`}
                isPositiveTrend={isPositiveTrend}
                icon={<BarChart3 size={22} strokeWidth={2} />}
            />

            <SummaryCard
                title="Submitted"
                value={data.submitted}
                subtitle="Needs Review"
                extraText={data.submitted > 0 ? "Pending review" : "No pending"}
                variant="blue"
                icon={<Clock size={22} strokeWidth={2} />}
            />

            <SummaryCard
                title="Reviewed"
                value={data.reviewed}
                subtitle={
                    data.reviewed === 0
                        ? "No pending decisions"
                        : "Awaiting Decision"
                }
                variant="purple"
                icon={<Eye size={22} strokeWidth={2} />}
            />

            <SummaryCard
                title="High Severity"
                value={data.highSeverity}
                subtitle={
                    data.highSeverity === 0
                        ? "All clear"
                        : "Requires immediate attention"
                }
                extraText={
                    data.highSeverity > 0 ? "Required Action" : undefined
                }
                variant={data.highSeverity > 0 ? "red" : "neutral"}
                icon={<AlertTriangle size={22} strokeWidth={2} />}
            />
        </div>
    );
}
