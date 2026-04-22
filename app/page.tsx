import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Building2, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC]">
      {/* Nav */}
      <nav className="border-b border-[#30363D] backdrop-blur-sm sticky top-0 z-50 bg-[#0D1117]/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#F97316] flex items-center justify-center font-bold text-white">A</div>
            <span className="text-xl font-bold">Arranca</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#8B949E] hover:text-[#F0F6FC] transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Empezar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#161B22] border border-[#30363D] px-4 py-1.5 rounded-full text-sm text-[#8B949E] mb-8">
          <Shield className="w-4 h-4 text-[#10B981]" />
          Validado legalmente por abogados venezolanos
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Tu empresa en Venezuela,
          <br />
          <span className="bg-gradient-to-r from-[#3B82F6] to-[#F97316] bg-clip-text text-transparent">
            sin complicaciones.
          </span>
        </h1>
        <p className="text-xl text-[#8B949E] max-w-2xl mx-auto mb-10">
          Constituye tu empresa, abre tu cuenta bancaria, y tramita todas las licencias de tu negocio en un solo lugar. Guía paso a paso.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="group bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-8 py-4 rounded-lg transition-all flex items-center gap-2 text-lg"
          >
            Empezar gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#como-funciona"
            className="text-[#F0F6FC] border border-[#30363D] hover:border-[#8B949E] px-8 py-4 rounded-lg transition-all font-semibold"
          >
            Cómo funciona
          </Link>
        </div>
        <p className="text-sm text-[#484F58] mt-6">Empieza sin pagar. Solo cobramos al generar documentos oficiales.</p>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-y border-[#30363D]">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-[#3B82F6]">10-25</div>
            <div className="text-sm text-[#8B949E] mt-1">días para constituir</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#F97316]">4 tipos</div>
            <div className="text-sm text-[#8B949E] mt-1">de empresa disponibles</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#10B981]">100%</div>
            <div className="text-sm text-[#8B949E] mt-1">en línea, sin filas</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Tres fases, un solo lugar</h2>
          <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
            Te acompañamos desde la idea hasta que tu empresa esté operando.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              icon: FileText,
              title: "Constitución legal",
              desc: "Genera tu Acta Constitutiva, reserva el nombre, y completa los pasos en SAREN y Registro Mercantil.",
              color: "#3B82F6",
            },
            {
              num: "02",
              icon: Building2,
              title: "Post-constitución",
              desc: "RIF, cuenta bancaria en 100% Banco, libros contables, IVSS y demás parafiscales.",
              color: "#F97316",
            },
            {
              num: "03",
              icon: Zap,
              title: "Licencias de tu negocio",
              desc: "Permisos específicos según tu giro: sanidad, licores, importación, salud y más.",
              color: "#10B981",
            },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 hover:border-[#8B949E] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${step.color}20` }}
                >
                  <step.icon className="w-6 h-6" style={{ color: step.color }} />
                </div>
                <span className="text-4xl font-bold text-[#21262D]">{step.num}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-[#8B949E] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Diseñado para emprendedores, no para abogados</h2>
            <p className="text-[#8B949E] text-lg mb-8">
              Arranca te guía con preguntas simples y te dice exactamente qué hacer en cada paso. Sin términos legales complicados, sin adivinar.
            </p>
            <ul className="space-y-4">
              {[
                "Wizard de una pregunta a la vez — nunca te abruma",
                "Recomendación inteligente del tipo de empresa ideal",
                "Documentos legales generados automáticamente",
                "Dashboard con progreso en tiempo real",
                "Conexión directa con 100% Banco para tu cuenta",
                "Recordatorios de renovaciones y obligaciones fiscales",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#F0F6FC]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-[#30363D] rounded-2xl p-8">
            <div className="space-y-4">
              {[
                { label: "Reserva de nombre", status: "Completado" },
                { label: "Acta Constitutiva", status: "Completado" },
                { label: "Registro Mercantil", status: "En proceso" },
                { label: "Publicación mercantil", status: "Pendiente" },
                { label: "RIF (SENIAT)", status: "Pendiente" },
              ].map((task, i) => (
                <div
                  key={task.label}
                  className="flex items-center justify-between p-4 bg-[#0D1117] border border-[#30363D] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        i < 2 ? "bg-[#10B981]" : i === 2 ? "bg-[#F97316]" : "bg-[#30363D]"
                      }`}
                    >
                      {i < 2 && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm">{task.label}</span>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      i < 2
                        ? "text-[#10B981]"
                        : i === 2
                        ? "text-[#F97316]"
                        : "text-[#8B949E]"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#F97316]/10 border border-[#30363D] rounded-3xl p-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Listo para arrancar?</h2>
          <p className="text-[#8B949E] text-lg mb-8">
            Empieza tu empresa hoy. Sin compromisos. Sin complicaciones.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-semibold px-8 py-4 rounded-lg transition-all text-lg group"
          >
            Crear mi empresa ahora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#30363D] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-[#8B949E]">
          <div>© {new Date().getFullYear()} Arranca. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <Link href="/terminos" className="hover:text-[#F0F6FC]">Términos</Link>
            <Link href="/privacidad" className="hover:text-[#F0F6FC]">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
