import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/* =========================
   TYPES
========================= */

type ReportRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  incident_date: string;
  location: string;
  department: { name: string }[];  
  user: { name: string }[];       
};

/* =========================
   GET (Search + Pagination)
========================= */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") ?? "";
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

 let query = supabase
  .from("adverse_reports")
  .select(
    `
      id,
      title,
      severity,
      status,
      incident_date,
      location,
      created_at,
      department!adverse_reports_department_id_fkey ( name ),
      users!adverse_reports_reporter_id_fkey ( name )
    `,
    { count: "exact" }
  )
  // .in("status", ["approved", "rejected"])
  .order("created_at", { ascending: false });

if (search) {
  query = query.ilike("title", `%${search}%`);
}

type ReportWithRelations = {
  id: string;
  title: string;
  severity: string;
  status: string;
  incident_date: string;
  location: string;
  created_at: string;    
  department: { name: string } | null;
  users: { name: string } | null;
};

const { data, count, error } = await query
  .range(from, to)
  .returns<ReportWithRelations[]>();

if (error) {
  console.error("SUPABASE ERROR:", error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}

const formatted = (data ?? []).map((r) => ({
  id: r.id,
  title: r.title,
  severity: r.severity,
  status: r.status,
  incident_date: r.incident_date,
  location: r.location,
  created_at: r.created_at, // tambahkan ini
  department_name: r.department?.name ?? "-",
  user_name: r.users?.name ?? "-",
}));

    return NextResponse.json(
      {
        data: formatted,
        total: count ?? 0,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
========================= */

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    /* === Pre-check report === */
    const { data: report, error: fetchError } = await supabase
      .from("adverse_reports")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    /* === Get attachments === */
    const { data: attachments } = await supabase
      .from("report_attachments")
      .select("file_url")
      .eq("report_id", id);

    /* === Delete storage files === */
    if (attachments && attachments.length > 0) {
      const paths = attachments
        .map((a) => a.file_url)
        .filter((url): url is string => !!url);

      if (paths.length > 0) {
        await supabase.storage
          .from("report-attachments")
          .remove(paths);
      }
    }

    /* === Delete attachment records === */
    await supabase
      .from("report_attachments")
      .delete()
      .eq("report_id", id);

    /* === Delete report === */
    const { error: deleteError } = await supabase
      .from("adverse_reports")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Report deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}