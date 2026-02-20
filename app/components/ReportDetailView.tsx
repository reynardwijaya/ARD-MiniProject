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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";

interface Attachment {
    file_name: string;
    file_path: string;
    signed_url: string;
}

interface Note {
    id: string;
    admin_id: string;
    note: string;
    created_at: string;
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
        notes?: Note[];
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

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

    return (
        <Fade in={true} timeout={600}>
            <Box
                sx={{
                    flex: 1,
                    bgcolor: "#f5f5f7",
                    display: "flex",
                    justifyContent: "center",
                    p: { xs: 2, md: 4 },
                    minHeight: "100vh",
                }}
            >
                <Paper
                    elevation={2}
                    sx={{
                        width: "100%",
                        maxWidth: 900,
                        p: { xs: 4, md: 6 },
                        borderRadius: 3,
                        bgcolor: "white",
                    }}
                >
                    {/* Header */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: 700, color: "#222" }}
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

                    {/* Info Grid */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                            gap: 3,
                            mb: 3,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "#555" }}
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
                                sx={{ fontWeight: 600, color: "#555" }}
                            >
                                Severity
                            </Typography>
                            <Chip
                                label={report.severity}
                                size="small"
                                sx={{
                                    mt: 0.5,
                                    bgcolor:
                                        report.severity.toLowerCase() === "high"
                                            ? "#ffe5e5"
                                            : report.severity.toLowerCase() ===
                                                "medium"
                                              ? "#fff4e5"
                                              : "#e5f6e5",
                                    color:
                                        report.severity.toLowerCase() === "high"
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
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "#555" }}
                            >
                                Status
                            </Typography>
                            <Chip
                                label={report.status}
                                size="small"
                                sx={{
                                    mt: 0.5,
                                    bgcolor:
                                        report.status.toLowerCase() === "draft"
                                            ? "#f0f0f0"
                                            : report.status.toLowerCase() ===
                                                "rejected"
                                              ? "#ffe5e5"
                                              : "#e5f6e5",
                                    color:
                                        report.status.toLowerCase() === "draft"
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
                                sx={{ fontWeight: 600, color: "#555" }}
                            >
                                Incident Date
                            </Typography>
                            <Typography variant="body1">
                                {formatDate(report.incident_date)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "#555" }}
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
                                    sx={{ fontWeight: 600, color: "#555" }}
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
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#555", mb: 1 }}
                        >
                            Description
                        </Typography>
                        <Typography variant="body1">
                            {report.description}
                        </Typography>
                    </Box>

                    {/* Attachments */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "#333", mb: 2 }}
                        >
                            Attachments
                        </Typography>

                        {report.attachments.length === 0 ? (
                            <Typography variant="body2" sx={{ color: "#999" }}>
                                No attachments available.
                            </Typography>
                        ) : (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 2,
                                }}
                            >
                                {report.attachments.map((att) => {
                                    const ext =
                                        att.file_name
                                            .split(".")
                                            .pop()
                                            ?.toLowerCase() || "";
                                    const isImage = [
                                        "jpg",
                                        "jpeg",
                                        "png",
                                        "webp",
                                        "gif",
                                    ].includes(ext);
                                    const isPDF = ext === "pdf";

                                    return (
                                        <Paper
                                            key={att.file_path}
                                            elevation={1}
                                            sx={{
                                                width: 300,
                                                minHeight: 150,
                                                borderRadius: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                p: 2,
                                            }}
                                        >
                                            {/* Icon / Preview */}
                                            <Box
                                                sx={{
                                                    width: 80,
                                                    height: 80,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: 1,
                                                    bgcolor: isPDF
                                                        ? "#e5393520"
                                                        : "#1976d220",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isPDF ? (
                                                    <PictureAsPdfIcon
                                                        sx={{
                                                            color: "#e53935",
                                                            fontSize: 48,
                                                        }}
                                                    />
                                                ) : isImage ? (
                                                    <img
                                                        src={att.signed_url}
                                                        alt={att.file_name}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            borderRadius: 8,
                                                        }}
                                                    />
                                                ) : (
                                                    <DescriptionIcon
                                                        sx={{
                                                            color: "#757575",
                                                            fontSize: 48,
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Info + Button */}
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent:
                                                        "space-between",
                                                    flexGrow: 1,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 500,
                                                        color: "#333",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {att.file_name}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: "#666" }}
                                                >
                                                    {att.signed_url && "File"} •{" "}
                                                    {att.signed_url &&
                                                        "0.01 MB"}
                                                </Typography>

                                                {att.signed_url && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            mt: 1,
                                                            borderRadius: 2,
                                                            alignSelf:
                                                                "flex-start",
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
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                    {/* Admin Notes */}
                    {["reviewed", "approved", "rejected"].includes(
                        report.status.toLowerCase()
                    ) && (
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, color: "#333", mb: 2 }}
                            >
                                Admin Notes
                            </Typography>

                            {report.notes && report.notes.length > 0 ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                    }}
                                >
                                    {report.notes.map((note) => (
                                        <Paper
                                            key={note.id}
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                bgcolor: "#fff",
                                                "&:hover": { boxShadow: 4 },
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{ color: "#333" }}
                                            >
                                                {note.note}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "#999",
                                                    mt: 0.5,
                                                    display: "block",
                                                    textAlign: "right",
                                                }}
                                            >
                                                Added on{" "}
                                                {new Date(
                                                    note.created_at
                                                ).toLocaleString()}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Typography
                                    variant="body2"
                                    sx={{ color: "#666" }}
                                >
                                    No notes provided.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Back Button */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            variant="contained"
                            onClick={() => router.push(backPath)}
                            size="medium"
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                px: 4,
                            }}
                        >
                            Back to Reports
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
}
