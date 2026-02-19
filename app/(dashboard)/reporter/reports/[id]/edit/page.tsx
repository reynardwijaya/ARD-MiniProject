// app/reporter/reports/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LayoutUI from "@/app/components/layoutUI";
import ReportFormUI from "@/app/components/ReportForm";

interface ReportFormData {
    title: string;
    description: string;
    incident_date: string;
    location: string;
    severity: string;
    department_id: string;
    tags: string[];
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

const TAG_OPTIONS: string[] = [];

export default function EditReportPage() {
    const params = useParams<{ id: string }>();
    const reportId = params.id;
    const router = useRouter();

    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );
    const [departments, setDepartments] = useState<Department[]>([]);
    const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Original data for comparison
    const [originalData, setOriginalData] = useState<ReportFormData | null>(
        null
    );

    const [formData, setFormData] = useState<ReportFormData>({
        title: "",
        description: "",
        incident_date: "",
        location: "",
        severity: "low",
        department_id: "",
        tags: [],
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    // Helper: get file path
    const getFilePath = (fileUrl: string): string => {
        if (!fileUrl.startsWith("http")) return fileUrl;
        try {
            const url = new URL(fileUrl);
            return url.pathname.replace(
                /^\/storage\/v1\/object\/sign\/report-attachments\//,
                ""
            );
        } catch {
            return fileUrl.includes("/")
                ? fileUrl.split("/").pop() || fileUrl
                : fileUrl;
        }
    };

    // Fetch user
    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();
            if (authUser) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", authUser.id)
                    .single();
                if (userData) {
                    setUser({ email: authUser.email!, role: userData.role });
                }
            }
        };
        fetchUser();
    }, []);

    // Fetch report data
    useEffect(() => {
        if (!reportId) return;

        const fetchData = async () => {
            setLoading(true);

            // Fetch report
            const { data: reportData, error } = await supabase
                .from("adverse_reports")
                .select("*")
                .eq("id", reportId)
                .single();

            if (error || !reportData) {
                router.push("/reporter");
                return;
            }

            // Check if editable
            if (!["draft", "rejected"].includes(reportData.status)) {
                router.push("/reporter");
                return;
            }

            const formDataObj = {
                title: reportData.title,
                description: reportData.description,
                incident_date: reportData.incident_date,
                location: reportData.location || "",
                severity: reportData.severity,
                department_id: reportData.department_id,
                tags: [],
            };

            setFormData(formDataObj);
            setOriginalData(formDataObj);

            // Fetch attachments
            const { data: attachmentData } = await supabase
                .from("report_attachments")
                .select("*")
                .eq("report_id", reportId);
            setAttachments(attachmentData || []);

            // Fetch departments
            const { data: deptData } = await supabase
                .from("department")
                .select("*");
            setDepartments(deptData || []);

            setLoading(false);
        };

        fetchData();
    }, [reportId, router]);

    // Generate preview URLs for existing attachments
    useEffect(() => {
        const generatePreviews = async () => {
            if (attachments.length === 0) {
                setPreviewUrls([]);
                return;
            }

            const signedUrls = await Promise.all(
                attachments.map(async (file: ReportAttachment) => {
                    const filePath = getFilePath(file.file_url);
                    const { data } = await supabase.storage
                        .from("report-attachments")
                        .createSignedUrl(filePath, 3600);
                    return data?.signedUrl ?? null;
                })
            );

            setPreviewUrls(signedUrls.filter((url): url is string => !!url));
        };

        generatePreviews();
    }, [attachments]);

    const handleChange = (field: keyof ReportFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTagsChange = (tags: string[]) => {
        // Tags disabled in edit mode - no action
    };

    const handleFileChange = (file: File | null) => {
        setSelectedFile(file);
        if (file) {
            setLocalPreviewUrl(URL.createObjectURL(file));
        } else {
            setLocalPreviewUrl(null);
        }
    };

    const handleRemoveFile = () => {
        if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
        }
        setSelectedFile(null);
        setLocalPreviewUrl(null);
    };

    // Check if there are changes from original data
    const hasChanges = (): boolean => {
        if (!originalData) return false;

        const isDataChanged =
            formData.title !== originalData.title ||
            formData.description !== originalData.description ||
            formData.incident_date !== originalData.incident_date ||
            formData.location !== originalData.location ||
            formData.severity !== originalData.severity ||
            formData.department_id !== originalData.department_id;

        // New file selected
        const hasNewFile = selectedFile !== null;

        return isDataChanged || hasNewFile;
    };

    // Check if required fields are filled (for submit) - HARUS ADA PERUBAHAN
    const isFormValid = (): boolean => {
        return (
            hasChanges() &&
            formData.title.trim() !== "" &&
            formData.description.trim() !== "" &&
            formData.incident_date !== "" &&
            formData.location.trim() !== "" &&
            formData.department_id !== "" &&
            (selectedFile !== null || attachments.length > 0)
        );
    };

    // Check if only required fields are filled (for draft) - HARUS ADA PERUBAHAN
    const isDraftValid = (): boolean => {
        return (
            hasChanges() &&
            formData.title.trim() !== "" &&
            formData.incident_date !== "" &&
            formData.department_id !== ""
        );
    };

    const handleSubmit = async (status: "draft" | "submitted") => {
        if (!reportId) return;

        setSubmitting(true);

        try {
            // Update report
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
                    status,
                })
                .eq("id", reportId);

            if (updateError) throw updateError;

            // Handle file replacement
            if (selectedFile) {
                // Delete old attachments
                if (attachments.length > 0) {
                    const filePaths = attachments
                        .map((f: ReportAttachment) => getFilePath(f.file_url))
                        .filter((path: string): path is string => !!path);

                    await supabase.storage
                        .from("report-attachments")
                        .remove(filePaths);
                    await supabase
                        .from("report_attachments")
                        .delete()
                        .eq("report_id", reportId);
                }

                // Upload new file
                const fileExt = selectedFile.name.split(".").pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${reportId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("report-attachments")
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                await supabase.from("report_attachments").insert({
                    report_id: reportId,
                    file_name: selectedFile.name,
                    file_url: filePath,
                });
            }

            setSnackbar({
                open: true,
                message:
                    status === "draft"
                        ? "Report saved as draft!"
                        : "Report submitted!",
                severity: "success",
            });

            setTimeout(() => router.push("/reporter"), 1500);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "An error occurred";
            console.error("Error:", errorMessage);
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push("/reporter");
    };

    const userRole = user?.role === "admin" ? "admin" : "reporter";

    if (loading) {
        return (
            <LayoutUI
                pageTitle="Loading..."
                userEmail={undefined}
                userRole={undefined}
                role="reporter"
            >
                Loading...
            </LayoutUI>
        );
    }

    return (
        <LayoutUI
            pageTitle="Edit Report"
            userEmail={user?.email}
            userRole={user?.role}
            role={userRole}
        >
            <ReportFormUI
                mode="edit"
                formData={formData}
                departments={departments}
                attachments={attachments}
                previewUrls={previewUrls}
                selectedFile={selectedFile}
                localPreviewUrl={localPreviewUrl}
                loading={submitting}
                onChange={handleChange}
                onTagsChange={handleTagsChange}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                snackbar={snackbar}
                onSnackbarClose={() =>
                    setSnackbar({ ...snackbar, open: false })
                }
                tagOptions={TAG_OPTIONS}
                isFormValid={isFormValid}
                isDraftValid={isDraftValid}
            />
        </LayoutUI>
    );
}
