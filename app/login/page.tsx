"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1️⃣ Sign in user
        const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({ email, password });

        if (authError || !authData.user) {
            alert(authError?.message || "Login gagal");
            setLoading(false);
            return;
        }

        // 2️⃣ Ambil role via RPC
        const { data: role, error: roleError } = await supabase.rpc("get_user_role");

        if (roleError || !role) {
            alert("Gagal mengambil role user");
            setLoading(false);
            return;
        }

        // 3️⃣ Redirect sesuai role
        if (role === "admin") {
            router.push("/admin/dashboard");
        } else {
            router.push("/dashboard");
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
