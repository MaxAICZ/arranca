import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC]">
      <nav className="border-b border-[#30363D] bg-[#0D1117] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#F97316] flex items-center justify-center font-bold text-white">A</div>
            <span className="text-xl font-bold">Arranca</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#F0F6FC] transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <div className="text-sm text-[#8B949E] hidden md:block">{user.email}</div>
            <form action={signOut}>
              <button type="submit" className="text-[#8B949E] hover:text-[#F0F6FC] p-2 rounded-lg hover:bg-[#161B22] transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
