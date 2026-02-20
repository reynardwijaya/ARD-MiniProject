"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    reportId: string | null;
    onClose: () => void;
    onDelete: (id: string) => Promise<void>;
}

export default function DeleteConfirmModal({
    isOpen,
    reportId,
    onClose,
    onDelete,
}: DeleteConfirmModalProps) {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                    p: 3,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: 20,
                }}
            >
                Confirm Delete
            </DialogTitle>

            <DialogContent>
                <Typography>
                    Are you sure you want to delete this report? This action
                    cannot be undone.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ gap: 1 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        textTransform: "none",
                        color: "#555",
                        borderRadius: 2,
                        borderColor: "#ccc",
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#d32f2f" },
                    }}
                    onClick={() => {
                        if (reportId) onDelete(reportId);
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
