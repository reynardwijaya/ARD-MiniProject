"use client";

import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

type Variant = "neutral" | "blue" | "purple" | "red";

interface SummaryCardProps {
    title: string;
    value: number;
    subtitle: string;
    extraText?: string;
    icon?: React.ReactNode;
    trend?: string;
    isPositiveTrend?: boolean;
    variant?: Variant;
}

const variantStyles: Record<
    Variant,
    {
        valueColor: string;
        iconBg: string;
    }
> = {
    neutral: {
        valueColor: "#1d1d1f",
        iconBg: "#f5f5f7",
    },
    blue: {
        valueColor: "#1565c0",
        iconBg: "#e3f2fd",
    },
    purple: {
        valueColor: "#6a1b9a",
        iconBg: "#f3e5f5",
    },
    red: {
        valueColor: "#d32f2f",
        iconBg: "#fdecea",
    },
};

export default function SummaryCard({
    title,
    value,
    subtitle,
    extraText,
    icon,
    trend,
    isPositiveTrend = true,
    variant = "neutral",
}: SummaryCardProps) {
    const styles = variantStyles[variant];
    const formattedValue = new Intl.NumberFormat().format(value);

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                backgroundColor: "#ffffff",
                boxShadow:
                    "0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)",
                transition: "all 0.25s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                },
            }}
        >
            <CardContent
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    p: 3,
                }}
            >
                <Box>
                    {/* Title */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#3a3a3c",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                        }}
                    >
                        {title}
                    </Typography>

                    {/* Value */}
                    <Typography
                        variant="h4"
                        sx={{
                            mt: 1,
                            fontWeight: 600,
                            letterSpacing: "-0.02em",
                            color: styles.valueColor,
                        }}
                    >
                        {formattedValue}
                    </Typography>

                    {/* Trend */}
                    {trend && (
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                fontWeight: 500,
                                color: isPositiveTrend ? "#2e7d32" : "#d32f2f",
                            }}
                        >
                            {isPositiveTrend ? "↑" : "↓"} {trend}
                        </Typography>
                    )}

                    {/* Subtitle */}
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1.5,
                            color: "#6e6e73",
                        }}
                    >
                        {subtitle}
                    </Typography>

                    {/* Extra badge */}
                    {extraText && (
                        <Box
                            sx={{
                                mt: 1.2,
                                display: "inline-block",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                backgroundColor: "#f2f2f2",
                                fontSize: "0.75rem",
                                color: "#555",
                            }}
                        >
                            {extraText}
                        </Box>
                    )}
                </Box>

                {/* Icon */}
                {icon && (
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 3,
                            backgroundColor: styles.iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6e6e73",
                        }}
                    >
                        {icon}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
