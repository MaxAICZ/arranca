import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Building2, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { COMPANY_TYPE_INFO, CompanyType } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: companies } = await supabase
    .from("companies")
    .select("*, tareas(fase, completada)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const hasCompanies = companies && companies.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Hola{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}</h1>
        <p className="text-[#8B949E] text-lg">
          {hasCompanies ? "Tus empresas y su progreso" : "¿Listo para arrancar tu primera empresa?"}
        </p>
      </div>

      {!hasCompanies ? (
        <div className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border-2 border-dashed border-[#30363D] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#F97316] flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Crea tu primera empresa</h2>
          <p className="text-[#8B949E] max-w-md mx-auto mb-6">
            Te tomará unos 5 minutos responder preguntas simples. Al final, generaremos tu Acta Constitutiva y tu plan de acción.
          </p>
          <Link href="/wizard" className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-8 py-4 rounded-lg transition-all group text-lg">
            <Plus className="w-5 h-5" /> Empezar ahora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {companies!.map((company) => {
              const tareas = company.tareas || [];
              const total = tareas.length;
              const done = tareas.filter((t: { completada: boolean }) => t.completada).length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const info = COMPANY_TYPE_INFO[company.type as CompanyType];

              return (
                <Link
                  key={company.id}
                  href={`/empresa/${company.id}`}
                  className="bg-[#161B22] border border-[#30363D] hover:border-[#8B949E] rounded-xl p-6 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#3B82F6] mb-1 uppercase tracking-wider">{info?.nombre}</div>
                      <h3 className="text-xl font-bold truncate">{company.name}</h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#8B949E] group-hover:text-[#F0F6FC] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#8B949E]">Progreso</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#0D1117] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3B82F6] to-[#F97316] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[5, 6, 7, 8].map(fase => {
                      const faseTareas = tareas.filter((t: { fase: number }) => t.fase === fase);
                      const faseDone = faseTareas.filter((t: { fase: number; completada: boolean }) => t.completada).length;
                      const complete = faseTareas.length > 0 && faseDone === faseTareas.length;
                      return (
                        <div key={fase} className="flex items-center gap-1.5 text-xs">
                          {complete ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> : <Circle className="w-3.5 h-3.5 text-[#484F58]" />}
                          <span className="text-[#8B949E]">
                            {fase === 5 ? "Constitución" : fase === 6 ? "Post-registro" : fase === 7 ? "Licencias" : "Fiscal"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Link>
              );
            })}

            <Link
              href="/wizard"
              className="border-2 border-dashed border-[#30363D] hover:border-[#8B949E] rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#161B22] group-hover:bg-[#1C2128] flex items-center justify-center mb-3 transition-all">
                <Plus className="w-6 h-6 text-[#8B949E] group-hover:text-[#F0F6FC]" />
              </div>
              <div className="font-semibold">Nueva empresa</div>
              <div className="text-sm text-[#8B949E] mt-1">Constituye otra empresa</div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
