import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendService } from "@/lib/backend/service";
import SessionManagement from "./SessionManagement";
import { decodeJwtPayload } from "@/lib/jwt";

type BackendSession = {
  sessionId: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
};

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const cookieSessionId = cookieStore.get("session_id")?.value;
  const decoded = accessToken
    ? decodeJwtPayload<{ sid?: string }>(accessToken)
    : null;
  const tokenSessionId =
    typeof decoded?.sid === "string" && decoded.sid.length > 0
      ? decoded.sid
      : null;
  const currentSessionId = cookieSessionId ?? tokenSessionId ?? null;

  if (!accessToken) {
    redirect("/login");
  }

  const { data, error, status } = await backendService.request<
    BackendSession[]
  >("/auth/sessions", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (error || !data) {
    if (status === 401 || status === 403) {
      redirect("/logout");
    }
    throw new Error(error?.message || "Failed to load sessions");
  }

  return (
    <SessionManagement
      initialSessions={data}
      initialCurrentSessionId={currentSessionId}
    />
  );
}
