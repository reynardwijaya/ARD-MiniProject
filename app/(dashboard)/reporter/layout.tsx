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
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session?.user) {
                if (!checked) router.push("/login");
                return;
                //                 supabase.auth.getSession() → cek apakah ada user yang sedang login.

                // Jika tidak ada session, redirect ke /login.
            }

            const { data: userData } = await supabase
                .from("users")
                .select("role")
                .eq("id", sessionData.session.user.id)
                .single();

            if (!userData || userData.role !== "reporter") {
                if (!checked) router.push("/admin");
                return;
            }

            setChecked(true);
            setLoading(false);
        };
        checkRole();
    }, [router, checked]);

    if (loading) return null;
    return <>{children}</>;
}
