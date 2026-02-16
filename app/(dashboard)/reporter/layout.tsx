"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ReporterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            // Ambil session dari Supabase client
            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData.session?.user) {
                // belum login → redirect login
                router.push("/login");
                return;
            }

            // Ambil role dari table users
            const { data: userData } = await supabase
                .from("users")
                .select("role")
                .eq("id", sessionData.session.user.id)
                .single();

            if (!userData || userData.role !== "reporter") {
                // bukan reporter → redirect ke admin
                router.push("/admin");
                return;
            }

            // user = reporter → render children
            setLoading(false);
        };

        checkRole();
    }, [router]);

    if (loading) return null;

    return <>{children}</>;
}
