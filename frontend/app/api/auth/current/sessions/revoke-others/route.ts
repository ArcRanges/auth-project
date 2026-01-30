import { NextRequest, NextResponse } from "next/server";
import { backendService } from "@/lib/backend/service";

const getAccessToken = (request: NextRequest): string | null => {
  const cookieAccessToken = request.cookies.get("access_token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
  return bearerToken || cookieAccessToken || null;
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 },
      );
    }

    const { error, status } = await backendService.request(
      "/auth/sessions/revoke-others",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (error) {
      return NextResponse.json(error, { status });
    }

    return new NextResponse(null, { status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
