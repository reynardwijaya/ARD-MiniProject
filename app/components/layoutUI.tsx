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
    role: "admin" | "reporter";
}

export default function LayoutUI({
    children,
    pageTitle,
    userEmail,
    userRole,
    role,
}: LayoutUIProps) {
    const pathname = usePathname();

    const panelTitle = role === "admin" ? "Admin Panel" : "Reporter Panel";

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
            {/* Sidebar - Fixed, rounded, tidak scroll */}
            <aside
                className="w-64 h-screen fixed top-0 left-0 flex flex-col justify-between"
                style={{
                    background:
                        "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                    borderTopRightRadius: "24px",
                    borderBottomRightRadius: "24px",
                    boxShadow: "4px 0 20px rgba(0, 0, 0, 0.1)",
                    zIndex: 50, // Tingkatkan z-index
                }}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-8 text-white">
                        {panelTitle}
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

            {/* Wrapper untuk Top Bar + Content */}
            <div className="flex-1 ml-64 min-h-screen flex flex-col">
                {/* Top Bar - Sticky */}
                <header className="sticky top-0 z-10 bg-white px-8 py-5 flex justify-between items-center border-b border-gray-100 shadow-sm">
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
                </header>

                {/* Content - Scrollable */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="mt-2">{children}</div>
                </main>
            </div>
        </div>
    );
}
