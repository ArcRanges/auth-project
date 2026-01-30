import dynamic from "next/dynamic";

const LogoutPage = dynamic(() => import("./LogoutPage"), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-gray-600">Loading…</div>
    </div>
  ),
});

export default function Page() {
  return <LogoutPage />;
}
