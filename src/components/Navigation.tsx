"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-white font-bold text-lg">
            Location Intelligence Platform
          </h1>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              🛍️ Urban Planning Agent
            </Link>
            <Link
              href="/retail-agent"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/retail-agent")
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              🛍️ Retail Agent
            </Link>

            <Link
              href="/real-estate-agent"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/real-estate-agent")
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              🏠 Real Estate Agent
            </Link>
          </div>
        </div>

        <div className="text-slate-400 text-xs">
          AI-powered location intelligence
        </div>
      </div>
    </nav>
  );
}
