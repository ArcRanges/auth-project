import { NextRequest, NextResponse } from "next/server";
import { backendService } from "@/lib/backend/service";

export async function POST(request: NextRequest) {
  const clearAuthCookies = (response: NextResponse) => {
    response.cookies.set({
      name: "access_token",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set({
      name: "refresh_token",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set({
      name: "session_id",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  };

  try {
    const cookieAccessToken = request.cookies.get("access_token")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;
    const accessToken = bearerToken || cookieAccessToken;

    let refreshTokenFromBody: string | undefined;
    try {
      const body = await request.json();
      refreshTokenFromBody = body?.refreshToken ?? body?.refresh_token;
    } catch {}
    const refreshToken =
      refreshTokenFromBody || request.cookies.get("refresh_token")?.value;

    if (!accessToken) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Authorization token required" },
          { status: 401 },
        ),
      );
    }

    const { data, error, status } = await backendService.request(
      "/auth/logout",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: refreshToken
          ? JSON.stringify({ refreshToken })
          : undefined,
      },
    );

    if (error) {
      return clearAuthCookies(NextResponse.json(error, { status }));
    }

    const response =
      status === 204
        ? new NextResponse(null, { status })
        : NextResponse.json(data || { message: "Logged out successfully" }, {
            status,
          });
    return clearAuthCookies(response);
  } catch (error) {
    return clearAuthCookies(
      NextResponse.json({ message: "Internal server error" }, { status: 500 }),
    );
  }
}
