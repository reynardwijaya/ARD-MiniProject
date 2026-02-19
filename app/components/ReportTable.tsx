"use client";

import { useMemo, useState, useEffect } from "react";
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import { supabase } from "../lib/supabase";

interface Report {
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_date: string;
    department_name: string;
    location: string;
    department_id?: string;
    user_name?: string; // Ubah dari user_email ke user_name untuk admin (nama reporter)
    user_id?: string; // Optional, hanya untuk admin
}

interface ReportTableProps {
    data: Report[];
    role?: string; // Prop role untuk kondisikan admin/reporter
}

export default function ReportTable({ data, role }: ReportTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [tableData, setTableData] = useState<Report[]>(data);

    // Filtered data by search
    const filteredData = useMemo(() => {
        if (!search) return tableData;
        return tableData.filter((r) =>
            r.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, tableData]);

    useEffect(() => {
        const fetchDepartments = async () => {
            const updatedData = await Promise.all(
                tableData.map(async (report) => {
                    if (
                        report.department_id &&
                        report.department_name === "-"
                    ) {
                        try {
                            const { data: dept, error } = await supabase
                                .from("department")
                                .select("name")
                                .eq("id", report.department_id)
                                .single();
                            if (error) {
                                return report;
                            }
                            return {
                                ...report,
                                department_name: dept?.name ?? "-",
                            };
                        } catch (err) {
                            return report;
                        }
                    }
                    return report;
                })
            );
            setTableData(updatedData);
        };
        if (tableData.length > 0) {
            fetchDepartments();
        }
    }, [data]);

    // Fetch nama reporter untuk admin (hanya jika role admin dan ada user_id)
    useEffect(() => {
        if (role === "admin") {
            const fetchReporterNames = async () => {
                const updatedData = await Promise.all(
                    tableData.map(async (report) => {
                        if (report.user_name) return report; // Sudah ada, skip
                        if (!report.user_id) {
                            console.log(`Report ${report.id}: no user_id`);
                            return report; // Tidak ada user_id, skip
                        }
                        console.log(
                            `Fetching name for user_id: ${report.user_id}`
                        );
                        const { data: userData, error } = await supabase
                            .from("users")
                            .select("name")
                            .eq("id", report.user_id)
                            .single();
                        if (error) {
                            console.log(
                                `Error fetching name for user_id ${report.user_id}:`,
                                error
                            );
                            return { ...report, user_name: "-" };
                        }
                        console.log(
                            `Name for user_id ${report.user_id}: ${userData?.name}`
                        );
                        return {
                            ...report,
                            user_name: userData?.name ?? "-",
                        };
                    })
                );
                setTableData(updatedData);
            };
            if (tableData.length > 0) {
                fetchReporterNames();
            }
        }
    }, [data, role]);

    // Delete handler (hanya untuk reporter)
    const handleDelete = async (id: string) => {
        const confirmDelete = confirm("Are you sure you want to delete?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/delete-report?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errData = await response.json();
                const message = errData?.error ?? "Unknown error";
                alert(`Delete failed: ${message}`);
                return;
            }

            alert("Report deleted successfully");
            setTableData((prev) => prev.filter((r) => r.id !== id));
        } catch (error: unknown) {
            const errMsg =
                (error as { message?: string })?.message ?? "Unknown error";
            alert(`Delete failed: ${errMsg}`);
        }
    };

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
                        {new Date(
                            info.getValue() as string
                        ).toLocaleDateString()}
                    </Typography>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => {
                    const value = getValue() as string;
                    const color =
                        value.toLowerCase() === "draft"
                            ? "#9e9e9e"
                            : value.toLowerCase() === "rejected"
                              ? "#d32f2f"
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
        ];

        // Tambah kolom nama reporter untuk admin (setelah title)
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

        // Tambah kolom actions untuk reporter (setelah status)
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
                                        e.stopPropagation();
                                        handleDelete(row.original.id);
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

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    });

    return (
        <Fade in={true} timeout={600}>
            <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 600, color: "#333", mb: 2 }}
                    >
                        Reports
                    </Typography>
                    <TextField
                        placeholder="Search reports by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                            {table.getRowModel().rows.map((row, index) => (
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filteredData.length}
                    page={table.getState().pagination.pageIndex}
                    onPageChange={(_, page) => table.setPageIndex(page)}
                    rowsPerPage={table.getState().pagination.pageSize}
                    onRowsPerPageChange={(e) =>
                        table.setPageSize(Number(e.target.value))
                    }
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
            </Box>
        </Fade>
    );
}
