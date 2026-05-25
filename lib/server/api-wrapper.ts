import { NextResponse } from "next/server";

export function apiWrapper(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error("🔥 API ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
        },
        { status: 500 }
      );
    }
  };
}