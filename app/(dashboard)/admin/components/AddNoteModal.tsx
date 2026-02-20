"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { supabase } from "@/app/lib/supabase";

interface AddNoteModalProps {
    isOpen: boolean;
    reportId: string | null;
    nextStatus?: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddNoteModal({
    isOpen,
    reportId,
    nextStatus,
    onClose,
    onSuccess,
}: AddNoteModalProps) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchExistingNote = async () => {
            if (!reportId) return;

            const { data } = await supabase
                .from("report_note")
                .select("note")
                .eq("report_id", reportId)
                .maybeSingle();

            setNote(data?.note || "");
        };

        if (isOpen) fetchExistingNote();
    }, [isOpen, reportId]);

    const handleClose = () => {
        setNote("");
        onClose();
    };

    const handleSave = async () => {
        if (!note.trim() || !reportId) return;

        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.from("report_note").upsert(
            {
                report_id: reportId,
                admin_id: user?.id,
                note: note.trim(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "report_id" }
        );

        if (error) {
            alert("Failed to save note");
            setLoading(false);
            return;
        }

        if (nextStatus) {
            await supabase.rpc("update_report_status", {
                p_report_id: reportId,
                p_status: nextStatus,
            });
        }

        setLoading(false);
        handleClose();
        onSuccess();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                    p: 3,
                },
            }}
        >
            {/* Title */}
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "#222",
                    mb: 1,
                }}
            >
                Add Internal Note
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        bgcolor: "#f0f0f0",
                        "&:hover": { bgcolor: "#e0e0e0" },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ mt: 1 }}>
                <TextField
                    multiline
                    rows={6}
                    fullWidth
                    placeholder="Write internal note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "#fafafa",
                            "&:hover fieldset": { borderColor: "#ccc" },
                        },
                        "& .MuiInputBase-input": {
                            fontSize: 15,
                            color: "#333",
                        },
                    }}
                />
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ pt: 2, gap: 1 }}>
                <Button
                    variant="outlined"
                    onClick={handleClose}
                    sx={{
                        textTransform: "none",
                        color: "#555",
                        borderRadius: 2,
                        borderColor: "#ccc",
                        "&:hover": { bgcolor: "#f5f5f5", borderColor: "#999" },
                    }}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!note.trim() || loading}
                    sx={{
                        textTransform: "none",
                        bgcolor: "#1976d2",
                        borderRadius: 2,
                        color: "#fff",
                        "&:hover": { bgcolor: "#1565c0" },
                        "&:disabled": { bgcolor: "#e0e0e0", color: "#999" },
                    }}
                >
                    {loading ? "Saving..." : "Save Note"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
