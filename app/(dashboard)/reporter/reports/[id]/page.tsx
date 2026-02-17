"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LayoutUI from "../../layoutUI";
import { supabase } from "../../../../lib/supabase";
import {
    Button,
    Box,
    Typography,
    Paper,
    Chip,
    Divider,
    Fade,
} from "@mui/material";

interface Attachment {
    file_name: string;
    file_path: string;
    signed_url: string;
}

interface ReportDetail {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    location: string;
    incident_date: string;
    department_name: string;
    created_at: string;
    attachments: Attachment[];
    admin_note?: string | null;
}

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const PDF_EXT = ["pdf"];
const DOC_EXT = ["doc", "docx"];
const EXCEL_EXT = ["xls", "xlsx"];

/* ================= PAGE ================= */

export default function ReportDetailPage() {
    const { id: reportId } = useParams<{ id: string }>();
    const router = useRouter();

    const [report, setReport] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );

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

    // Helper extract relative path from file_url
    const getRelativePath = (fileUrl: string) => {
        try {
            const url = new URL(fileUrl);
            return url.pathname.replace(
                /^\/storage\/v1\/object\/sign\/report-attachments\//,
                ""
            );
        } catch {
            return fileUrl; // already relative
        }
    };

    useEffect(() => {
        if (!reportId) return;

        const fetchData = async () => {
            setLoading(true);

            try {
                // Fetch report
                const { data: reportData, error: reportError } = await supabase
                    .from("adverse_reports")
                    .select("*")
                    .eq("id", reportId)
                    .single();

                if (reportError || !reportData) {
                    console.error("Report error:", reportError);
                    setLoading(false);
                    return;
                }

                // Fetch department
                let department_name = "-";
                if (reportData.department_id) {
                    const { data: dept } = await supabase
                        .from("department")
                        .select("name")
                        .eq("id", reportData.department_id)
                        .single();
                    department_name = dept?.name ?? "-";
                }

                //  Fetch attachments
                const { data: attachmentsData, error: attachError } =
                    await supabase
                        .from("report_attachments")
                        .select("file_name, file_url")
                        .eq("report_id", reportId);

                if (attachError) {
                    console.error("Attachment query error:", attachError);
                }

                // Generate signed URLs
                const attachments: Attachment[] = await Promise.all(
                    (attachmentsData ?? []).map(async (att) => {
                        const filePath = getRelativePath(att.file_url ?? "");
                        const fileName = att.file_name ?? "unknown";

                        let signedUrl = "";
                        if (filePath) {
                            const { data, error } = await supabase.storage
                                .from("report-attachments")
                                .createSignedUrl(filePath, 60 * 60);

                            if (error)
                                console.error("Signed URL error:", error);
                            else signedUrl = data?.signedUrl ?? "";
                        }

                        return {
                            file_name: fileName,
                            file_path: filePath,
                            signed_url: signedUrl,
                        };
                    })
                );

                setReport({
                    id: reportData.id,
                    title: reportData.title,
                    description: reportData.description,
                    status: reportData.status,
                    severity: reportData.severity,
                    location: reportData.location,
                    incident_date: reportData.incident_date,
                    department_name,
                    created_at: reportData.created_at,
                    attachments,
                    admin_note: reportData.admin_note,
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [reportId]);

    /* ================= UI ================= */

    if (loading)
        return (
            <LayoutUI
                pageTitle="Loading..."
                userEmail={user?.email}
                userRole={user?.role}
            >
                Loading...
            </LayoutUI>
        );
    if (!report)
        return (
            <LayoutUI
                pageTitle="Not Found"
                userEmail={user?.email}
                userRole={user?.role}
            >
                Report not found
            </LayoutUI>
        );

    return (
        <LayoutUI
            pageTitle="Report Detail"
            userEmail={user?.email}
            userRole={user?.role}
        >
            <Fade in={true} timeout={600}>
                <Box
                    sx={{
                        flex: 1,
                        bgcolor: "#fafafa",
                        display: "flex",
                        justifyContent: "center",
                        p: 4,
                        minHeight: "100vh",
                    }}
                >
                    <Paper
                        elevation={1}
                        sx={{
                            width: "100%",
                            maxWidth: 800,
                            p: 6,
                            borderRadius: 3,
                            bgcolor: "white",
                        }}
                    >
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{ fontWeight: 600, color: "#333" }}
                            >
                                {report.title}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#666", mt: 1 }}
                            >
                                Report Details
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "1fr 1fr",
                                    },
                                    gap: 3,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#666" }}
                                    >
                                        Department
                                    </Typography>
                                    <Typography variant="body1">
                                        {report.department_name}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#666" }}
                                    >
                                        Severity
                                    </Typography>
                                    <Chip
                                        label={report.severity}
                                        size="small"
                                        sx={{
                                            bgcolor:
                                                report.severity.toLowerCase() ===
                                                "high"
                                                    ? "#d32f2f20"
                                                    : report.severity.toLowerCase() ===
                                                        "medium"
                                                      ? "#f57c0020"
                                                      : "#388e3c20",
                                            color:
                                                report.severity.toLowerCase() ===
                                                "high"
                                                    ? "#d32f2f"
                                                    : report.severity.toLowerCase() ===
                                                        "medium"
                                                      ? "#f57c00"
                                                      : "#388e3c",
                                            fontWeight: 600,
                                            borderRadius: 2,
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "1fr 1fr",
                                    },
                                    gap: 3,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#666" }}
                                    >
                                        Status
                                    </Typography>
                                    <Chip
                                        label={report.status}
                                        size="small"
                                        sx={{
                                            bgcolor:
                                                report.status.toLowerCase() ===
                                                "draft"
                                                    ? "#9e9e9e20"
                                                    : report.status.toLowerCase() ===
                                                        "rejected"
                                                      ? "#d32f2f20"
                                                      : "#388e3c20",
                                            color:
                                                report.status.toLowerCase() ===
                                                "draft"
                                                    ? "#9e9e9e"
                                                    : report.status.toLowerCase() ===
                                                        "rejected"
                                                      ? "#d32f2f"
                                                      : "#388e3c",
                                            fontWeight: 600,
                                            borderRadius: 2,
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#666" }}
                                    >
                                        Incident Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(
                                            report.incident_date
                                        ).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: "#666" }}
                                >
                                    Location
                                </Typography>
                                <Typography variant="body1">
                                    {report.location}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, color: "#666" }}
                                >
                                    Description
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    {report.description}
                                </Typography>
                            </Box>

                            {/* ================= ATTACHMENTS ================= */}
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 500,
                                        color: "#333",
                                        mb: 2,
                                    }}
                                >
                                    Attachments
                                </Typography>

                                {report.attachments.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "#999" }}
                                    >
                                        No attachments available.
                                    </Typography>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 3,
                                        }}
                                    >
                                        {report.attachments.map((att) => {
                                            const ext =
                                                att.file_name
                                                    .split(".")
                                                    .pop()
                                                    ?.toLowerCase() ?? "";
                                            const isImage =
                                                IMAGE_EXT.includes(ext);

                                            return (
                                                <Box
                                                    key={att.file_path}
                                                    sx={{
                                                        width: 200,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        gap: 1,
                                                    }}
                                                >
                                                    {isImage &&
                                                    att.signed_url ? (
                                                        <Box
                                                            sx={{
                                                                width: 200,
                                                                height: 200,
                                                                borderRadius: 2,
                                                                border: "1px solid #e0e0e0",
                                                                overflow:
                                                                    "hidden",
                                                                cursor: "pointer",
                                                                "&:hover": {
                                                                    borderColor:
                                                                        "#ccc",
                                                                },
                                                            }}
                                                            onClick={() =>
                                                                window.open(
                                                                    att.signed_url,
                                                                    "_blank"
                                                                )
                                                            }
                                                        >
                                                            <img
                                                                src={
                                                                    att.signed_url
                                                                }
                                                                alt={
                                                                    att.file_name
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit:
                                                                        "cover",
                                                                }}
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                width: 200,
                                                                height: 200,
                                                                borderRadius: 2,
                                                                border: "1px solid #e0e0e0",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                textAlign:
                                                                    "center",
                                                                p: 2,
                                                                bgcolor:
                                                                    "#f9f9f9",
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "#666",
                                                                }}
                                                            >
                                                                {att.file_name}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {att.signed_url && (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            {isImage && (
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        textTransform:
                                                                            "none",
                                                                        borderColor:
                                                                            "#ccc",
                                                                        color: "#666",
                                                                        "&:hover":
                                                                            {
                                                                                borderColor:
                                                                                    "#999",
                                                                                bgcolor:
                                                                                    "#f9f9f9",
                                                                            },
                                                                    }}
                                                                    onClick={() =>
                                                                        window.open(
                                                                            att.signed_url,
                                                                            "_blank"
                                                                        )
                                                                    }
                                                                >
                                                                    View
                                                                </Button>
                                                            )}
                                                            <a
                                                                href={
                                                                    att.signed_url
                                                                }
                                                                download={
                                                                    att.file_name
                                                                }
                                                                style={{
                                                                    textDecoration:
                                                                        "none",
                                                                }}
                                                            >
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        textTransform:
                                                                            "none",
                                                                        borderColor:
                                                                            "#ccc",
                                                                        color: "#666",
                                                                        "&:hover":
                                                                            {
                                                                                borderColor:
                                                                                    "#999",
                                                                                bgcolor:
                                                                                    "#f9f9f9",
                                                                            },
                                                                    }}
                                                                >
                                                                    Download
                                                                </Button>
                                                            </a>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>

                            {/* ================= ADMIN NOTE ================= */}
                            {["reviewed", "approved", "rejected"].includes(
                                report.status
                            ) && (
                                <Box
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        bgcolor: "#f9f9f9",
                                        border: "1px solid #e0e0e0",
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 500,
                                            color: "#333",
                                            mb: 1,
                                        }}
                                    >
                                        Admin Note
                                    </Typography>
                                    <Typography variant="body2">
                                        {report.admin_note ||
                                            "No note provided"}
                                    </Typography>
                                </Box>
                            )}

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    pt: 2,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={() => router.push("/reporter")}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        px: 3,
                                        "&:hover": { bgcolor: "#f5f5f5" },
                                    }}
                                >
                                    Back to Dashboard
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Fade>
        </LayoutUI>
    );
}
