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

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);

            try {
                const [reportsRes, departmentsRes, usersRes] =
                    await Promise.all([
                        supabase
                            .from("adverse_reports")
                            .select(
                                "id, title, severity, status, incident_date, department_id, location, user_id"
                            )
                            .in("status", ["approved", "rejected"])
                            .order("created_at", { ascending: false }),
                        supabase.from("department").select("id, name"),
                        supabase.from("users").select("id, name"),
                    ]);

                const reportData = reportsRes.data;
                const departmentData = departmentsRes.data;
                const userData = usersRes.data;

                if (reportsRes.error) {
                    console.error("Report error:", reportsRes.error);
                    setError("Failed to load reports");
                    setReports([]);
                    setLoading(false);
                    return;
                }

                const userNameMap: { [key: string]: string } = {};
                if (userData) {
                    userData.forEach((u: UserData) => {
                        userNameMap[u.id] = u.name;
                    });
                }

                const mapped: Report[] = (reportData || []).map(
                    (r: AdverseReport) => {
                        const dept = departmentData?.find(
                            (d: Department) => d.id === r.department_id
                        );

                        return {
                            id: r.id,
                            title: r.title,
                            severity: r.severity,
                            status: r.status,
                            incident_date: r.incident_date,
                            location: r.location || "",
                            department_name: dept?.name || "-",
                            department_id: r.department_id,
                            user_id: r.user_id,
                            name: r.user_id
                                ? userNameMap[r.user_id] || "-"
                                : "-",
                        };
                    }
                );

                setReports(mapped);
            } catch (err) {
                console.error("Unexpected error:", err);
                setError("An unexpected error occurred");
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
