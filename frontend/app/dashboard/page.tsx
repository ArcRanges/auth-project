import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendService } from "@/lib/backend/service";
import Dashboard, { type CurrentUser } from "./Dashboard";

export default async function Page() {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const { data, error, status } = await backendService.request<CurrentUser>(
    "/users/current",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (error || !data) {
    if (status === 401 || status === 403) {
      redirect("/logout");
    }

    throw new Error(error?.message || "Failed to load dashboard");
  }

  return <Dashboard user={data} />;
}
