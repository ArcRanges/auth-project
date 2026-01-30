"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    label: "Profile",
    href: "/dashboard",
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    label: "Sessions",
    href: "/dashboard/sessions",
    isActive: (pathname) => pathname.startsWith("/dashboard/sessions"),
  },
  {
    label: "Users",
    href: "/dashboard/users",
    isActive: (pathname) => pathname.startsWith("/dashboard/users"),
  },
];

export default function DashboardNavbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-xl font-semibold text-gray-900"
            >
              Auth Project
            </Link>

            <div className="flex items-center gap-3">
              {navItems.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "text-sm font-semibold text-gray-900"
                        : "text-sm font-medium text-gray-600 hover:text-gray-900"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center">
            <Link
              href="/logout"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
