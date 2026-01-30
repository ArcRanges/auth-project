import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LoginPage = dynamic(() => import("./LoginPage"), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-gray-600">Loading…</div>
    </div>
  ),
});

export default async function Page() {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  return <LoginPage />;
}
