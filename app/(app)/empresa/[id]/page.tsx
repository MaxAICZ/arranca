import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Download, ArrowLeft, MapPin, DollarSign, Users, Calendar } from "lucide-react";
import { COMPANY_TYPE_INFO, CompanyType } from "@/types";
import { TaskList } from "@/components/dashboard/TaskList";

const FASES = [
  { num: 5, name: "Constitución Legal", color: "#3B82F6", desc: "Los pasos formales para registrar tu empresa" },
  { num: 6, name: "Post-Constitución", color: "#F97316", desc: "Requisitos universales: RIF, banco, libros, parafiscales" },
  { num: 7, name: "Licencias del negocio", color: "#10B981", desc: "Permisos específicos según tu giro" },
  { num: 8, name: "Obligaciones Fiscales", color: "#A855F7", desc: "Declaraciones y aportes recurrentes" },
];

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("*, socios(*), tareas(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!company) notFound();

  const tareas = company.tareas || [];
  const total = tareas.length;
  const done = tareas.filter((t: { completada: boolean }) => t.completada).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const info = COMPANY_TYPE_INFO[company.type as CompanyType];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#F0F6FC] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-medium text-[#3B82F6] mb-2 uppercase tracking-wider">{info?.nombre}</div>
        <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
        <p className="text-[#8B949E]">{company.objeto_social?.slice(0, 150)}...</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MapPin} label="Domicilio" value={company.domicilio?.split(",")[0] || "—"} />
        <StatCard icon={DollarSign} label="Capital" value={`$${Number(company.capital_social).toLocaleString()}`} />
        <StatCard icon={Users} label="Socios" value={String(company.socios?.length || 0)} />
        <StatCard icon={Calendar} label="Ejercicio" value={company.ejercicio_fiscal === "enero-diciembre" ? "Ene-Dic" : company.ejercicio_fiscal} />
      </div>

      {/* Progress */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-[#8B949E]">Progreso general</div>
            <div className="text-3xl font-bold mt-1">{pct}%</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#8B949E]">Tareas</div>
            <div className="text-2xl font-semibold mt-1">{done} / {total}</div>
          </div>
        </div>
        <div className="w-full h-3 bg-[#0D1117] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#3B82F6] via-[#F97316] to-[#10B981] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Documents */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#3B82F6]" /> Documentos
        </h2>
        <a
          href={`/api/documents/${company.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-[#0D1117] border border-[#30363D] hover:border-[#8B949E] rounded-lg p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <div className="font-semibold">Acta Constitutiva</div>
              <div className="text-sm text-[#8B949E]">Documento legal de constitución</div>
            </div>
          </div>
          <Download className="w-5 h-5 text-[#8B949E] group-hover:text-[#F0F6FC] transition-colors" />
        </a>
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {FASES.map((fase) => {
          const faseTareas = tareas.filter((t: { fase: number }) => t.fase === fase.num).sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
          if (faseTareas.length === 0) return null;
          const faseDone = faseTareas.filter((t: { completada: boolean }) => t.completada).length;
          return (
            <div key={fase.num} className="bg-[#161B22] border border-[#30363D] rounded-xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fase.color }} />
                    <h2 className="text-xl font-bold">{fase.name}</h2>
                  </div>
                  <p className="text-sm text-[#8B949E]">{fase.desc}</p>
                </div>
                <div className="text-sm text-[#8B949E]">{faseDone}/{faseTareas.length}</div>
              </div>
              <TaskList tasks={faseTareas} companyId={company.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4">
      <div className="flex items-center gap-2 text-[#8B949E] text-xs mb-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-semibold truncate">{value}</div>
    </div>
  );
}
