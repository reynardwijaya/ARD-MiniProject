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
    nextStatus?: string | null; // ⬅ TAMBAH
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

            if (data) {
                setNote(data.note);
            } else {
                setNote(""); // reset kalau tidak ada
            }
        };

        if (isOpen) {
            fetchExistingNote();
        }
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
            {
                onConflict: "report_id",
            }
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
                    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e0e0e0",
                    pb: 2,
                    fontWeight: 600, // pindah ke sini
                }}
            >
                Add Internal Note
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                <TextField
                    multiline
                    rows={5}
                    fullWidth
                    placeholder="Write internal note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    sx={{
                        mt: 1,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                        },
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button
                    variant="outlined"
                    onClick={handleClose}
                    sx={{ borderColor: "#666", color: "#666" }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!note.trim() || loading}
                    sx={{
                        bgcolor: "#1976d2",
                        "&:hover": {
                            bgcolor: "#1565c0",
                        },
                        "&:disabled": {
                            bgcolor: "#e0e0e0",
                            color: "#999",
                        },
                    }}
                >
                    {loading ? "Saving..." : "Save Note"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
