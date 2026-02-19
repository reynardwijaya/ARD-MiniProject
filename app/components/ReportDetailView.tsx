// components/ReportDetailView.tsx

"use client";

import { useRouter } from "next/navigation";
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

interface ReportDetailViewProps {
    report: {
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
        user_email?: string;
    };
    role: "admin" | "reporter";
    backPath: string;
}

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

export default function ReportDetailView({
    report,
    role,
    backPath,
}: ReportDetailViewProps) {
    const router = useRouter();

    return (
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
                        {/* Baris 1: Department & Severity */}
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

                        {/* Baris 2: Status & Incident Date */}
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

                        {/* Baris 3: Location & Reporter Email (HANYA ADMIN) */}
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
                                    Location
                                </Typography>
                                <Typography variant="body1">
                                    {report.location}
                                </Typography>
                            </Box>

                            {role === "admin" && (
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, color: "#666" }}
                                    >
                                        Reporter Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {report.user_email || "-"}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Description */}
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

                        {/* Attachments */}
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 500, color: "#333", mb: 2 }}
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
                                    {report.attachments.map(
                                        (att: Attachment) => {
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
                                                                    }}
                                                                >
                                                                    Download
                                                                </Button>
                                                            </a>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        }
                                    )}
                                </Box>
                            )}
                        </Box>

                        {/* Admin Note */}
                        {["reviewed", "approved", "rejected"].includes(
                            report.status.toLowerCase()
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
                                    {report.admin_note || "No note provided"}
                                </Typography>
                            </Box>
                        )}

                        {/* Tombol Back */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                pt: 2,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => router.push(backPath)}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    px: 3,
                                }}
                            >
                                Back to Reports
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
}
