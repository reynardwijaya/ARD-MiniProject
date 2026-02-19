// app/reporter/reports/new/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const TAG_OPTIONS: string[] = [];

export default function CreateReportPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; role: string } | null>(
        null
    );
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    // Fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            const { data } = await supabase.from("department").select("*");
            setDepartments(data || []);
        };
        fetchDepartments();
    }, []);

    const handleChange = (field: keyof ReportFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTagsChange = (tags: string[]) => {
        // Tags disabled - no action
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

    // Check if required fields are filled (for submit)
    const isFormValid = (): boolean => {
        return (
            formData.title.trim() !== "" &&
            formData.description.trim() !== "" &&
            formData.incident_date !== "" &&
            formData.location.trim() !== "" &&
            formData.department_id !== "" &&
            selectedFile !== null
        );
    };

    // Check if only required fields are filled (for draft)
    const isDraftValid = (): boolean => {
        return (
            formData.title.trim() !== "" &&
            formData.incident_date !== "" &&
            formData.department_id !== ""
        );
    };

    const handleSubmit = async (status: "draft" | "submitted") => {
        setLoading(true);

        try {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();
            if (!authUser) throw new Error("User not authenticated");

            // Create report
            const { data: newReport, error: createError } = await supabase
                .from("adverse_reports")
                .insert({
                    title: formData.title,
                    description: formData.description,
                    incident_date: formData.incident_date,
                    location: formData.location,
                    severity: formData.severity,
                    department_id: formData.department_id,
                    status,
                    reporter_id: authUser.id,
                })
                .select()
                .single();

            if (createError) throw createError;

            // Upload file if exists
            if (selectedFile && newReport) {
                const fileExt = selectedFile.name.split(".").pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${newReport.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("report-attachments")
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                await supabase.from("report_attachments").insert({
                    report_id: newReport.id,
                    file_name: selectedFile.name,
                    file_url: filePath,
                });
            }

            setSnackbar({
                open: true,
                message: `Report saved as ${status}!`,
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
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/reporter");
    };

    const userRole = user?.role === "admin" ? "admin" : "reporter";

    if (!user) {
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
            pageTitle="Create New Report"
            userEmail={user.email}
            userRole={user.role}
            role={userRole}
        >
            <ReportFormUI
                mode="create"
                formData={formData}
                departments={departments}
                selectedFile={selectedFile}
                localPreviewUrl={localPreviewUrl}
                loading={loading}
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
