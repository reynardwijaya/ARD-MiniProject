import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("adverse_reports")
    .select("*", { count: "exact" })
    .in("status", ["submitted", "reviewed"])
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("title", `%${search}%`);

  const { data, count, error } = await query.range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count });
}