"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import ReportTable from "@/app/components/ReportTable";

interface Report {
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_date: string;
    department_name: string;
    location: string;
    department_id?: string;
    user_id?: string;
    name: string;
    created_at: string;
}

interface Department {
    id: string;
    name: string;
}

interface AdverseReport {
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_date: string;
    department_id?: string;
    location: string;
    user_id?: string;
    created_at?: string;
}

interface UserData {
    id: string;
    name: string;
}

export default function AdminReportsPage() {
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ambil user dan role
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                    const { data: userData, error } = await supabase
                        .from("users")
                        .select("role")
                        .eq("id", user.id)
                        .single();
                    if (!error && userData) {
                        setUser({ email: user.email!, role: userData.role });
                    } else if (error) {
                        console.error("Error fetching user role:", error);
                    }
                }
            } catch (err) {
                console.error("Error fetching user:", err);
            }
        };
        fetchUser();
    }, []);

    // Ambil reports + department + user
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);

            try {
                // Ambil reports + join department & reporter user
                const { data: reportData, error: reportError } = await supabase
                    .from("adverse_reports")
                    .select(
                        `
            id,
            title,
            severity,
            status,
            incident_date,
            location,
            created_at,
            department!adverse_reports_department_id_fkey ( id, name ),
            users!adverse_reports_reporter_id_fkey ( id, name )
        `
                    )
                    .in("status", ["approved", "rejected"]) // admin hanya lihat approved/rejected
                    .order("created_at", { ascending: false });

                if (reportError) {
                    console.error("Report error:", reportError);
                    setError("Failed to load reports");
                    setReports([]);
                    setLoading(false);
                    return;
                }

                type ReportWithRelations = {
                    id: string;
                    title: string;
                    severity: string;
                    status: string;
                    incident_date: string;
                    location: string;
                    created_at: string;
                    department?: { id: string; name: string }[]; // ⚠️ array
                    users?: { id: string; name: string }[]; // ⚠️ array
                };

                const mapped: Report[] = (
                    reportData as ReportWithRelations[]
                ).map((r) => ({
                    id: r.id,
                    title: r.title,
                    severity: r.severity,
                    status: r.status,
                    incident_date: r.incident_date,
                    location: r.location || "",
                    department_name: r.department?.[0]?.name || "-",
                    department_id: r.department?.[0]?.id,
                    user_id: r.users?.[0]?.id || "",
                    name: r.users?.[0]?.name || "-",
                    created_at: r.created_at || new Date().toISOString(),
                }));

                setReports(mapped);
            } catch (err) {
                console.error("Unexpected error:", err);
                setError("An unexpected error occurred");
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return <p>Loading reports...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div>
            {reports.length === 0 ? (
                <p>No reports found</p>
            ) : (
                <ReportTable data={reports} role="admin" />
            )}
        </div>
    );
}
