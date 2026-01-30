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
  session_id?: string;
  user?: BackendUser;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const { data, error, status } = await backendService.request<BackendAuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
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

    if (data?.session_id) {
      response.cookies.set({
        name: "session_id",
        value: data.session_id,
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
