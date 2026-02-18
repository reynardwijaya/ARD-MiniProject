"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import ReportTable from "@/app/lib/ReportTable";

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
    name: string; // Email user (atau "-" jika tidak ada)
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

export default function AdminReportsPage() {
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ambil user (untuk display, bukan filter)
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

    // Ambil report + department + user emails
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);

            try {
                // Query reports
                const { data: reportData, error: reportError } = await supabase
                    .from("adverse_reports")
                    .select(
                        "id, title, severity, status, incident_date, department_id, location, user_id"
                    );

                if (reportError) {
                    console.error("Report error:", reportError);
                    setError("Failed to load reports");
                    setReports([]);
                    setLoading(false);
                    return;
                }

                // Query departments
                const { data: departmentData, error: deptError } =
                    await supabase.from("department").select("id, name");

                if (deptError) {
                    console.error("Department error:", deptError);
                    // Tidak fatal, lanjutkan dengan departmentData kosong
                }

                // Ambil unique user_ids dari reportData
                const userIds = [
                    ...new Set(
                        reportData?.map((r) => r.user_id).filter(Boolean)
                    ),
                ];

                // Ambil email dari users berdasarkan userIds
                let userEmailMap: { [key: string]: string } = {};
                if (userIds.length > 0) {
                    const { data: userData, error: userError } = await supabase
                        .from("users")
                        .select("id, email")
                        .in("id", userIds);

                    // Log untuk debugging (hapus di production jika tidak perlu)
                    console.log("userError value:", userError);

                    // Perbaikan: Hanya log jika ada error nyata (dengan message)
                    if (userError && userError.message) {
                        console.error("User error:", userError);
                        // Tidak set error global, karena ini opsional
                    } else if (userError && Object.keys(userError).length > 0) {
                        // Fallback jika error adalah objek kosong tapi punya properti lain
                        console.warn(
                            "Unexpected user error format:",
                            userError
                        );
                    } else {
                        // Sukses: Build map
                        userEmailMap =
                            userData?.reduce(
                                (map, u) => {
                                    map[u.id] = u.email;
                                    return map;
                                },
                                {} as { [key: string]: string }
                            ) || {};
                    }
                } else {
                    console.log("No user IDs to fetch emails for.");
                }

                // Gabungkan report + department + user email
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
                                ? userEmailMap[r.user_id] || "-"
                                : "-", // Ambil email dari map
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
    }, []); // Dependency array kosong: hanya run sekali saat mount

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
