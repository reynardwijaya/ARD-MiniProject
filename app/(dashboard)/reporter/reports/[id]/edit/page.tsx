"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { supabase } from "../../../../../lib/supabase";
import LayoutUI from "../../../../../lib/layoutUI";

interface ReportData {
    title: string;
    description: string;
    incident_date: string;
    location: string;
    severity: string;
    department_id: string;
    status: string;
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

export default function EditReportPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const router = useRouter();

    const [formData, setFormData] = useState<ReportData | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    ); // Tambah state user

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);

            // Tambah fetch user
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                const { data: userRoleData, error: userError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", userData.user.id)
                    .single();
                if (!userError && userRoleData) {
                    setUser({
                        email: userData.user.email!,
                        role: userRoleData.role,
                    });
                }
            }

            const { data, error } = await supabase
                .from("adverse_reports")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                router.push("/reporter");
                return;
            }

            if (!["draft", "rejected"].includes(data.status)) {
                router.push("/reporter");
                return;
            }

            const formattedData: ReportData = {
                title: data.title,
                description: data.description,
                incident_date: data.incident_date,
                location: data.location || "",
                severity: data.severity,
                department_id: data.department_id,
                status: data.status,
            };

            setFormData(formattedData);

            const { data: attachmentData } = await supabase
                .from("report_attachments")
                .select("*")
                .eq("report_id", id);

            setAttachments(attachmentData || []);

            const { data: deptData } = await supabase
                .from("department")
                .select("*");

            setDepartments(deptData || []);
            setLoading(false);
        };

        fetchData();
    }, [id, router]);

    // Tentukan role berdasarkan user
    const userRole = user?.role === "admin" ? "admin" : "reporter";

    useEffect(() => {
        const generatePreview = async () => {
            if (attachments.length === 0) {
                setPreviewUrls([]);
                return;
            }

            const signedUrls = await Promise.all(
                attachments.map(async (file) => {
                    const { data } = await supabase.storage
                        .from("report-attachments")
                        .createSignedUrl(file.file_url, 3600);

                    return data?.signedUrl ?? null;
                })
            );

            setPreviewUrls(signedUrls.filter((url): url is string => !!url));
        };

        generatePreview();
    }, [attachments]);

    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const handleChange = (field: keyof ReportData, value: string) => {
        if (!formData) return;
        setFormData({ ...formData, [field]: value });
    };

    const handleUpdate = async () => {
        if (!formData) return;

        // Update report dulu
        const { error: updateError } = await supabase
            .from("adverse_reports")
            .update({
                title: formData.title,
                description: formData.description,
                incident_date: formData.incident_date,
                location: formData.location,
                severity: formData.severity,
                department_id: formData.department_id,
                updated_at: new Date(),
                status: "draft",
            })
            .eq("id", id);

        if (updateError) {
            console.error("UPDATE ERROR:", updateError);
            setSnackbar({
                open: true,
                message: updateError.message,
                severity: "error",
            });
            return;
        }

        // file baru
        if (selectedFile) {
            // Hapus attc lama (kalo ada)
            if (attachments.length > 0) {
                // Hapus file dari storage
                await supabase.storage
                    .from("report-attachments")
                    .remove(attachments.map((file) => file.file_url));

                // Hapus record dari db
                await supabase
                    .from("report_attachments")
                    .delete()
                    .eq("report_id", id);
            }

            //  Upload file baru
            const fileExt = selectedFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("report-attachments")
                .upload(filePath, selectedFile);

            if (uploadError) {
                setSnackbar({
                    open: true,
                    message: uploadError.message,
                    severity: "error",
                });
                return;
            }

            // Insert record baru
            const { error: insertError } = await supabase
                .from("report_attachments")
                .insert({
                    report_id: id,
                    file_name: fileName,
                    file_url: filePath,
                });

            if (insertError) {
                setSnackbar({
                    open: true,
                    message: insertError.message,
                    severity: "error",
                });
                return;
            }

            // Refresh attachment state
            const { data: newAttachment } = await supabase
                .from("report_attachments")
                .select("*")
                .eq("report_id", id)
                .order("created_at", { ascending: false });

            setAttachments(newAttachment || []);
            setSelectedFile(null);
        }

        setSnackbar({
            open: true,
            message: "Report berhasil diupdate",
            severity: "success",
        });

        setTimeout(() => {
            router.push("/reporter");
        }, 1500);
    };

    if (loading || !formData)
        return (
            <LayoutUI
                pageTitle="Loading..."
                userEmail={user?.email}
                userRole={user?.role}
                role={userRole} // Tambah prop role
            >
                Loading...
            </LayoutUI>
        );

    return (
        <LayoutUI
            pageTitle="Edit Report"
            userEmail={user?.email}
            userRole={user?.role}
            role={userRole} // Tambah prop role
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
                                Edit Adverse Report
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#666", mt: 1 }}
                            >
                                Only draft & rejected reports can be edited
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
                                value={formData.title}
                                onChange={(e) =>
                                    handleChange("title", e.target.value)
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
                                label="Description"
                                multiline
                                rows={4}
                                value={formData.description}
                                onChange={(e) =>
                                    handleChange("description", e.target.value)
                                }
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
                                    value={formData.incident_date}
                                    onChange={(e) =>
                                        handleChange(
                                            "incident_date",
                                            e.target.value
                                        )
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
                                    value={formData.location}
                                    onChange={(e) =>
                                        handleChange("location", e.target.value)
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
                                    value={formData.severity}
                                    onChange={(e) =>
                                        handleChange("severity", e.target.value)
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
                                        handleChange(
                                            "department_id",
                                            e.target.value
                                        )
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

                            {/* ATTACHMENT SECTION */}
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
                                    Attachment Preview
                                </Typography>

                                {previewUrls.length > 0 ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 2,
                                        }}
                                    >
                                        {previewUrls.map((url, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    width: 128,
                                                    height: 128,
                                                    borderRadius: 2,
                                                    border: "1px solid #e0e0e0",
                                                    overflow: "hidden",
                                                    cursor: "pointer",
                                                    "&:hover": {
                                                        borderColor: "#ccc",
                                                    },
                                                }}
                                                onClick={() =>
                                                    window.open(url, "_blank")
                                                }
                                            >
                                                <img
                                                    src={url}
                                                    alt="attachment"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "#999" }}
                                    >
                                        No attachment uploaded
                                    </Typography>
                                )}

                                <Divider />

                                <Box>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setSelectedFile(file);
                                                const localUrl =
                                                    URL.createObjectURL(file);
                                                setPreviewUrls([localUrl]);
                                            }
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
                                            Choose New File
                                        </Button>
                                    </label>
                                </Box>
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
                                    onClick={() => router.push("/reporter")}
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
                                    variant="contained"
                                    onClick={handleUpdate}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        px: 3,
                                        bgcolor: "#1976d2",
                                        "&:hover": { bgcolor: "#1565c0" },
                                    }}
                                >
                                    Save Changes
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
