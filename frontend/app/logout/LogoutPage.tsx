"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you out...");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await apiClient.logout();
      } catch {
      } finally {
        if (!isMounted) return;
        setMessage("Redirecting to login...");
        router.replace("/login");
        router.refresh();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Logout</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
