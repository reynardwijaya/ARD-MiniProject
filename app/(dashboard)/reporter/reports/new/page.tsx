"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    TextField,
    Button,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    Chip,
    Snackbar,
    Alert,
    Divider,
    Box,
    Typography,
    Paper,
    Fade,
} from "@mui/material";
import { supabase } from "../../../../lib/supabase";
import LayoutUI from "../../layoutUI";

interface Department {
    id: string;
    name: string;
}

const tagOptions = ["drug reaction", "serious", "new"];

export default function CreateReportPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [incidentDate, setIncidentDate] = useState("");
    const [location, setLocation] = useState("");
    const [severity, setSeverity] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );

    // ambil user
    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                if (userData) {
                    setUser({ email: user.email!, role: userData.role });
                }
            }
        };
        fetchUser();
    }, []);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            const { data, error } = await supabase
                .from("department")
                .select("*");
            if (error) {
                setSnackbar({
                    open: true,
                    message: error.message,
                    severity: "error",
                });
            } else {
                setDepartments(data ?? []);
            }
        };
        fetchDepartments();
    }, []);

    const handleSave = async (status: "draft" | "submitted") => {
        if (!title || !incidentDate || !severity || !departmentId) {
            setSnackbar({
                open: true,
                message: "Title, Date, Severity, dan Department wajib diisi",
                severity: "error",
            });
            return;
        }

        setLoading(true);

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setSnackbar({
                open: true,
                message: "Silakan login ulang",
                severity: "error",
            });
            setLoading(false);
            return;
        }

        const { data: report, error: reportError } = await supabase
            .from("adverse_reports")
            .insert({
                title,
                description,
                incident_date: incidentDate,
                location,
                severity,
                status,
                department_id: departmentId,
                reporter_id: user.id,
            })
            .select()
            .single();

        if (reportError || !report) {
            setSnackbar({
                open: true,
                message: reportError?.message ?? "Gagal membuat report",
                severity: "error",
            });
            setLoading(false);
            return;
        }

        const reportId = report.id;

        if (tags.length > 0) {
            await supabase.from("report_tags").insert(
                tags.map((tag) => ({
                    report_id: reportId,
                    tag,
                }))
            );
        }

        if (file) {
            const filePath = `${reportId}/${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("report-attachments")
                .upload(filePath, file);

            if (uploadError) {
                setSnackbar({
                    open: true,
                    message: uploadError.message,
                    severity: "error",
                });
            } else {
                const { data: signedUrl } = await supabase.storage
                    .from("report-attachments")
                    .createSignedUrl(filePath, 3600);

                if (signedUrl?.signedUrl) {
                    await supabase.from("report_attachments").insert({
                        report_id: reportId,
                        file_name: file.name,
                        file_url: signedUrl.signedUrl,
                    });
                }
            }
        }

        setSnackbar({
            open: true,
            message: `Report berhasil disimpan sebagai ${status}`,
            severity: "success",
        });

        setTitle("");
        setDescription("");
        setIncidentDate("");
        setLocation("");
        setSeverity("");
        setDepartmentId("");
        setTags([]);
        setFile(null);
        setFilePreview(null);
        setLoading(false);
    };

    return (
        <LayoutUI
            pageTitle="Create New Report"
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
                                Create Adverse Report
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#666", mt: 1 }}
                            >
                                Please fill the report details carefully
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
                            <TextField
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />

                            <TextField
                                label="Description"
                                multiline
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />

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
                                    value={incidentDate}
                                    onChange={(e) =>
                                        setIncidentDate(e.target.value)
                                    }
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2,
                                        },
                                    }}
                                />
                                <TextField
                                    label="Location"
                                    value={location}
                                    onChange={(e) =>
                                        setLocation(e.target.value)
                                    }
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2,
                                        },
                                    }}
                                />
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
                                <TextField
                                    select
                                    label="Severity"
                                    value={severity}
                                    onChange={(e) =>
                                        setSeverity(e.target.value)
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
                                    value={departmentId}
                                    onChange={(e) =>
                                        setDepartmentId(e.target.value)
                                    }
                                    fullWidth
                                    variant="outlined"
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

                            <FormControl
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            >
                                <InputLabel>Tags</InputLabel>
                                <Select
                                    multiple
                                    value={tags}
                                    onChange={(e) =>
                                        setTags(e.target.value as string[])
                                    }
                                    input={<OutlinedInput label="Tags" />}
                                    renderValue={(selected) => (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 1,
                                            }}
                                        >
                                            {(selected as string[]).map(
                                                (tag) => (
                                                    <Chip
                                                        key={tag}
                                                        label={tag}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#e0e0e0",
                                                        }}
                                                    />
                                                )
                                            )}
                                        </Box>
                                    )}
                                >
                                    {tagOptions.map((tag) => (
                                        <MenuItem key={tag} value={tag}>
                                            {tag}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        setFile(f);
                                        setFilePreview(URL.createObjectURL(f));
                                    }}
                                    style={{ display: "none" }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload">
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

                                {file && (
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
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500 }}
                                            >
                                                {file.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: "#666" }}
                                            >
                                                {(
                                                    file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{" "}
                                                MB
                                            </Typography>
                                            {file.type.startsWith("image/") && (
                                                <Image
                                                    src={filePreview!}
                                                    alt="File preview"
                                                    width={128}
                                                    height={128}
                                                    style={{
                                                        marginTop: 8,
                                                        borderRadius: 8,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Button
                                            color="error"
                                            size="small"
                                            onClick={() => {
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                            sx={{ textTransform: "none" }}
                                        >
                                            Remove
                                        </Button>
                                    </Box>
                                )}
                            </Box>

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
                                    disabled={loading}
                                    onClick={() => handleSave("draft")}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        px: 3,
                                        "&:hover": { bgcolor: "#f5f5f5" },
                                    }}
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    variant="contained"
                                    disabled={loading}
                                    onClick={() => handleSave("submitted")}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        px: 3,
                                        bgcolor: "#1976d2",
                                        "&:hover": { bgcolor: "#1565c0" },
                                    }}
                                >
                                    Submit Report
                                </Button>
                            </Box>
                        </Box>
                    </Paper>

                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={4000}
                        onClose={() =>
                            setSnackbar({ ...snackbar, open: false })
                        }
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                    >
                        <Alert severity={snackbar.severity} variant="filled">
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            </Fade>
        </LayoutUI>
    );
}
