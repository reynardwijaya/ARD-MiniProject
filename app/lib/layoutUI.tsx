"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

interface LayoutUIProps {
    children: ReactNode;
    pageTitle: string;
    userEmail?: string;
    userRole?: string;
    role: "admin" | "reporter"; // Prop baru untuk kondisi
}

export default function LayoutUI({
    children,
    pageTitle,
    userEmail,
    userRole,
    role, // Tambah ini
}: LayoutUIProps) {
    const pathname = usePathname();

    // Kondisi untuk judul sidebar
    const panelTitle = role === "admin" ? "Admin Panel" : "Reporter Panel";

    // Kondisi untuk link-link
    const navLinks =
        role === "admin"
            ? [
                  { href: "/admin", label: "Dashboard" },
                  { href: "/admin/reports", label: "Reports" },
              ]
            : [
                  { href: "/reporter", label: "Dashboard" },
                  { href: "/reporter/reports/new", label: "Create Report" },
              ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className="w-64 shadow-lg flex flex-col justify-between rounded-r-3xl"
                style={{
                    background:
                        "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                }}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-8 text-white">
                        {panelTitle} {/* Kondisi judul */}
                    </h2>
                    <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                                    pathname === link.href ||
                                    (link.href === "/admin/reports" &&
                                        pathname.includes("/admin/reports")) ||
                                    (link.href === "/reporter/reports/new" &&
                                        pathname.includes("/reports/new"))
                                        ? "text-white"
                                        : "text-blue-100 hover:bg-blue-500 hover:text-white"
                                }`}
                                style={
                                    pathname === link.href ||
                                    (link.href === "/admin/reports" &&
                                        pathname.includes("/admin/reports")) ||
                                    (link.href === "/reporter/reports/new" &&
                                        pathname.includes("/reports/new"))
                                        ? {
                                              backgroundColor: "#1565c0",
                                              fontWeight: 500,
                                              boxShadow:
                                                  "0 2px 8px rgba(25, 118, 210, 0.3)",
                                          }
                                        : {}
                                }
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content - Tetap sama */}
            <main className="flex-1 p-8 bg-white">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        {pageTitle}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                            <span className="text-sm font-medium text-blue-800">
                                {userEmail ? (
                                    <>
                                        {userEmail} ({userRole || "..."})
                                    </>
                                ) : (
                                    <span className="animate-pulse text-blue-400">
                                        - ••
                                    </span>
                                )}
                            </span>
                        </div>
                        <button
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = "/login";
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
