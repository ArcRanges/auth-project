"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiClient, type Session } from "@/lib/api";
import DashboardNavbar from "@/app/components/DashboardNavbar";
import Link from "next/link";

type Props = {
  initialSessions: Session[];
  initialCurrentSessionId: string | null;
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatUserAgent = (ua?: string) => {
  if (!ua) return "Unknown device";
  const trimmed = ua.trim();
  if (trimmed.length <= 90) return trimmed;
  return `${trimmed.slice(0, 87)}…`;
};

export default function SessionManagement({
  initialSessions,
  initialCurrentSessionId,
}: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    initialCurrentSessionId,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedSessions = useMemo(() => {
    const list = [...sessions];
    list.sort((a, b) => {
      const aIsCurrent = currentSessionId && a.sessionId === currentSessionId;
      const bIsCurrent = currentSessionId && b.sessionId === currentSessionId;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;

      const aLast = Date.parse(a.lastUsedAt);
      const bLast = Date.parse(b.lastUsedAt);
      if (Number.isFinite(aLast) && Number.isFinite(bLast))
        return bLast - aLast;
      return 0;
    });
    return list;
  }, [currentSessionId, sessions]);

  const refreshSessions = async () => {
    const response = await apiClient.listCurrentSessions();
    setSessions(response.sessions ?? []);
    setCurrentSessionId(response.current_session_id ?? null);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      await apiClient.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (currentSessionId && sessionId === currentSessionId) {
        router.replace("/logout");
        router.refresh();
        return;
      }
      setSuccess("Session signed out.");
    } catch (err) {
      const message =
        typeof (err as { message?: unknown })?.message === "string"
          ? (err as { message: string }).message
          : "Failed to revoke session.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      await apiClient.revokeOtherSessions();
      await refreshSessions();
      setSuccess("Other sessions signed out.");
    } catch (err) {
      const message =
        typeof (err as { message?: unknown })?.message === "string"
          ? (err as { message: string }).message
          : "Failed to revoke other sessions.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Session Management
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  View and sign out active sessions for the current account.
                </p>
              </div>
              <button
                onClick={handleRevokeOtherSessions}
                disabled={isLoading || sortedSessions.length <= 1}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign out other sessions
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
                {success}
              </div>
            ) : null}

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last active
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSessions.map((session) => {
                    const isCurrent =
                      currentSessionId &&
                      session.sessionId === currentSessionId;

                    return (
                      <tr key={session.sessionId}>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatUserAgent(session.userAgent)}
                            </span>
                            {isCurrent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                This session
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {session.ip ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatDateTime(session.lastUsedAt)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatDateTime(session.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatDateTime(session.expiresAt)}
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          {isCurrent ? (
                            <Link
                              href="/logout"
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Sign out
                            </Link>
                          ) : (
                            <button
                              onClick={() =>
                                handleRevokeSession(session.sessionId)
                              }
                              disabled={isLoading}
                              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Sign out
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {sortedSessions.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-8 text-sm text-gray-600"
                        colSpan={6}
                      >
                        No active sessions found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Tip: “Last active” updates during normal authenticated API usage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
