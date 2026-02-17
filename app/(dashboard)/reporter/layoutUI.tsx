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
}

export default function LayoutUI({
    children,
    pageTitle,
    userEmail,
    userRole,
}: LayoutUIProps) {
    const pathname = usePathname();

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
                        Reporter Panel
                    </h2>
                    <nav className="flex flex-col gap-2">
                        <Link
                            href="/reporter"
                            className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                                pathname === "/reporter"
                                    ? "text-white"
                                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                            }`}
                            style={
                                pathname === "/reporter"
                                    ? {
                                          backgroundColor: "#1565c0",
                                          fontWeight: 500,
                                          boxShadow:
                                              "0 2px 8px rgba(25, 118, 210, 0.3)",
                                      }
                                    : {}
                            }
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/reporter/reports/new"
                            className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                                pathname.includes("/reports/new")
                                    ? "text-white"
                                    : "text-blue-100 hover:bg-blue-500 hover:text-white"
                            }`}
                            style={
                                pathname.includes("/reports/new")
                                    ? {
                                          backgroundColor: "#1565c0",
                                          fontWeight: 500,
                                          boxShadow:
                                              "0 2px 8px rgba(25, 118, 210, 0.3)",
                                      }
                                    : {}
                            }
                        >
                            Create Report
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
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
