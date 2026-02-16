"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function AdminDashboardPage() {
    const [email, setEmail] = useState("");

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                setEmail(user.email ?? "");
            }
        };

        getUser();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <p>Email: {email}</p>
        </div>
    );
}
