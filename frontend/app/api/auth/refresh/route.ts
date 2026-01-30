import { NextRequest, NextResponse } from "next/server";
import { backendService } from "@/lib/backend/service";

type BackendUser = {
  id: string;
  email: string;
  name: string;
};

type BackendAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: BackendUser;
};

export async function POST(request: NextRequest) {
  try {
    const cookieRefreshToken = request.cookies.get("refresh_token")?.value;
    let refreshTokenFromBody: string | undefined;
    try {
      const body = await request.json();
      refreshTokenFromBody = body?.refreshToken ?? body?.refresh_token;
    } catch {}
    const refreshToken = refreshTokenFromBody || cookieRefreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token is required" },
        { status: 400 },
      );
    }

    const { data, error, status } = await backendService.request<BackendAuthResponse>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
    );

    if (error) {
      return NextResponse.json(error, { status });
    }

    const response = NextResponse.json({ user: data?.user }, { status });

    if (data?.access_token) {
      response.cookies.set({
        name: "access_token",
        value: data.access_token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    if (data?.refresh_token) {
      response.cookies.set({
        name: "refresh_token",
        value: data.refresh_token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
