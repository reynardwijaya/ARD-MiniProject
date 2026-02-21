"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "./DeleteConfirmModal";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
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
    Snackbar,
    Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface Report {
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_date: string;
    created_at: string;
    department_name: string;
    location: string;
    department_id?: string;
    user_name?: string;
    user_id?: string;
}

interface ReportTableProps {
    data: Report[];
    role?: string;
}

function formatDate(dateString: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function ReportTable({ role }: ReportTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [tableData, setTableData] = useState<Report[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(
        null
    );

    const [filterFrom, setFilterFrom] = useState<string>("");
    const [filterTo, setFilterTo] = useState<string>("");
    // const [filterSeverity, setFilterSeverity] = useState<string>("");
    // const [filterStatus, setFilterStatus] = useState<string>("");

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    const onSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // Delete handler (hanya untuk reporter)
    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/delete-report?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errData = await response.json();
                const message = errData?.error ?? "Unknown error";

                // Snackbar error
                setSnackbar({
                    open: true,
                    message: `Delete failed: ${message}`,
                    severity: "error",
                });
                return;
            }

            // Snackbar success
            setSnackbar({
                open: true,
                message: "Report deleted successfully",
                severity: "success",
            });

            setTableData((prev) => {
                const newData = prev.filter((r) => r.id !== id);

                if (newData.length === 0 && pageIndex > 0) {
                    setPageIndex((p) => p - 1);
                }

                return newData;
            });

            setTotalData((prev) => Math.max(prev - 1, 0));
        } catch (error: unknown) {
            const errMsg =
                (error as { message?: string })?.message ?? "Unknown error";
            setSnackbar({
                open: true,
                message: `Delete failed: ${errMsg}`,
                severity: "error",
            });
        }
    };

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    // Columns berdasarkan role
    const columns = useMemo<ColumnDef<Report>[]>(() => {
        const baseColumns: ColumnDef<Report>[] = [
            {
                accessorKey: "title",
                header: "Title",
                cell: ({ row }) => (
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#333",
                        }}
                    >
                        {row.original.title}
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
                    const color =
                        value.toLowerCase() === "high"
                            ? "#d32f2f"
                            : value.toLowerCase() === "medium"
                              ? "#f57c00"
                              : "#388e3c";
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
                accessorKey: "location",
                header: "Location",
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ whiteSpace: "normal" }}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: "incident_date",
                header: "Incident Date",
                cell: (info) => (
                    <Typography variant="body2">
                        {formatDate(info.getValue() as string)}
                    </Typography>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => {
                    const value = getValue() as string;
                    let color = "#388e3c"; // default hijau

                    if (value.toLowerCase() === "draft") color = "#9e9e9e";
                    else if (value.toLowerCase() === "rejected")
                        color = "#d32f2f";
                    else if (value.toLowerCase() === "submitted")
                        color = "#1976d2";
                    else if (value.toLowerCase() === "reviewed")
                        color = "#7b1fa2";
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
        ];

        if (role === "admin") {
            baseColumns.splice(1, 0, {
                accessorKey: "user_name",
                header: "Reporter Name",
                cell: ({ getValue }) => (
                    <Typography variant="body2">
                        {getValue() as string}
                    </Typography>
                ),
            });
        }

        if (role === "reporter") {
            baseColumns.push({
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const status = row.original.status.toLowerCase();
                    if (!["draft", "rejected"].includes(status)) {
                        let text = "Waiting for approval";
                        if (status === "approved") {
                            text = "Approved";
                        } else if (status === "reviewed") {
                            text = "Under Review";
                        } else if (status === "submitted") {
                            text = "Waiting review";
                        }

                        return (
                            <Tooltip title="Cannot edit approved/reviewed report">
                                <Typography
                                    variant="body2"
                                    sx={{ color: "#9e9e9e" }}
                                >
                                    {text}
                                </Typography>
                            </Tooltip>
                        );
                    }
                    return (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit">
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: "#1976d2",
                                        "&:hover": {
                                            bgcolor: "#1976d220",
                                            transform: "scale(1.1)",
                                        },
                                        transition: "all 0.2s ease",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                            `/reporter/reports/${row.original.id}/edit`
                                        );
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: "#d32f2f",
                                        "&:hover": {
                                            bgcolor: "#d32f2f20",
                                            transform: "scale(1.1)",
                                        },
                                        transition: "all 0.2s ease",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation(); // agar row click tidak ikut ter-trigger
                                        setSelectedReportId(row.original.id); // simpan id report
                                        setDeleteModalOpen(true); // tampilkan modal
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                },
            });
        }

        return baseColumns;
    }, [role, router]);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalData, setTotalData] = useState(0);
    const filteredByRoleData = useMemo(() => {
        if (!tableData) return [];

        const filtered = tableData;

        filtered.sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        );

        return filtered;
    }, [tableData]);
    const table = useReactTable({
        data: filteredByRoleData, // pakai hasil filter + sort
        columns,
        pageCount: totalData > 0 ? Math.ceil(totalData / pageSize) : 0,
        state: {
            pagination: {
                pageIndex,
                pageSize,
            },
        },
        manualPagination: true,
        onPaginationChange: (updater) => {
            const newPagination =
                typeof updater === "function"
                    ? updater({ pageIndex, pageSize })
                    : updater;

            setPageIndex(newPagination.pageIndex);
            setPageSize(newPagination.pageSize);
        },
        getCoreRowModel: getCoreRowModel(),
    });

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(
                `/api/reports?search=${debouncedSearch}&page=${pageIndex + 1}&limit=${pageSize}&role=${role}&from=${filterFrom}&to=${filterTo}`
            );

            if (!res.ok) {
                console.error("Failed to fetch reports");
                return;
            }

            const result = await res.json();
            setTableData(result.data ?? []);
            setTotalData(result.total ?? 0);
        };

        fetchData();
    }, [debouncedSearch, pageIndex, pageSize, role, filterFrom, filterTo]);

    return (
        <Fade in={true} timeout={600}>
            <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 600, color: "#333", mb: 2 }}
                    >
                        Reports
                    </Typography>
                    <TextField
                        placeholder="Search reports by title..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageIndex(0);
                        }}
                        variant="outlined"
                        size="small"
                        sx={{
                            width: { xs: "100%", md: 300 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 3,
                                bgcolor: "white",
                                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.1)",
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

                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mt: 1,
                        mb: 3,
                        alignItems: "center",
                    }}
                >
                    {/* Date From */}
                    <TextField
                        label="From"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "#ffffff",
                                "& fieldset": { borderColor: "#cbd5e1" },
                                "&:hover fieldset": { borderColor: "#3b82f6" },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#3b82f6",
                                    borderWidth: 2,
                                },
                            },
                            "& .MuiInputLabel-root": { color: "#64748b" },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: "#3b82f6",
                            },
                        }}
                    />

                    {/* To Date */}
                    <TextField
                        label="To"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "#ffffff",
                                "& fieldset": { borderColor: "#cbd5e1" },
                                "&:hover fieldset": { borderColor: "#3b82f6" },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#3b82f6",
                                    borderWidth: 2,
                                },
                            },
                            "& .MuiInputLabel-root": { color: "#64748b" },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: "#3b82f6",
                            },
                        }}
                    />

                    {/* Reset Filter */}
                    <Tooltip title="Reset Filter">
                        <IconButton
                            onClick={() => {
                                setFilterFrom("");
                                setFilterTo("");
                                setPageIndex(0);
                            }}
                            sx={{
                                color: "#1f6fdf",
                                backgroundColor: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: 2,
                                padding: "8px",
                                transition: "all 0.2s",
                                "&:hover": {
                                    backgroundColor: "#eff6ff",
                                    color: "#2563eb",
                                    transform: "scale(1.05)",
                                    borderColor: "#3b82f6",
                                },
                            }}
                        >
                            <ClearIcon />
                        </IconButton>
                    </Tooltip>
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
                                background:
                                    "linear-gradient(135deg, #ffffff 0%, #ffffff 100%)",
                            }}
                        >
                            <TableRow>
                                {table.getHeaderGroups().map((headerGroup) =>
                                    headerGroup.headers.map((header) => (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                color: "black",
                                                fontWeight: 600,
                                                fontSize: "0.875rem",
                                                borderBottom: "none",
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableCell>
                                    ))
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
                                                transform: "translateY(-1px)",
                                                boxShadow:
                                                    "0 2px 8px rgba(25, 118, 210, 0.1)",
                                            },
                                            transition: "all 0.2s ease",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            router.push(
                                                role === "admin"
                                                    ? `/admin/reports/${row.original.id}`
                                                    : `/reporter/reports/${row.original.id}`
                                            )
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                sx={{
                                                    borderBottom:
                                                        "1px solid #e0e0e0",
                                                    py: 2,
                                                }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
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
                    count={totalData}
                    page={table.getState().pagination.pageIndex}
                    onPageChange={(_, page) => table.setPageIndex(page)}
                    rowsPerPage={table.getState().pagination.pageSize}
                    onRowsPerPageChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        setPageIndex(0); // reset ke page 0
                        table.setPageSize(newSize);
                    }}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    sx={{
                        mt: 2,
                        "& .MuiTablePagination-toolbar": {
                            justifyContent: "space-between",
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                            {
                                color: "#666",
                            },
                        "& .MuiIconButton-root": {
                            color: "#1976d2",
                            "&:hover": { bgcolor: "#1976d220" },
                        },
                    }}
                />

                <DeleteConfirmModal
                    isOpen={deleteModalOpen}
                    reportId={selectedReportId}
                    onClose={() => setDeleteModalOpen(false)}
                    onDelete={async (id: string) => {
                        // Panggil handleDelete asli
                        await handleDelete(id);
                        setDeleteModalOpen(false);
                    }}
                />

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={onSnackbarClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                    <Alert
                        severity={snackbar.severity}
                        variant="filled"
                        onClose={onSnackbarClose}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Fade>
    );
}
