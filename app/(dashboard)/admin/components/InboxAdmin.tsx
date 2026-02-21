"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Chip,
    TablePagination,
    Fade,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Button from "@mui/material/Button";
import { supabase } from "@/app/lib/supabase";
import AddNoteModal from "./AddNoteModal";

interface InboxReport {
    id: string;
    title: string;
    user_name: string;
    department_name: string;
    severity: string;
    incident_date: string;
    status: string;
    created_at: string;
}

interface InboxAdminProps {
    onDataChanged: () => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
        case "high":
            return "#d32f2f";
        case "medium":
            return "#f57c00";
        case "low":
            return "#388e3c";
        default:
            return "#9e9e9e";
    }
}

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case "submitted":
            return "#1976d2";
        case "reviewed":
            return "#7b1fa2";
        case "approved":
            return "#388e3c";
        case "rejected":
            return "#d32f2f";
        default:
            return "#9e9e9e";
    }
}

export default function InboxAdmin({ onDataChanged }: InboxAdminProps) {
    const router = useRouter();

    const [data, setData] = useState<InboxReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Pagination
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalData, setTotalData] = useState(0);

    // Debounced search (supaya tidak fetch tiap ketikan)
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [noteModal, setNoteModal] = useState<{
        isOpen: boolean;
        reportId: string | null;
        nextStatus: string | null;
    }>({
        isOpen: false,
        reportId: null,
        nextStatus: null,
    });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(
        null
    );

    // const filteredData = useMemo(() => {
    //     if (!search) return data;
    //     return data.filter((r) =>
    //         r.title.toLowerCase().includes(search.toLowerCase())
    //     );
    // }, [search, data]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/reports?search=${debouncedSearch}&page=${pageIndex + 1}&limit=${pageSize}&role=admin&view=inbox`
            );
            const json = await res.json();

            if (!res.ok) {
                console.error("Error fetching reports:", json.error);
                setData([]);
                setTotalData(0);
            } else {
                setData(json.data || []);
                setTotalData(json.total || 0);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setData([]);
            setTotalData(0);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [pageIndex, pageSize, debouncedSearch]);

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        setAnchorEl(null);

        const { error } = await supabase.rpc("update_report_status", {
            p_report_id: reportId,
            p_status: newStatus,
        });

        if (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
            return;
        }

        // Remove row from table if approved/rejected
        if (newStatus === "approved" || newStatus === "rejected") {
            setData((prev) => prev.filter((r) => r.id !== reportId));
        } else {
            // Update status in place
            setData((prev) =>
                prev.map((r) =>
                    r.id === reportId ? { ...r, status: newStatus } : r
                )
            );
        }
    };

    const handleMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        reportId: string
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedReportId(reportId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedReportId(null);
    };

    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        reportId: string | null;
        newStatus: string | null;
    }>({
        open: false,
        reportId: null,
        newStatus: null,
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPageIndex(0); // reset ke page 0 saat search berubah
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [search]);

    const columns = useMemo<ColumnDef<InboxReport>[]>(
        () => [
            {
                accessorKey: "title",
                header: "Title",
                cell: ({ row }) => (
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            color: "#333",
                            cursor: "pointer",
                            "&:hover": { color: "#333" },
                        }}
                        onClick={() =>
                            router.push(`/admin/reports/${row.original.id}`)
                        }
                    >
                        {row.original.title}
                    </Typography>
                ),
            },
            {
                accessorKey: "user_name",
                header: "Reporter",
                cell: ({ getValue }) => (
                    <Typography variant="body2">
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: "department_name",
                header: "Department",
                cell: ({ getValue }) => (
                    <Typography variant="body2">
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: "severity",
                header: "Severity",
                cell: ({ getValue }) => {
                    const value = getValue() as string;
                    const color = getSeverityColor(value);
                    return (
                        <Chip
                            label={value}
                            size="small"
                            sx={{
                                bgcolor: `${color}20`,
                                color: color,
                                fontWeight: 600,
                                borderRadius: 2,
                            }}
                        />
                    );
                },
            },
            {
                accessorKey: "incident_date",
                header: "Incident Date",
                cell: ({ getValue }) => (
                    <Typography variant="body2">
                        {formatDate(getValue() as string)}
                    </Typography>
                ),
            },
            {
                accessorKey: "created_at",
                header: "Created At",
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ color: "#666" }}>
                        {getRelativeTime(getValue() as string)}
                    </Typography>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => {
                    const value = getValue() as string;
                    const color = getStatusColor(value);
                    return (
                        <Chip
                            label={value}
                            size="small"
                            sx={{
                                bgcolor: `${color}20`,
                                color: color,
                                fontWeight: 600,
                                borderRadius: 2,
                            }}
                        />
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const report = row.original;
                    return (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Change Status">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    endIcon={<ArrowDropDownIcon />}
                                    onClick={(e) =>
                                        handleMenuOpen(e, report.id)
                                    }
                                    sx={{
                                        textTransform: "capitalize",
                                        borderRadius: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {report.status}
                                </Button>
                            </Tooltip>
                            <Tooltip title="Add Note">
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() =>
                                        setNoteModal({
                                            isOpen: true,
                                            reportId: report.id,
                                            nextStatus: null,
                                        })
                                    }
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 500,
                                        color: "#f10a0a",
                                    }}
                                >
                                    Add Note
                                </Button>
                            </Tooltip>
                        </Box>
                    );
                },
            },
        ],
        [router]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true, // <-- penting kalau server-side
        pageCount: Math.ceil(totalData / pageSize), // <-- total page dari server
        state: { pagination: { pageIndex, pageSize } }, // sync state react-table
    });

    if (loading) {
        return (
            <Fade in={true} timeout={600}>
                <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
                    <Box sx={{ mb: 3 }}>
                        <Box
                            sx={{
                                height: 32,
                                width: 200,
                                bgcolor: "#e0e0e0",
                                borderRadius: 2,
                                mb: 2,
                                animation: "pulse 1.5s infinite",
                            }}
                        />
                        <Box
                            sx={{
                                height: 48,
                                bgcolor: "#e0e0e0",
                                borderRadius: 2,
                                animation: "pulse 1.5s infinite",
                            }}
                        />
                    </Box>
                </Box>
            </Fade>
        );
    }

    return (
        <>
            <Fade in={true} timeout={600}>
                <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
                    <Box
                        sx={{
                            mb: 3,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 600, color: "#333", mb: 0.5 }}
                            >
                                Inbox Admin
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#666" }}>
                                {data.length} pending report
                                {data.length !== 1 ? "s" : ""}
                            </Typography>
                        </Box>
                        <TextField
                            placeholder="Search reports..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{
                                width: { xs: "100%", md: 300 },
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    bgcolor: "white",
                                    boxShadow:
                                        "0 2px 8px rgba(25, 118, 210, 0.1)",
                                    "&:hover": {
                                        boxShadow:
                                            "0 4px 12px rgba(25, 118, 210, 0.15)",
                                    },
                                    transition: "box-shadow 0.3s ease",
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: "#1976d2" }} />
                                    </InputAdornment>
                                ),
                                endAdornment: search ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearch("")}
                                        >
                                            <ClearIcon sx={{ color: "#666" }} />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </Box>

                    <TableContainer
                        component={Paper}
                        elevation={2}
                        sx={{
                            borderRadius: 3,
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(25, 118, 210, 0.1)",
                        }}
                    >
                        <Table>
                            <TableHead
                                sx={{
                                    bgcolor:
                                        "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                                }}
                            >
                                <TableRow>
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) =>
                                            headerGroup.headers.map(
                                                (header) => (
                                                    <TableCell
                                                        key={header.id}
                                                        sx={{
                                                            color: "black",
                                                            fontWeight: 600,
                                                            fontSize:
                                                                "0.875rem",
                                                            borderBottom:
                                                                "none",
                                                        }}
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
                                                        )}
                                                    </TableCell>
                                                )
                                            )
                                        )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            sx={{ textAlign: "center", py: 8 }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "#999" }}
                                            >
                                                No pending reports
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            sx={{
                                                "&:hover": {
                                                    bgcolor: "#f0f8ff",
                                                    transform:
                                                        "translateY(-1px)",
                                                    boxShadow:
                                                        "0 2px 8px rgba(25, 118, 210, 0.1)",
                                                },
                                                transition: "all 0.2s ease",
                                                cursor: "pointer",
                                            }}
                                            onClick={() =>
                                                router.push(
                                                    `/admin/reports/${row.original.id}`
                                                )
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        sx={{
                                                            borderBottom:
                                                                "1px solid #e0e0e0",
                                                            py: 2,
                                                        }}
                                                        onClick={(e) => {
                                                            // Prevent row click if clicking on actions
                                                            if (
                                                                cell.column
                                                                    .id ===
                                                                "actions"
                                                            ) {
                                                                e.stopPropagation();
                                                            }
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={totalData} // <-- ganti ke total data dari server
                        page={pageIndex}
                        onPageChange={(_, page) => setPageIndex(page)}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPageIndex(0); // reset ke page 0 saat pageSize berubah
                        }}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        sx={{
                            mt: 2,
                            "& .MuiTablePagination-toolbar": {
                                justifyContent: "space-between",
                            },
                            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                                { color: "#666" },
                            "& .MuiIconButton-root": {
                                color: "#1976d2",
                                "&:hover": { bgcolor: "#1976d220" },
                            },
                        }}
                    />
                </Box>
            </Fade>

            {/* Status Dropdown Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        borderRadius: 2,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (selectedReportId) {
                            setConfirmModal({
                                open: true,
                                reportId: selectedReportId,
                                newStatus: "reviewed",
                            });
                            handleMenuClose();
                        }
                    }}
                >
                    <Chip
                        label="Reviewed"
                        size="small"
                        sx={{
                            bgcolor: "#7b1fa220",
                            color: "#7b1fa2",
                            fontWeight: 600,
                            mr: 1,
                        }}
                    />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedReportId) {
                            setConfirmModal({
                                open: true,
                                reportId: selectedReportId,
                                newStatus: "approved",
                            });
                            handleMenuClose();
                        }
                    }}
                >
                    <Chip
                        label="Approved"
                        size="small"
                        sx={{
                            bgcolor: "#388e3c20",
                            color: "#388e3c",
                            fontWeight: 600,
                            mr: 1,
                        }}
                    />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedReportId) {
                            setConfirmModal({
                                open: true,
                                reportId: selectedReportId,
                                newStatus: "rejected",
                            });
                            handleMenuClose();
                        }
                    }}
                >
                    <Chip
                        label="Rejected"
                        size="small"
                        sx={{
                            bgcolor: "#d32f2f20",
                            color: "#d32f2f",
                            fontWeight: 600,
                            mr: 1,
                        }}
                    />
                </MenuItem>
            </Menu>

            {/* Add Note Modal */}
            <AddNoteModal
                isOpen={noteModal.isOpen}
                reportId={noteModal.reportId}
                nextStatus={noteModal.nextStatus}
                onClose={() =>
                    setNoteModal({
                        isOpen: false,
                        reportId: null,
                        nextStatus: null,
                    })
                }
                onSuccess={async () => {
                    if (noteModal.reportId && noteModal.nextStatus) {
                        await handleStatusChange(
                            noteModal.reportId,
                            noteModal.nextStatus
                        );
                    }

                    setNoteModal({
                        isOpen: false,
                        reportId: null,
                        nextStatus: null,
                    });

                    await fetchData(); // refresh inbox
                    onDataChanged(); // 🔥 refresh dashboard
                }}
            />

            {/* Confirm Status Change Modal */}
            <Dialog
                open={confirmModal.open}
                onClose={() =>
                    setConfirmModal({
                        open: false,
                        reportId: null,
                        newStatus: null,
                    })
                }
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
                        fontWeight: 700,
                        fontSize: 20,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "#222",
                        pb: 1.5,
                    }}
                >
                    Confirm Status Change
                    <IconButton
                        size="small"
                        onClick={() =>
                            setConfirmModal({
                                open: false,
                                reportId: null,
                                newStatus: null,
                            })
                        }
                        sx={{
                            bgcolor: "#f0f0f0",
                            "&:hover": { bgcolor: "#e0e0e0" },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                {/* Content */}
                <DialogContent sx={{ pt: 1 }}>
                    <Typography sx={{ mb: 1.5, fontSize: 16, color: "#333" }}>
                        You are about to change status to{" "}
                        <strong style={{ textTransform: "capitalize" }}>
                            {confirmModal.newStatus}
                        </strong>
                        .
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: "#666", fontSize: 14 }}
                    >
                        Would you like to add an internal note before
                        continuing?
                    </Typography>
                </DialogContent>

                {/* Actions */}
                <DialogActions sx={{ pt: 2, gap: 1 }}>
                    <Button
                        onClick={() =>
                            setConfirmModal({
                                open: false,
                                reportId: null,
                                newStatus: null,
                            })
                        }
                        sx={{
                            textTransform: "none",
                            color: "#555",
                            "&:hover": { bgcolor: "#f5f5f5" },
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => {
                            const reportId = confirmModal.reportId;
                            const nextStatus = confirmModal.newStatus;

                            setConfirmModal({
                                open: false,
                                reportId: null,
                                newStatus: null,
                            });

                            if (reportId) {
                                setNoteModal({
                                    isOpen: true,
                                    reportId,
                                    nextStatus,
                                });
                            }
                        }}
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            borderColor: "#888",
                            color: "#555",
                            "&:hover": {
                                borderColor: "#555",
                                bgcolor: "#fafafa",
                            },
                        }}
                    >
                        Add Note
                    </Button>

                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (
                                confirmModal.reportId &&
                                confirmModal.newStatus
                            ) {
                                await handleStatusChange(
                                    confirmModal.reportId,
                                    confirmModal.newStatus
                                );
                                await fetchData();
                                onDataChanged();
                            }

                            setConfirmModal({
                                open: false,
                                reportId: null,
                                newStatus: null,
                            });
                        }}
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            bgcolor: "#1976d2",
                            "&:hover": { bgcolor: "#1565c0" },
                            color: "#fff",
                        }}
                    >
                        Change Status
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
