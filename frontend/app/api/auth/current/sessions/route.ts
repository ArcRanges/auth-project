import { NextRequest, NextResponse } from "next/server";
import { backendService } from "@/lib/backend/service";
import { decodeJwtPayload } from "@/lib/jwt";

type BackendSession = {
  sessionId: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
};

const getAccessToken = (request: NextRequest): string | null => {
  const cookieAccessToken = request.cookies.get("access_token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
  return bearerToken || cookieAccessToken || null;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 },
      );
    }

    const { data, error, status } = await backendService.request<BackendSession[]>(
      "/auth/sessions",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (error) {
      return NextResponse.json(error, { status });
    }

    const cookieSessionId = request.cookies.get("session_id")?.value;
    const decoded = accessToken
      ? decodeJwtPayload<{ sid?: string }>(accessToken)
      : null;
    const tokenSessionId =
      typeof decoded?.sid === "string" && decoded.sid.length > 0
        ? decoded.sid
        : null;

    const currentSessionId = cookieSessionId ?? tokenSessionId;

    const response = NextResponse.json(
      { current_session_id: currentSessionId ?? null, sessions: data ?? [] },
      { status },
    );

    if (!cookieSessionId && tokenSessionId) {
      response.cookies.set({
        name: "session_id",
        value: tokenSessionId,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
