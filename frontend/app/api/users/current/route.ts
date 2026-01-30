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
  return response;
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

    const { data, error, status } = await backendService.request(
      "/users/current",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (error) {
      return NextResponse.json(error, { status });
    }

    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const payload: Record<string, unknown> = {};

    if (typeof body?.email === "string") payload.email = body.email;
    if (typeof body?.name === "string") payload.name = body.name;
    if (typeof body?.password === "string") payload.password = body.password;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { message: "At least one field is required (name, email, password)" },
        { status: 400 },
      );
    }

    const { data, error, status } = await backendService.request(
      "/users/current",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (error) {
      return NextResponse.json(error, { status });
    }

    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Authorization token required" },
          { status: 401 },
        ),
      );
    }

    const { error, status } = await backendService.request(
      "/users/current",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (error) {
      return NextResponse.json(error, { status });
    }

    const response =
      status === 204 ? new NextResponse(null, { status }) : new NextResponse(null, { status });
    return clearAuthCookies(response);
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
