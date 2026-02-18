"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import LayoutUI from "../../lib/layoutUI";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | undefined>();
    const [userRole, setUserRole] = useState<string | undefined>();
    const [role, setRole] = useState<"admin" | "reporter">("admin");

    useEffect(() => {
        let isMounted = true;

        const checkRole = async () => {
            if (!isMounted) return;

            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData.session?.user) {
                router.push("/login");
                return;
            }

            const { data: userData, error } = await supabase
                .from("users")
                .select("role")
                .eq("id", sessionData.session.user.id)
                .single();

            if (error || !userData) {
                router.push("/reporter");
                return;
            }

            if (userData.role !== "admin") {
                router.push("/reporter");
                return;
            }

            setUserEmail(sessionData.session.user.email || "");
            setUserRole(userData.role);
            setRole("admin");

            if (isMounted) setLoading(false);
        };

        checkRole();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <LayoutUI
            pageTitle="Admin Dashboard"
            userEmail={userEmail}
            userRole={userRole}
            role={role}
        >
            {children}
        </LayoutUI>
    );
}
