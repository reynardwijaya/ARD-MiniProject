import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(req: NextRequest) {
  try {
    console.log("Starting delete request...");

    //  Ambil query param "id"
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      console.warn("No ID provided");
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    console.log("Deleting report id:", id);

    //  Pre-check if exists
    console.log("Pre-checking report...");
    const { data: report, error: fetchError } = await supabase
      .from("adverse_reports")
      .select("id, status, reporter_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Pre-check fetch error:", fetchError);
      return NextResponse.json(
        { error: `Report fetch failed: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!report) {
      console.warn("Report not found in pre-check");
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    console.log("Report found - Status:", report.status, "Reporter ID:", report.reporter_id);

    //  Fetch attc
    console.log("Fetching attachments...");
    const { data: attachmentsData, error: attachError } = await supabase
      .from("report_attachments")
      .select("file_url")
      .eq("report_id", id);
    if (attachError) {
      console.error("Attachment fetch error:", attachError);
      return NextResponse.json(
        { error: `Failed to fetch attachments: ${attachError.message}` },
        { status: 500 }
      );
    }

    // Hapus file di storage (jika ada)
    if (attachmentsData && attachmentsData.length > 0) {
      console.log("Deleting storage files...");
      const pathsToDelete = attachmentsData
        .map((att) => att.file_url)
        .filter((url): url is string => !!url);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("report-attachments")
          .remove(pathsToDelete);

        if (storageError) {
          console.error("Storage delete error:", storageError);
        }
      }
    }

    //  Hapus record attc di DB
    console.log("Deleting attachment records...");
    const { error: deleteAttachDBError } = await supabase
      .from("report_attachments")
      .delete()
      .eq("report_id", id);

    if (deleteAttachDBError) {
      console.error("Delete attachments DB error:", deleteAttachDBError);
      return NextResponse.json(
        { error: `Failed to delete attachments from DB: ${deleteAttachDBError.message}` },
        { status: 500 }
      );
    }

    //  Hapus report sendiri
    console.log("Deleting report...");
    const { data: deletedReport, error: deleteReportError } = await supabase
      .from("adverse_reports")
      .delete()
      .eq("id", id)
      .select();

    if (deleteReportError) {
      console.error("Delete report error:", deleteReportError);
      return NextResponse.json(
        { error: `Failed to delete report: ${deleteReportError.message}` },
        { status: 500 }
      );
    }

    if (!deletedReport || deletedReport.length === 0) {
      console.warn("No report deleted");
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    console.log("Deleted report successfully:", deletedReport);

    //  Sukses
    return NextResponse.json(
      { message: "Report deleted successfully", deletedReport },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected delete error:", err);
    return NextResponse.json(
      { error: `Unexpected server error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}