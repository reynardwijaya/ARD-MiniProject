"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1️⃣ Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            alert("Login gagal");
            setLoading(false);
            return;
        }

        // 2️⃣ Ambil role langsung dari table
        const { data: userData, error: roleError } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (roleError || !userData) {
            alert("Role tidak ditemukan");
            setLoading(false);
            return;
        }

        // 3️⃣ Redirect berdasarkan role
        if (userData.role === "admin") {
            router.push("/admin");
        } else {
            router.push("/reporter");
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
                <h1 className="text-2xl font-bold">Login</h1>

                <input
                    type="email"
                    placeholder="Email"
                    className="border p-2 rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="bg-black text-white p-2 rounded"
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Login"}
                </button>
            </form>
        </div>
    );
}
