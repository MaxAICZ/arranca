"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WizardShell, OptionCard } from "@/components/wizard/WizardShell";
import { TIPOS_NEGOCIO, COMPANY_TYPE_INFO, CompanyType } from "@/types";
import { ExternalLink, Plus, Trash2, CheckCircle2 } from "lucide-react";

type Socio = { nombre: string; cedula: string; porcentaje: number; cargo: string };

const TOTAL_STEPS = 14;

export default function WizardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Phase 1 (discovery)
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [numSocios, setNumSocios] = useState("");
  const [esExtranjero, setEsExtranjero] = useState<boolean | null>(null);
  const [tieneNombre, setTieneNombre] = useState<boolean | null>(null);

  // Phase 2 (type recommendation)
  const [tipoEmpresa, setTipoEmpresa] = useState<CompanyType | null>(null);

  // Phase 3 (company data)
  const [nombreVerificado, setNombreVerificado] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [objetoSocial, setObjetoSocial] = useState("");
  const [capitalSocial, setCapitalSocial] = useState("");
  const [socios, setSocios] = useState<Socio[]>([{ nombre: "", cedula: "", porcentaje: 100, cargo: "Presidente" }]);
  const [ejercicioFiscal, setEjercicioFiscal] = useState("enero-diciembre");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
    })();
  }, [router, supabase]);

  const progress = (step / TOTAL_STEPS) * 100;

  function recommendType(): CompanyType {
    if (numSocios === "solo") return "FP";
    if (numSocios === "2-5" && !esExtranjero) return "PYME";
    if (numSocios === "2-5") return "SRL";
    return "CA";
  }

  function next() {
    if (step === 4) {
      setTipoEmpresa(recommendType());
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function canGoNext(): boolean {
    switch (step) {
      case 1: return !!tipoNegocio;
      case 2: return !!numSocios;
      case 3: return esExtranjero !== null;
      case 4: return tieneNombre !== null;
      case 5: return !!tipoEmpresa;
      case 6: return nombreVerificado;
      case 7: return nombreEmpresa.trim().length >= 3;
      case 8: return domicilio.trim().length >= 5;
      case 9: return objetoSocial.trim().length >= 10;
      case 10: return !!capitalSocial && Number(capitalSocial) > 0;
      case 11: return socios.every(s => s.nombre && s.cedula) && socios.reduce((a, b) => a + b.porcentaje, 0) === 100;
      case 12: return true;
      case 13: return true;
      default: return true;
    }
  }

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        user_id: user.id,
        name: nombreEmpresa,
        type: tipoEmpresa,
        status: "constitucion",
        domicilio,
        objeto_social: objetoSocial,
        capital_social: Number(capitalSocial),
        ejercicio_fiscal: ejercicioFiscal,
        tipo_negocio: tipoNegocio,
        num_socios: numSocios,
        es_extranjero: esExtranjero,
      })
      .select()
      .single();

    if (error || !company) {
      alert("Error al guardar: " + error?.message);
      setLoading(false);
      return;
    }

    // Insert socios
    await supabase.from("socios").insert(
      socios.map((s, i) => ({
        company_id: company.id,
        nombre: s.nombre,
        cedula: s.cedula,
        porcentaje: s.porcentaje,
        cargo: s.cargo,
        orden: i,
      }))
    );

    // Create default tasks
    const tareas = getDefaultTareas(company.id, tipoNegocio, esExtranjero);
    await supabase.from("tareas").insert(tareas);

    setCompanyId(company.id);
    router.push(`/empresa/${company.id}`);
  }

  function getStepConfig() {
    switch (step) {
      case 1: return { title: "¿Qué tipo de negocio quieres crear?", subtitle: "Esto nos ayuda a identificar permisos y licencias que vas a necesitar." };
      case 2: return { title: "¿Cuántos socios serán?", subtitle: "Este número determina qué tipo de empresa te conviene más." };
      case 3: return { title: "¿Eres venezolano?", subtitle: "Los extranjeros tienen algunos requisitos adicionales que debemos considerar." };
      case 4: return { title: "¿Ya tienes nombre para tu empresa?", subtitle: "Si no lo tienes, no pasa nada. Te ayudamos más adelante." };
      case 5: return { title: "Tu empresa ideal", subtitle: "Según tus respuestas, esto es lo que te recomendamos." };
      case 6: return { title: "Verifica el nombre", subtitle: "Primero necesitas confirmar que el nombre esté disponible en SAREN." };
      case 7: return { title: "Nombre oficial de la empresa", subtitle: "Este nombre aparecerá en todos los documentos legales." };
      case 8: return { title: "¿Dónde operará la empresa?", subtitle: "Domicilio fiscal. Puede ser una oficina, local, o incluso tu casa." };
      case 9: return { title: "¿A qué se dedicará?", subtitle: "Describe el objeto social de la empresa. Sé específico pero no muy limitante." };
      case 10: return { title: "Capital social", subtitle: "El monto con el que se constituye la empresa (en USD)." };
      case 11: return { title: "Socios y participación", subtitle: "Agrega cada socio con su porcentaje. La suma debe dar 100%." };
      case 12: return { title: "Ejercicio fiscal", subtitle: "El período que usarás para calcular impuestos anuales." };
      case 13: return { title: "Revisa todo", subtitle: "Verifica que la información esté correcta antes de generar tu Acta." };
      case 14: return { title: "¡Todo listo!", subtitle: "Vamos a crear tu empresa y generar los documentos." };
      default: return { title: "", subtitle: "" };
    }
  }

  const config = getStepConfig();
  const isLastStep = step === TOTAL_STEPS;

  return (
    <WizardShell
      title={config.title}
      subtitle={config.subtitle}
      progress={progress}
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={step > 1 ? back : undefined}
      onNext={isLastStep ? handleFinish : next}
      nextLabel={isLastStep ? "Crear empresa" : "Continuar"}
      canGoNext={canGoNext()}
      loading={loading}
      showBack={step > 1}
    >
      {step === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {TIPOS_NEGOCIO.map((t) => (
            <OptionCard
              key={t.value}
              selected={tipoNegocio === t.value}
              onClick={() => setTipoNegocio(t.value)}
              icon={t.icon}
              title={t.label}
            />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {[
            { value: "solo", label: "Solo yo", desc: "Un único dueño" },
            { value: "2-5", label: "Entre 2 y 5 socios", desc: "Estructura pequeña" },
            { value: "6+", label: "Más de 5 socios", desc: "Estructura corporativa" },
          ].map((o) => (
            <OptionCard key={o.value} selected={numSocios === o.value} onClick={() => setNumSocios(o.value)} title={o.label} description={o.desc} />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <OptionCard selected={esExtranjero === false} onClick={() => setEsExtranjero(false)} title="Soy venezolano" description="Proceso estándar" />
          <OptionCard selected={esExtranjero === true} onClick={() => setEsExtranjero(true)} title="Soy extranjero" description="Requiere pasos adicionales (SIEX, domicilio, etc.)" />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <OptionCard selected={tieneNombre === true} onClick={() => setTieneNombre(true)} title="Sí, ya tengo un nombre" description="Lo verificaremos en SAREN" />
          <OptionCard selected={tieneNombre === false} onClick={() => setTieneNombre(false)} title="Aún no, necesito ayuda" description="Te daremos recomendaciones" />
        </div>
      )}

      {step === 5 && tipoEmpresa && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#F97316]/10 border-2 border-[#3B82F6] rounded-2xl p-6">
            <div className="text-xs font-semibold text-[#3B82F6] mb-2 uppercase tracking-wider">Recomendación</div>
            <h3 className="text-2xl font-bold mb-2">{COMPANY_TYPE_INFO[tipoEmpresa].nombre}</h3>
            <p className="text-[#8B949E] mb-4">{COMPANY_TYPE_INFO[tipoEmpresa].descripcion}</p>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><div className="text-[#8B949E]">Capital</div><div className="font-semibold">{COMPANY_TYPE_INFO[tipoEmpresa].capital}</div></div>
              <div><div className="text-[#8B949E]">Socios</div><div className="font-semibold">{COMPANY_TYPE_INFO[tipoEmpresa].socios}</div></div>
            </div>
            <ul className="space-y-2">
              {COMPANY_TYPE_INFO[tipoEmpresa].pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-[#8B949E] text-center">¿Prefieres otra opción? Haz clic para cambiar:</p>
          <div className="grid grid-cols-2 gap-3">
            {(["FP", "PYME", "SRL", "CA"] as CompanyType[]).filter(t => t !== tipoEmpresa).map(t => (
              <button key={t} onClick={() => setTipoEmpresa(t)} className="p-3 rounded-lg border border-[#30363D] hover:border-[#8B949E] text-sm text-left">
                <div className="font-semibold">{COMPANY_TYPE_INFO[t].nombre}</div>
                <div className="text-xs text-[#8B949E]">{COMPANY_TYPE_INFO[t].capital}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6">
            <p className="text-[#F0F6FC] mb-4">Antes de continuar, verifica que el nombre de tu empresa esté disponible en el sistema de SAREN.</p>
            <a href="https://www.saren.gob.ve" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-3 rounded-lg transition-all font-medium">
              Verificar en SAREN <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <label className="flex items-start gap-3 p-4 bg-[#161B22] border border-[#30363D] rounded-xl cursor-pointer hover:border-[#8B949E]">
            <input type="checkbox" checked={nombreVerificado} onChange={(e) => setNombreVerificado(e.target.checked)} className="w-5 h-5 mt-0.5 accent-[#3B82F6]" />
            <div>
              <div className="font-medium">Ya verifiqué que el nombre está disponible</div>
              <div className="text-sm text-[#8B949E] mt-0.5">Confirmo que puedo usarlo legalmente</div>
            </div>
          </label>
        </div>
      )}

      {step === 7 && (
        <div>
          <input
            type="text"
            value={nombreEmpresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            placeholder="Ej: Tecnologías Innovadoras"
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-xl text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
            autoFocus
          />
          {tipoEmpresa && nombreEmpresa && (
            <p className="text-sm text-[#8B949E] mt-3">
              Nombre completo: <span className="text-[#F0F6FC] font-medium">{nombreEmpresa}, {tipoEmpresa === "CA" ? "C.A." : tipoEmpresa === "SRL" ? "S.R.L." : tipoEmpresa === "PYME" ? "PYME" : ""}</span>
            </p>
          )}
        </div>
      )}

      {step === 8 && (
        <textarea
          value={domicilio}
          onChange={(e) => setDomicilio(e.target.value)}
          placeholder="Ej: Avenida Principal, Torre Alfa, Piso 5, Oficina 501, Chacao, Caracas, Miranda"
          rows={4}
          className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] resize-none"
          autoFocus
        />
      )}

      {step === 9 && (
        <div>
          <textarea
            value={objetoSocial}
            onChange={(e) => setObjetoSocial(e.target.value)}
            placeholder="Ej: La compra, venta, importación y comercialización de productos tecnológicos, así como el desarrollo de software y servicios relacionados..."
            rows={6}
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] resize-none"
            autoFocus
          />
          <p className="text-sm text-[#8B949E] mt-3">
            💡 Tip: Puedes incluir actividades secundarias añadiendo &quot;y en general, cualquier actividad lícita de comercio relacionada&quot;.
          </p>
        </div>
      )}

      {step === 10 && (
        <div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-[#8B949E]">$</span>
            <input
              type="number"
              value={capitalSocial}
              onChange={(e) => setCapitalSocial(e.target.value)}
              placeholder="10000"
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg pl-10 pr-5 py-4 text-xl text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
              autoFocus
            />
          </div>
          {tipoEmpresa && (
            <p className="text-sm text-[#8B949E] mt-3">
              Mínimo recomendado para {COMPANY_TYPE_INFO[tipoEmpresa].nombre}: {COMPANY_TYPE_INFO[tipoEmpresa].capital}
            </p>
          )}
        </div>
      )}

      {step === 11 && (
        <div className="space-y-4">
          {socios.map((socio, i) => (
            <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Socio #{i + 1}</div>
                {socios.length > 1 && (
                  <button onClick={() => setSocios(socios.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                value={socio.nombre}
                onChange={(e) => {
                  const copy = [...socios]; copy[i].nombre = e.target.value; setSocios(copy);
                }}
                placeholder="Nombre completo"
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={socio.cedula}
                  onChange={(e) => {
                    const copy = [...socios]; copy[i].cedula = e.target.value; setSocios(copy);
                  }}
                  placeholder="Cédula / Pasaporte"
                  className="bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={socio.porcentaje}
                    onChange={(e) => {
                      const copy = [...socios]; copy[i].porcentaje = Number(e.target.value); setSocios(copy);
                    }}
                    placeholder="50"
                    className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 pr-10 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B949E]">%</span>
                </div>
              </div>
              <select
                value={socio.cargo}
                onChange={(e) => {
                  const copy = [...socios]; copy[i].cargo = e.target.value; setSocios(copy);
                }}
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 text-[#F0F6FC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option>Presidente</option>
                <option>Vicepresidente</option>
                <option>Director</option>
                <option>Gerente</option>
                <option>Accionista</option>
              </select>
            </div>
          ))}
          <button
            onClick={() => setSocios([...socios, { nombre: "", cedula: "", porcentaje: 0, cargo: "Accionista" }])}
            className="w-full border-2 border-dashed border-[#30363D] hover:border-[#8B949E] rounded-xl py-4 flex items-center justify-center gap-2 text-[#8B949E] hover:text-[#F0F6FC] transition-all"
          >
            <Plus className="w-5 h-5" /> Agregar socio
          </button>
          <div className="text-sm text-center">
            Total: <span className={socios.reduce((a, b) => a + b.porcentaje, 0) === 100 ? "text-[#10B981] font-semibold" : "text-red-400 font-semibold"}>
              {socios.reduce((a, b) => a + b.porcentaje, 0)}%
            </span>
            {socios.reduce((a, b) => a + b.porcentaje, 0) !== 100 && <span className="text-[#8B949E]"> (debe sumar 100%)</span>}
          </div>
        </div>
      )}

      {step === 12 && (
        <div className="space-y-3">
          <OptionCard selected={ejercicioFiscal === "enero-diciembre"} onClick={() => setEjercicioFiscal("enero-diciembre")} title="Año calendario" description="1 de enero al 31 de diciembre (más común)" />
          <OptionCard selected={ejercicioFiscal === "julio-junio"} onClick={() => setEjercicioFiscal("julio-junio")} title="Fiscal julio-junio" description="1 de julio al 30 de junio del año siguiente" />
          <OptionCard selected={ejercicioFiscal === "custom"} onClick={() => setEjercicioFiscal("custom")} title="Otro período" description="Lo ajustaremos contigo más adelante" />
        </div>
      )}

      {step === 13 && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-4">
          <Row label="Tipo de empresa" value={tipoEmpresa ? COMPANY_TYPE_INFO[tipoEmpresa].nombre : ""} />
          <Row label="Nombre" value={nombreEmpresa} />
          <Row label="Domicilio" value={domicilio} />
          <Row label="Objeto social" value={objetoSocial} />
          <Row label="Capital social" value={`$${Number(capitalSocial).toLocaleString()}`} />
          <Row label="Socios" value={`${socios.length} (${socios.map(s => s.nombre).filter(Boolean).join(", ")})`} />
          <Row label="Ejercicio fiscal" value={ejercicioFiscal} />
          <Row label="Tipo de negocio" value={TIPOS_NEGOCIO.find(t => t.value === tipoNegocio)?.label || ""} />
        </div>
      )}

      {step === 14 && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#3B82F6] to-[#F97316] flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Todo listo?</h3>
            <p className="text-[#8B949E]">
              Al hacer clic en &quot;Crear empresa&quot;, generaremos tu Acta Constitutiva y el plan completo de pasos a seguir. Podrás acceder a todo desde tu dashboard.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 pb-3 border-b border-[#30363D] last:border-0 last:pb-0">
      <div className="text-sm text-[#8B949E] w-36 flex-shrink-0">{label}</div>
      <div className="flex-1 text-[#F0F6FC] font-medium">{value || <span className="text-[#484F58] italic">Sin especificar</span>}</div>
    </div>
  );
}

function getDefaultTareas(companyId: string, tipoNegocio: string, esExtranjero: boolean | null) {
  const tareas = [
    // Phase 5: Constitución
    { fase: 5, nombre: "Reserva de nombre en SAREN", descripcion: "Verificar y reservar el nombre elegido", orden: 1, link: "https://www.saren.gob.ve" },
    { fase: 5, nombre: "Visado del Acta por abogado", descripcion: "Un abogado colegiado debe visar el documento", orden: 2 },
    { fase: 5, nombre: "Presentar en Registro Mercantil", descripcion: "Pagar aranceles y registrar la empresa", orden: 3 },
    { fase: 5, nombre: "Publicación en periódico mercantil", descripcion: "Publicar el acta en un periódico especializado", orden: 4 },
    { fase: 5, nombre: "Sellado de libros contables", descripcion: "Sellar los 5 libros (Diario, Mayor, Inventario, Actas, Accionistas) en el Registro", orden: 5 },
    // Phase 6: Post-constitución universal
    { fase: 6, nombre: "Obtener RIF en SENIAT", descripcion: "Registro de Información Fiscal", orden: 1 },
    { fase: 6, nombre: "Abrir cuenta bancaria en 100% Banco", descripcion: "Nuestro banco aliado con proceso simplificado", orden: 2 },
    { fase: 6, nombre: "Registro en IVSS (TIUNA)", descripcion: "Instituto Venezolano de los Seguros Sociales", orden: 3 },
    { fase: 6, nombre: "Registro en BANAVIH", descripcion: "Banco Nacional de Vivienda y Hábitat", orden: 4 },
    { fase: 6, nombre: "Registro en INCES", descripcion: "Instituto Nacional de Capacitación y Educación Socialista", orden: 5 },
    { fase: 6, nombre: "Registro RNET", descripcion: "Registro Nacional de Entidades de Trabajo", orden: 6 },
    { fase: 6, nombre: "Patente de Industria y Comercio", descripcion: "Licencia municipal donde operará la empresa", orden: 7 },
    { fase: 6, nombre: "Conformidad de uso municipal", descripcion: "Verificación de zonificación del domicilio", orden: 8 },
    { fase: 6, nombre: "Permiso de Bomberos", descripcion: "Inspección y permiso del cuerpo de bomberos", orden: 9 },
  ];

  if (esExtranjero) {
    tareas.push({ fase: 6, nombre: "Registro en SIEX", descripcion: "Superintendencia de Inversiones Extranjeras", orden: 10 });
  }

  // Phase 7: Licencias por giro
  const licencias: Record<string, { nombre: string; descripcion: string }[]> = {
    restaurante: [
      { nombre: "Permiso sanitario", descripcion: "Permiso del Ministerio de Salud para manejo de alimentos" },
      { nombre: "Registro INPSASEL", descripcion: "Instituto Nacional de Prevención, Salud y Seguridad Laboral" },
    ],
    bar_licoreria: [
      { nombre: "Licencia de expendio de bebidas alcohólicas", descripcion: "Licencia SUNDDE para venta de licor" },
      { nombre: "Permiso sanitario", descripcion: "Permiso del Ministerio de Salud" },
    ],
    importacion: [
      { nombre: "Registro Único de Usuario Aduanero (RUA)", descripcion: "Registro ante SENIAT para importar" },
      { nombre: "Certificados de no producción nacional", descripcion: "Cuando aplique al producto" },
    ],
    exportacion: [
      { nombre: "Registro en VUCE", descripcion: "Ventanilla Única de Comercio Exterior" },
    ],
    salud: [
      { nombre: "Permiso del MPPS", descripcion: "Ministerio del Poder Popular para la Salud" },
      { nombre: "Registro de profesionales de salud", descripcion: "Certificación del personal médico" },
    ],
    construccion: [
      { nombre: "Registro en Colegio de Ingenieros", descripcion: "Si aplica según los servicios" },
      { nombre: "Permisos municipales de construcción", descripcion: "Según los proyectos específicos" },
    ],
  };

  (licencias[tipoNegocio] || []).forEach((l, i) => {
    tareas.push({ fase: 7, nombre: l.nombre, descripcion: l.descripcion, orden: i + 1 });
  });

  // Phase 8: Obligaciones recurrentes
  tareas.push(
    { fase: 8, nombre: "Declaración mensual de IVA", descripcion: "Aunque tengas cero operaciones, debes declarar mensualmente", orden: 1 },
    { fase: 8, nombre: "Anticipos mensuales de ISLR", descripcion: "0.5% de ingresos brutos mensuales", orden: 2 },
    { fase: 8, nombre: "Declaración anual de ISLR", descripcion: "Dentro del primer trimestre del año siguiente", orden: 3 },
    { fase: 8, nombre: "Aporte a Ciencia y Tecnología", descripcion: "0.5% a 2% de ingresos brutos (según tamaño)", orden: 4 },
  );

  return tareas.map(t => ({
    company_id: companyId,
    fase: t.fase,
    nombre: t.nombre,
    descripcion: t.descripcion,
    orden: t.orden,
    link: (t as { link?: string }).link || null,
    completada: false,
  }));
}
