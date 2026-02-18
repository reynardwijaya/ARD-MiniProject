"use client";

import { useEffect, useState } from "react";
import LayoutUI from "../../lib/layoutUI"; // Update path jika sudah dipindah ke app/lib/LayoutUI.tsx
import { supabase } from "@/app/lib/supabase"; // Update path jika perlu
import ReportTable from "../../lib/ReportTable";

interface Report {
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_date: string;
    department_name: string;
    location: string;
    department_id?: string;
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
}

export default function ReporterDashboard() {
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    // Ambil user
    useEffect(() => {
        const fetchUser = async () => {
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
                }
            }
        };
        fetchUser();
    }, []);

    // Ambil report + department
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);

            const { data: reportData, error: reportError } = await supabase
                .from("adverse_reports")
                .select(
                    "id, title, severity, status, incident_date, department_id, location"
                );
            if (reportError) {
                console.error(reportError);
                setReports([]);
                setLoading(false);
                return;
            }

            const { data: departmentData, error: deptError } = await supabase
                .from("department")
                .select("id, name"); // Sesuaikan select

            if (deptError) {
                console.error(deptError);
            }

            // gabungkan report + department by department_id
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
                    };
                }
            );

            setReports(mapped);
            setLoading(false);
        };

        fetchReports();
    }, []);

    // Tentukan role berdasarkan user
    const userRole = user?.role === "admin" ? "admin" : "reporter";

    return (
        <LayoutUI
            pageTitle="Reporter Dashboard"
            userEmail={user?.email}
            userRole={user?.role}
            role={userRole} // Tambah prop role
        >
            {loading ? (
                <p>Loading reports...</p>
            ) : reports.length === 0 ? (
                <p>No reports found</p>
            ) : (
                <ReportTable data={reports} />
            )}
        </LayoutUI>
    );
}
