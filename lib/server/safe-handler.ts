import { NextResponse } from "next/server";

export function safeHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error("❌ API ERROR:", error);

      return NextResponse.json(
        {
          error: "Internal Server Error",
          message:
            process.env.NODE_ENV === "development"
              ? error?.message
              : undefined,
        },
        { status: 500 }
      );
    }
  };
}