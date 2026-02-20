// app/admin/reports/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import ReportDetailView from "@/app/components/ReportDetailView";

interface Attachment {
    file_name: string;
    file_path: string;
    signed_url: string;
}

interface ReportData {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    location: string;
    incident_date: string;
    department_id?: string;
    department_name: string;
    created_at: string;
    admin_note?: string | null;
    user_id?: string;
    user_email: string;
    attachments: Attachment[];
    notes?: {
        id: string;
        admin_id: string;
        note: string;
        created_at: string;
    }[];
}

interface Department {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
}

interface AttachmentRaw {
    file_name: string;
    file_url: string;
}

const getRelativePath = (fileUrl: string) => {
    try {
        const url = new URL(fileUrl);
        return url.pathname.replace(
            /^\/storage\/v1\/object\/sign\/report-attachments\//,
            ""
        );
    } catch {
        return fileUrl;
    }
};

export default function AdminReportDetailPage() {
    const { id: reportId } = useParams<{ id: string }>();
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!reportId) return;

        const fetchData = async () => {
            setLoading(true);

            const [reportRes, deptRes, userRes, attachRes, notesRes] =
                await Promise.all([
                    supabase
                        .from("adverse_reports")
                        .select("*")
                        .eq("id", reportId)
                        .single(),
                    supabase.from("department").select("id, name"),
                    supabase.from("users").select("id, name"),
                    supabase
                        .from("report_attachments")
                        .select("file_name, file_url")
                        .eq("report_id", reportId),
                    supabase
                        .from("report_note")
                        .select("id, admin_id, note, created_at")
                        .eq("report_id", reportId)
                        .order("created_at", { ascending: false }),
                ]);

            const reportData = reportRes.data;
            if (!reportData) {
                setLoading(false);
                return;
            }

            const userMap: { [key: string]: string } = {};
            if (userRes.data)
                (userRes.data as User[]).forEach((u: User) => {
                    userMap[u.id] = u.name;
                });

            const dept = (deptRes.data as Department[] | null)?.find(
                (d: Department) => d.id === reportData.department_id
            );

            const attachments: Attachment[] = await Promise.all(
                (attachRes.data ?? ([] as AttachmentRaw[])).map(
                    async (att: AttachmentRaw) => {
                        const filePath = getRelativePath(att.file_url ?? "");
                        const fileName = att.file_name ?? "unknown";
                        let signedUrl = "";
                        if (filePath) {
                            const { data } = await supabase.storage
                                .from("report-attachments")
                                .createSignedUrl(filePath, 60 * 60);
                            signedUrl = data?.signedUrl ?? "";
                        }
                        return {
                            file_name: fileName,
                            file_path: filePath,
                            signed_url: signedUrl,
                        };
                    }
                )
            );

            const notes =
                notesRes.data?.map((note) => ({
                    id: note.id,
                    admin_id: note.admin_id,
                    note: note.note,
                    created_at: note.created_at,
                })) || [];

            setReport({
                ...reportData,
                department_name: dept?.name ?? "-",
                user_email: reportData.user_id
                    ? (userMap[reportData.user_id] ?? "-")
                    : "-",
                attachments,
                notes,
            });
            setLoading(false);
        };

        fetchData();
    }, [reportId]);

    if (loading) return <p>Loading...</p>;
    if (!report) return <p>Report not found</p>;

    return (
        <ReportDetailView
            report={report}
            role="admin"
            backPath="/admin/reports"
        />
    );
}
