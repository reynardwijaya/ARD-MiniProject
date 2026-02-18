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

import { supabase } from "../../../lib/supabase";

interface Report {
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_date: string;
    department_name: string;
    location: string;
    department_id?: string;
}

interface ReportTableProps {
    // Tipe props untuk komponen ReportTable, yang menerima data berupa array of Report.
    data: Report[];
}

export default function ReportTable({ data }: ReportTableProps) {
    // Komponen utama untuk menampilkan tabel laporan. Menerima props data yang merupakan array of Report.
    const router = useRouter();
    const [search, setSearch] = useState(""); // State untuk menyimpan nilai pencarian dari input search. Awalnya kosong karena belum ada pencarian.
    const [tableData, setTableData] = useState<Report[]>(data);

    // Filtered data by search
    const filteredData = useMemo(() => {
        // useMemo → cache hasil filter supaya tidak dihitung ulang setiap render kecuali search atau tableData berubah.
        if (!search) return tableData;
        return tableData.filter((r) =>
            r.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, tableData]); // search → untuk memicu filter ulang saat nilai pencarian berubah. tableData → untuk memicu filter ulang saat data tabel berubah (misal setelah fetch department name).

    useEffect(() => {
        const fetchDepartments = async () => {
            const updatedData = await Promise.all(
                tableData.map(async (report) => {
                    // Kita map setiap report untuk cek apakah department_name-nya masih "-" dan ada department_id. Jika iya, kita fetch nama departemen dari tabel department berdasarkan department_id.
                    if (
                        report.department_id &&
                        report.department_name === "-"
                    ) {
                        try {
                            const { data: dept, error } = await supabase // Mengambil nama department dari tabel department.
                                .from("department") // Nama tabel sesuai schema
                                .select("name")
                                .eq("id", report.department_id)
                                .single();
                            if (error) {
                                return report;
                            }
                            return {
                                ...report, // spread operator -> salin semua field dari report asli.
                                department_name: dept?.name ?? "-",
                            };
                        } catch (err) {
                            return report;
                        }
                    }
                    return report;
                })
            );
            setTableData(updatedData); // Setelah semua report diproses, kita update state tableData dengan data yang sudah dilengkapi nama departemennya.
        };
        if (tableData.length > 0) {
            // Hanya jalankan fetchDepartments() kalau ada report di tableData.
            fetchDepartments();
        }
    }, [data]);

    // Delete handler
    const handleDelete = async (id: string) => {
        const confirmDelete = confirm("Are you sure you want to delete?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/delete-report?id=${id}`, {
                // Panggil API route untuk delete report berdasarkan ID.
                method: "DELETE",
            });

            if (!response.ok) {
                const errData = await response.json();
                const message = errData?.error ?? "Unknown error";
                alert(`Delete failed: ${message}`);
                return;
            }

            alert("Report deleted successfully");
            // (prev) -> Ini callback function yang menerima nilai state sebelumnya (prev) sebagai input.
            // filter -> membuat array baru hanya dengan item yang memenuhi kondisi.
            // Kondisi: r.id !== id → artinya ambil semua report kecuali yang id-nya sama dengan id yang dihapus.
            setTableData((prev) => prev.filter((r) => r.id !== id)); // Setelah berhasil delete, kita update state tableData dengan menghapus report yang sudah di-delete supaya UI langsung update tanpa perlu refresh.
        } catch (error: unknown) {
            const errMsg =
                (error as { message?: string })?.message ?? "Unknown error";
            alert(`Delete failed: ${errMsg}`);
        }
    };

    // Columns
    const columns = useMemo<ColumnDef<Report>[]>( // useMemo → cache definisi kolom supaya tidak dibuat ulang setiap render kecuali router berubah (karena kita pakai router di action).
        () => [
            {
                accessorKey: "title", // accessorKey → akses data report.title untuk kolom ini.
                header: "Title",
                cell: (
                    { row } // Custom cell render untuk title supaya bisa styling lebih menarik.
                ) => (
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
            {
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
                                        handleDelete(row.original.id); // Panggil handler delete saat tombol delete diklik.
                                        //  Kita stopPropagation supaya klik tombol tidak trigger onClick row yang navigasi ke detail.
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                },
            },
        ],
        [router]
    );

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
                                                header.column.columnDef.header, // Render header cell (bisa string atau fungsi render).
                                                header.getContext()
                                            )}
                                        </TableCell>
                                    ))
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {table.getRowModel().rows.map(
                                (
                                    row,
                                    index // table.getRowModel().rows → dapatkan baris yang sudah diproses (filter, sort, paginate) untuk ditampilkan di tabel. Kita map setiap row untuk render TableRow.
                                ) => (
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
                                                `/reporter/reports/${row.original.id}`
                                            )
                                        }
                                    >
                                        {row.getVisibleCells().map(
                                            (
                                                cell // row.getVisibleCells() → dapatkan sel yang terlihat (sesuai kolom yang didefinisikan) untuk setiap baris. Kita map setiap cell untuk render TableCell.
                                            ) => (
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{
                                                        borderBottom:
                                                            "1px solid #e0e0e0",
                                                        py: 2,
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            )
                                        )}
                                    </TableRow>
                                )
                            )}
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
