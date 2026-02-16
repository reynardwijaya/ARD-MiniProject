"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData.session?.user) {
                router.push("/login");
                return;
            }

            const { data: userData } = await supabase
                .from("users")
                .select("role")
                .eq("id", sessionData.session.user.id)
                .single();

            if (!userData || userData.role !== "admin") {
                router.push("/reporter");
                return;
            }

            setLoading(false);
        };

        checkRole();
    }, [router]);

    if (loading) return null;

    return <>{children}</>;
}
