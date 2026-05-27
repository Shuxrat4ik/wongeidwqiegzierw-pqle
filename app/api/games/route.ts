import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/server/supabase-server";
import { apiError, handleServerError } from "@/lib/server/error-handler";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    const page = Math.max(1, Number(params.get("page") ?? 1));
    const pageSize = Math.min(60, Math.max(1, Number(params.get("pageSize") ?? 24)));

    const search = params.get("search")?.trim() || "";
    const category = params.get("category")?.trim() || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createAnonServerClient();

    let query = supabase
      .from("games")
      .select("*", { count: "exact" })
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search.length > 0) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (category.length > 0) {
      query = query.contains("genre", [category]);
    }

    const { data, error, count } = await query;

    if (error) {
      return apiError(error.message, 400);
    }

    return NextResponse.json({
      success: true,
      games: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    return handleServerError("api/games", err);
  }
}