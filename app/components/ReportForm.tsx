// components/ReportFormUI.tsx

"use client";

import {
    TextField,
    Button,
    MenuItem,
    Snackbar,
    Alert,
    Divider,
    Box,
    Typography,
    Paper,
    Fade,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";

interface ReportFormData {
    title: string;
    description: string;
    incident_date: string;
    location: string;
    severity: string;
    department_id: string;
    tags?: string[];
}

interface Department {
    id: string;
    name: string;
}

interface ReportAttachment {
    id: string;
    report_id: string;
    file_name: string;
    file_url: string;
    created_at: string;
}

interface ReportFormUIProps {
    mode: "create" | "edit";
    formData: ReportFormData;
    departments: Department[];
    attachments?: ReportAttachment[];
    previewUrls?: string[];
    selectedFile: File | null;
    localPreviewUrl?: string | null;
    loading: boolean;
    onChange: (field: keyof ReportFormData, value: string) => void;
    onTagsChange: (tags: string[]) => void;
    onFileChange: (file: File | null) => void;
    onRemoveFile: () => void;
    onSubmit: (status: "draft" | "submitted") => void;
    onCancel: () => void;
    snackbar: {
        open: boolean;
        message: string;
        severity: "success" | "error";
    };
    onSnackbarClose: () => void;
    tagOptions?: string[];
    isFormValid?: () => boolean;
    isDraftValid?: () => boolean;
}

// Helper: Get file extension
const getFileExtension = (fileName: string): string => {
    return fileName.split(".").pop()?.toLowerCase() || "";
};

// Helper: Check if file is image
const isImageFile = (fileName: string): boolean => {
    const ext = getFileExtension(fileName);
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
};

// Helper: Get file icon based on type
const getFileIcon = (fileName: string) => {
    const ext = getFileExtension(fileName);

    if (ext === "pdf") {
        return <PictureAsPdfIcon sx={{ fontSize: 40, color: "#e53935" }} />;
    }
    if (["doc", "docx", "txt"].includes(ext)) {
        return <DescriptionIcon sx={{ fontSize: 40, color: "#1976d2" }} />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return <TableChartIcon sx={{ fontSize: 40, color: "#43a047" }} />;
    }
    if (isImageFile(fileName)) {
        return null;
    }

    return <DescriptionIcon sx={{ fontSize: 40, color: "#757575" }} />;
};

// Helper: Get file type label
const getFileTypeLabel = (fileName: string): string => {
    const ext = getFileExtension(fileName).toUpperCase();
    if (ext === "pdf") return "PDF Document";
    if (["doc", "docx"].includes(ext)) return "Word Document";
    if (["xls", "xlsx"].includes(ext) || ext === "csv")
        return "Excel Spreadsheet";
    if (isImageFile(fileName)) return "Image";
    return "File";
};

export default function ReportFormUI({
    mode,
    formData,
    departments,
    attachments = [],
    previewUrls = [],
    selectedFile,
    localPreviewUrl,
    loading,
    onChange,
    onTagsChange,
    onFileChange,
    onRemoveFile,
    onSubmit,
    onCancel,
    snackbar,
    onSnackbarClose,
    tagOptions = [],
    isFormValid,
    isDraftValid,
}: ReportFormUIProps) {
    const pageTitle = mode === "create" ? "Create New Report" : "Edit Report";
    const subtitle =
        mode === "create"
            ? "Fill in the details below to create a new adverse event report"
            : "Only draft & rejected reports can be edited";

    const showLocalPreview = selectedFile && localPreviewUrl;
    const isNewFileImage = selectedFile
        ? isImageFile(selectedFile.name)
        : false;
    const showExistingPreview =
        mode === "edit" && previewUrls.length > 0 && !selectedFile;

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
                            {pageTitle}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "#666", mt: 1 }}
                        >
                            {subtitle}
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
                        {/* Title */}
                        <TextField
                            label="Title"
                            value={formData.title}
                            onChange={(e) => onChange("title", e.target.value)}
                            fullWidth
                            variant="outlined"
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                            }}
                        />

                        {/* Description */}
                        <TextField
                            label="Description"
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={(e) =>
                                onChange("description", e.target.value)
                            }
                            fullWidth
                            variant="outlined"
                            required
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                            }}
                        />

                        {/* Incident Date & Location */}
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
                            <TextField
                                type="date"
                                label="Incident Date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.incident_date}
                                onChange={(e) =>
                                    onChange("incident_date", e.target.value)
                                }
                                fullWidth
                                variant="outlined"
                                required
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                            <TextField
                                label="Location"
                                value={formData.location}
                                onChange={(e) =>
                                    onChange("location", e.target.value)
                                }
                                fullWidth
                                variant="outlined"
                                required
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Box>

                        {/* Severity & Department */}
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
                            <TextField
                                select
                                label="Severity"
                                value={formData.severity}
                                onChange={(e) =>
                                    onChange("severity", e.target.value)
                                }
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            >
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                            </TextField>
                            <TextField
                                select
                                label="Department"
                                value={formData.department_id}
                                onChange={(e) =>
                                    onChange("department_id", e.target.value)
                                }
                                fullWidth
                                variant="outlined"
                                required
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            >
                                {departments.map((dep) => (
                                    <MenuItem key={dep.id} value={dep.id}>
                                        {dep.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        {/* Attachment Section - REQUIRED */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: "#333" }}
                            >
                                Attachment{" "}
                                <Typography
                                    component="span"
                                    sx={{ color: "#e53935" }}
                                >
                                    *
                                </Typography>
                            </Typography>

                            {/* Preview File Baru */}
                            {showLocalPreview && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 2,
                                        border: "1px solid #e0e0e0",
                                        borderRadius: 2,
                                        bgcolor: "#f9f9f9",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                        }}
                                    >
                                        {isNewFileImage && localPreviewUrl ? (
                                            <Box
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: 1,
                                                    overflow: "hidden",
                                                    border: "1px solid #e0e0e0",
                                                }}
                                            >
                                                <img
                                                    src={localPreviewUrl}
                                                    alt="Preview"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: 1,
                                                    bgcolor: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "1px solid #e0e0e0",
                                                }}
                                            >
                                                {getFileIcon(
                                                    selectedFile?.name || ""
                                                )}
                                            </Box>
                                        )}
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500 }}
                                            >
                                                {selectedFile?.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: "#666" }}
                                            >
                                                {getFileTypeLabel(
                                                    selectedFile?.name || ""
                                                )}{" "}
                                                -{" "}
                                                {selectedFile?.size &&
                                                    (
                                                        selectedFile.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{" "}
                                                MB
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        color="error"
                                        size="small"
                                        onClick={onRemoveFile}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            )}

                            {/* Preview Attachment Lama */}
                            {showExistingPreview && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 2,
                                    }}
                                >
                                    {previewUrls.map(
                                        (url: string, index: number) => {
                                            const attachment =
                                                attachments[index];
                                            const fileName =
                                                attachment?.file_name ||
                                                "attachment";
                                            const isImage =
                                                isImageFile(fileName);

                                            return (
                                                <Box
                                                    key={index}
                                                    onClick={() =>
                                                        window.open(
                                                            url,
                                                            "_blank"
                                                        )
                                                    }
                                                    sx={{
                                                        width: 120,
                                                        height: 120,
                                                        borderRadius: 2,
                                                        border: "1px solid #e0e0e0",
                                                        overflow: "hidden",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        bgcolor: "#f9f9f9",
                                                        transition: "all 0.2s",
                                                        "&:hover": {
                                                            borderColor:
                                                                "#1976d2",
                                                            bgcolor: "#f0f7ff",
                                                        },
                                                    }}
                                                >
                                                    {isImage ? (
                                                        <img
                                                            src={url}
                                                            alt={fileName}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                textAlign:
                                                                    "center",
                                                                p: 1,
                                                            }}
                                                        >
                                                            {getFileIcon(
                                                                fileName
                                                            )}
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    display:
                                                                        "block",
                                                                    mt: 0.5,
                                                                    fontSize: 10,
                                                                }}
                                                            >
                                                                {getFileExtension(
                                                                    fileName
                                                                ).toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        }
                                    )}
                                </Box>
                            )}

                            {/* Tidak Ada Attachment - Show Warning */}
                            {mode === "edit" &&
                                previewUrls.length === 0 &&
                                !selectedFile && (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "#e53935" }}
                                    >
                                        No attachment uploaded
                                    </Typography>
                                )}

                            <Divider />

                            {/* File Input */}
                            {!selectedFile && (
                                <Box>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
                                        onChange={(e) =>
                                            onFileChange(
                                                e.target.files?.[0] || null
                                            )
                                        }
                                        style={{ display: "none" }}
                                        id={`file-upload-${mode}`}
                                    />
                                    <label htmlFor={`file-upload-${mode}`}>
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: "none",
                                                borderColor: "#ccc",
                                                color: "#666",
                                                "&:hover": {
                                                    borderColor: "#999",
                                                    bgcolor: "#f9f9f9",
                                                },
                                            }}
                                        >
                                            Choose File
                                        </Button>
                                    </label>
                                </Box>
                            )}
                        </Box>

                        {/* Buttons */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 2,
                                pt: 2,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={onCancel}
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    px: 3,
                                    "&:hover": { bgcolor: "#f5f5f5" },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => onSubmit("draft")}
                                disabled={
                                    loading ||
                                    !(isDraftValid ? isDraftValid() : false)
                                }
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    px: 3,
                                }}
                            >
                                Save Draft
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => onSubmit("submitted")}
                                disabled={
                                    loading ||
                                    !(isFormValid ? isFormValid() : false)
                                }
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    px: 3,
                                    bgcolor: "#1976d2",
                                    "&:hover": { bgcolor: "#1565c0" },
                                }}
                            >
                                {loading ? "Saving..." : "Submit Report"}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={onSnackbarClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                    <Alert severity={snackbar.severity} variant="filled">
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Fade>
    );
}
