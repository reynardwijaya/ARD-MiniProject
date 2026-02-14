"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      // Ambil user dari session
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login"); // belum login → redirect
        return;
      }

      // Ambil role via RPC (lebih aman & konsisten)
      const { data: rpcRole, error: roleError } = await supabase.rpc("get_user_role");

      if (roleError || !rpcRole) {
        alert("Gagal mengambil role user");
        router.push("/login"); // error → redirect login
        return;
      }

      // role dari RPC biasanya string
      const userRole = typeof rpcRole === "string" ? rpcRole : rpcRole?.role;

      if (userRole !== "admin") {
        router.push("/dashboard"); // bukan admin → redirect reporter
        return;
      }

      // user = admin, tampilkan dashboard
      setEmail(user.email ?? "");
      setRole(userRole);
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p>Email: {email}</p>
      <p>Role: {role}</p>

      {/* */}
    </div>
  );
}
