import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendService } from "@/lib/backend/service";
import { User } from "@/lib/api";
import UsersPage from "./UsersPage";

export default async function Page() {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const { data, error, status } = await backendService.request<User[]>(
    "/users",
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

    throw new Error(error?.message || "Failed to load users");
  }

  return <UsersPage users={data} />;
}
