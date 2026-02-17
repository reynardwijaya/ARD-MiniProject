"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
    TextField,
    Button,
    Paper,
    Typography,
    Box,
    Alert,
} from "@mui/material";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        //  Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            setError("Login failed: Invalid email or password");
            setLoading(false);
            return;
        }

        //  Ambil role dari table
        const { data: userData, error: roleError } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (roleError || !userData) {
            setError("Role not found");
            setLoading(false);
            return;
        }

        if (userData.role === "admin") {
            router.push("/admin");
        } else {
            router.push("/reporter");
        }

        setLoading(false);
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <Image
                src="/bg.jpg"
                alt="Background"
                fill
                style={{ objectFit: "cover", zIndex: -1 }}
            />

            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: "rgba(25, 118, 210, 0.7)",
                    zIndex: 0,
                }}
            />

            <Box
                sx={{
                    maxWidth: 1200,
                    width: "100%",
                    minHeight: "80vh",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Left Side */}
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        p: 4,
                    }}
                >
                    <Box sx={{ color: "white", textAlign: "left" }}>
                        <Typography
                            variant="h1"
                            component="h1"
                            sx={{
                                fontWeight: 900,
                                mb: 2,
                                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                                fontSize: "5rem",
                                lineHeight: 1,
                            }}
                        >
                            ARD
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                mb: 4,
                                opacity: 0.9,
                                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                fontWeight: 700,
                                fontSize: "2.5rem",
                            }}
                        >
                            Adverse Report Dashboard
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                opacity: 0.8,
                                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                                fontWeight: 600,
                                lineHeight: 1.6,
                                fontSize: "1.5rem",
                            }}
                        >
                            A web-based system for reporting and managing
                            adverse events.
                        </Typography>
                    </Box>
                </Box>

                {/* Login Form */}
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 4,
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            width: "100%",
                            maxWidth: 400,
                            p: 6,
                            borderRadius: 3,
                            bgcolor: "white",
                            border: "1px solid #e0e0e0",
                        }}
                    >
                        <Box sx={{ mb: 4, textAlign: "center" }}>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{ fontWeight: 600, color: "#333" }}
                            >
                                Sign In to ARD
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#666", mt: 1 }}
                            >
                                Access your account
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Box
                            component="form"
                            onSubmit={handleLogin}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                            }}
                        >
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                                required
                            />

                            <TextField
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                                required
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                    px: 3,
                                    py: 1.5,
                                    bgcolor: "#1976d2",
                                    "&:hover": { bgcolor: "#1565c0" },
                                    "&:disabled": { bgcolor: "#ccc" },
                                    fontWeight: 500,
                                    boxShadow:
                                        "0 2px 8px rgba(25, 118, 210, 0.3)",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
