"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WizardShell, OptionCard } from "@/components/wizard/WizardShell";
import { Help, InfoCallout } from "@/components/ui/Tooltip";
import { TIPOS_NEGOCIO, COMPANY_TYPE_INFO, CompanyType } from "@/types";
import { VENEZUELA_ESTADOS, ESTADOS, REGISTROS_MERCANTILES } from "@/lib/venezuela-locations";
import { CheckCircle2, Plus, Trash2, Loader2, AlertTriangle, ExternalLink, Building2 } from "lucide-react";

type Socio = { nombre: string; cedula: string; porcentaje: number; cargo: string };
type Currency = "USD" | "BsS";

const TOTAL_STEPS = 15;

export default function WizardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Phase 1 (discovery)
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [numSocios, setNumSocios] = useState("");
  const [esExtranjero, setEsExtranjero] = useState<boolean | null>(null);

  // Phase 2 (type recommendation)
  const [tipoEmpresa, setTipoEmpresa] = useState<CompanyType | null>(null);

  // Phase 3 (company data)
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nameCheck, setNameCheck] = useState<{ checking: boolean; result: { message: string; warnings: string[]; suggestions: string[]; verifyUrl: string } | null }>({ checking: false, result: null });
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [direccion, setDireccion] = useState("");
  const [objetoSocial, setObjetoSocial] = useState("");
  const [capitalCurrency, setCapitalCurrency] = useState<Currency>("USD");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [bcvRate, setBcvRate] = useState(36.5);
  const [socios, setSocios] = useState<Socio[]>([{ nombre: "", cedula: "", porcentaje: 100, cargo: "Presidente" }]);
  const [ejercicioFiscal, setEjercicioFiscal] = useState("enero-diciembre");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
    })();
    // Fetch BCV rate
    fetch("https://pydolarve.org/api/v1/dollar?page=bcv")
      .then(r => r.json())
      .then(d => {
        const rate = Number(d?.monitors?.usd?.price) || Number(d?.monitors?.bcv?.price);
        if (rate) setBcvRate(rate);
      })
      .catch(() => {});
  }, [router, supabase]);

  const progress = (step / TOTAL_STEPS) * 100;

  function recommendType(): CompanyType {
    if (numSocios === "solo") return "FP";
    if (numSocios === "2-5" && !esExtranjero) return "PYME";
    if (numSocios === "2-5") return "SRL";
    return "CA";
  }

  async function checkName() {
    if (!nombreEmpresa.trim() || nombreEmpresa.length < 3) return;
    setNameCheck({ checking: true, result: null });
    try {
      const res = await fetch("/api/saren/check-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombreEmpresa }),
      });
      const data = await res.json();
      setNameCheck({ checking: false, result: data });
    } catch {
      setNameCheck({ checking: false, result: null });
    }
  }

  function next() {
    if (step === 3) setTipoEmpresa(recommendType());
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function capitalInUSD(): number {
    const amount = Number(capitalAmount) || 0;
    return capitalCurrency === "USD" ? amount : amount / bcvRate;
  }

  function canGoNext(): boolean {
    switch (step) {
      case 1: return !!tipoNegocio;
      case 2: return !!numSocios;
      case 3: return esExtranjero !== null;
      case 4: return !!tipoEmpresa;
      case 5: return nombreEmpresa.trim().length >= 3 && !!nameCheck.result;
      case 6: return !!estado && !!municipio;
      case 7: return direccion.trim().length >= 5;
      case 8: return objetoSocial.trim().length >= 10;
      case 9: return Number(capitalAmount) > 0;
      case 10: return socios.every(s => s.nombre && s.cedula) && socios.reduce((a, b) => a + b.porcentaje, 0) === 100;
      case 11: return true;
      case 12: case 13: case 14: return true;
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
        domicilio: `${direccion}, ${municipio}, ${estado}`,
        objeto_social: objetoSocial,
        capital_social: capitalInUSD(),
        ejercicio_fiscal: ejercicioFiscal,
        tipo_negocio: tipoNegocio,
        num_socios: numSocios,
        es_extranjero: esExtranjero,
        wizard_data: { estado, municipio, capitalCurrency, capitalAmount: Number(capitalAmount) },
      })
      .select()
      .single();

    if (error || !company) {
      alert("Error al guardar: " + error?.message);
      setLoading(false);
      return;
    }

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

    const tareas = getDefaultTareas(company.id, tipoNegocio, esExtranjero, estado);
    await supabase.from("tareas").insert(tareas);
    router.push(`/empresa/${company.id}`);
  }

  function getStepConfig() {
    switch (step) {
      case 1: return { title: "¿Qué tipo de negocio quieres crear?", subtitle: "Esto nos ayuda a identificar los permisos y licencias específicas que vas a necesitar." };
      case 2: return { title: "¿Cuántos socios serán?", subtitle: "Este número determina qué tipo de empresa te conviene." };
      case 3: return { title: "¿Eres venezolano?", subtitle: "Los extranjeros tienen algunos requisitos adicionales (SIEX, domicilio, etc.)." };
      case 4: return { title: "Tu empresa ideal", subtitle: "Según tus respuestas, esto es lo que te recomendamos. Puedes cambiarlo si quieres." };
      case 5: return { title: "Elige el nombre", subtitle: "Verificamos automáticamente si está disponible en SAREN." };
      case 6: return { title: "¿Dónde operará la empresa?", subtitle: "Esto determina el Registro Mercantil y requisitos municipales." };
      case 7: return { title: "Dirección exacta", subtitle: "La dirección completa dentro del municipio que elegiste." };
      case 8: return { title: "¿A qué se dedicará?", subtitle: "Describe el objeto social: qué actividades hará tu empresa." };
      case 9: return { title: "Capital social", subtitle: "El monto con el que se constituye la empresa." };
      case 10: return { title: "Socios y participación", subtitle: "Agrega cada socio con su porcentaje. La suma debe dar 100%." };
      case 11: return { title: "Ejercicio fiscal", subtitle: "El período anual para calcular impuestos." };
      case 12: return { title: "Revisa todo", subtitle: "Verifica que la información esté correcta antes de generar tu Acta." };
      case 13: return { title: "¡Todo listo!", subtitle: "Vamos a crear tu empresa y generar los documentos." };
      default: return { title: "", subtitle: "" };
    }
  }

  const config = getStepConfig();
  const isLastStep = step === 13;
  const municipios = estado ? VENEZUELA_ESTADOS[estado] || [] : [];

  return (
    <WizardShell
      title={config.title}
      subtitle={config.subtitle}
      progress={progress}
      step={step}
      totalSteps={13}
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
            <OptionCard key={t.value} selected={tipoNegocio === t.value} onClick={() => setTipoNegocio(t.value)} icon={t.icon} title={t.label} />
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {[
            { value: "solo", label: "Solo yo", desc: "Un único dueño — la forma más simple" },
            { value: "2-5", label: "Entre 2 y 5 socios", desc: "Estructura pequeña, flexible" },
            { value: "6+", label: "Más de 5 socios", desc: "Estructura corporativa, preparada para crecer" },
          ].map((o) => (
            <OptionCard key={o.value} selected={numSocios === o.value} onClick={() => setNumSocios(o.value)} title={o.label} description={o.desc} />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <OptionCard selected={esExtranjero === false} onClick={() => setEsExtranjero(false)} title="Soy venezolano" description="Proceso estándar" />
          <OptionCard selected={esExtranjero === true} onClick={() => setEsExtranjero(true)} title="Soy extranjero" description="Requiere pasaporte, SIEX, y domicilio en Venezuela" />
        </div>
      )}

      {step === 4 && tipoEmpresa && (
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
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />{p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-[#8B949E] text-center">¿Prefieres otra? Haz clic:</p>
          <div className="grid grid-cols-3 gap-2">
            {(["FP", "PYME", "SRL", "CA"] as CompanyType[]).filter(t => t !== tipoEmpresa).map(t => (
              <button key={t} onClick={() => setTipoEmpresa(t)} className="p-3 rounded-lg border border-[#30363D] hover:border-[#8B949E] text-sm text-left transition-all">
                <div className="font-semibold text-xs">{COMPANY_TYPE_INFO[t].nombre}</div>
                <div className="text-xs text-[#8B949E] mt-1">{COMPANY_TYPE_INFO[t].capital}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#8B949E] mb-2 flex items-center">
              Nombre de la empresa
              <Help title="Reglas de nombre">No debe estar ya registrado. Evita palabras como &quot;Banco&quot;, &quot;Venezuela&quot;, o geografías sin autorización. El sufijo (C.A., S.R.L., PYME) se agrega automáticamente.</Help>
            </label>
            <div className="flex gap-2">
              <input
                value={nombreEmpresa}
                onChange={(e) => { setNombreEmpresa(e.target.value); setNameCheck({ checking: false, result: null }); }}
                placeholder="Ej: Tecnologías Innovadoras"
                className="flex-1 bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-xl text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
                autoFocus
              />
              <button
                onClick={checkName}
                disabled={nombreEmpresa.trim().length < 3 || nameCheck.checking}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold px-6 py-4 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {nameCheck.checking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
              </button>
            </div>
            {tipoEmpresa && nombreEmpresa && (
              <p className="text-xs text-[#8B949E] mt-2">
                Nombre completo: <span className="text-[#F0F6FC] font-medium">{nombreEmpresa}{tipoEmpresa === "CA" ? ", C.A." : tipoEmpresa === "SRL" ? ", S.R.L." : tipoEmpresa === "PYME" ? ", PYME" : ""}</span>
              </p>
            )}
          </div>

          {nameCheck.result && (
            <div className={`rounded-xl p-4 border ${nameCheck.result.warnings.length > 0 ? "bg-[#F97316]/5 border-[#F97316]/30" : "bg-[#10B981]/5 border-[#10B981]/30"}`}>
              <div className="flex items-start gap-3">
                {nameCheck.result.warnings.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium mb-1">{nameCheck.result.message}</p>
                  {nameCheck.result.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-[#8B949E] mb-2">{w}</p>
                  ))}
                  {nameCheck.result.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[#8B949E] mb-2">Sugerencias:</p>
                      <div className="flex flex-wrap gap-2">
                        {nameCheck.result.suggestions.map((s: string) => (
                          <button key={s} onClick={() => { setNombreEmpresa(s); setNameCheck({ checking: false, result: null }); }} className="text-xs bg-[#1C2128] border border-[#30363D] rounded-full px-3 py-1 hover:border-[#3B82F6]">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <a href={nameCheck.result.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3B82F6] hover:underline inline-flex items-center gap-1 mt-3">
                    Verificar en saren.gob.ve <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-5">
          <div>
            <label className="text-sm text-[#8B949E] mb-2 flex items-center">
              Estado
              <Help>El estado donde se registra la empresa. Cada estado tiene su propio Registro Mercantil y procedimientos.</Help>
            </label>
            <select
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setMunicipio(""); }}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-[#F0F6FC] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="">Selecciona un estado...</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {estado && (
            <div>
              <label className="text-sm text-[#8B949E] mb-2 flex items-center">
                Municipio
                <Help>El municipio determina la Patente de Industria y Comercio que vas a tramitar y algunos impuestos locales.</Help>
              </label>
              <select
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-[#F0F6FC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="">Selecciona un municipio...</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {estado && REGISTROS_MERCANTILES[estado] && (
            <InfoCallout title="Registro Mercantil correspondiente">
              <Building2 className="w-4 h-4 inline mr-1" />
              {REGISTROS_MERCANTILES[estado]}
            </InfoCallout>
          )}
        </div>
      )}

      {step === 7 && (
        <div>
          <label className="text-sm text-[#8B949E] mb-2 flex items-center">
            Dirección completa
            <Help>Calle, edificio, piso, oficina. Se usa para la cláusula de domicilio en el Acta y para el permiso de Bomberos y Conformidad de Uso municipal.</Help>
          </label>
          <textarea
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Avenida Principal, Torre Alfa, Piso 5, Oficina 501, Urbanización Las Mercedes"
            rows={4}
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] resize-none"
            autoFocus
          />
          <p className="text-sm text-[#8B949E] mt-3">
            Aparecerá como: <span className="text-[#F0F6FC]">{direccion}{municipio && `, ${municipio}`}{estado && `, ${estado}`}</span>
          </p>
        </div>
      )}

      {step === 8 && (
        <div>
          <label className="text-sm text-[#8B949E] mb-2 flex items-center">
            Objeto social
            <Help title="¿Qué es el objeto social?">Describe las actividades comerciales que tu empresa realizará. Sé específico pero incluye actividades relacionadas para tener flexibilidad. No puedes hacer nada que no esté incluido aquí sin modificar el acta después.</Help>
          </label>
          <textarea
            value={objetoSocial}
            onChange={(e) => setObjetoSocial(e.target.value)}
            placeholder="Ej: La compra, venta, importación y comercialización de productos tecnológicos, así como el desarrollo de software y servicios relacionados..."
            rows={6}
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-5 py-4 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6] resize-none"
            autoFocus
          />
          <InfoCallout title="Tip pro">
            Termina con &quot;y en general, cualquier actividad lícita de comercio relacionada&quot; para tener flexibilidad.
          </InfoCallout>
        </div>
      )}

      {step === 9 && tipoEmpresa && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["USD", "BsS"] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => setCapitalCurrency(c)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${capitalCurrency === c ? "bg-[#3B82F6] text-white" : "bg-[#161B22] border border-[#30363D] text-[#8B949E]"}`}
              >
                {c === "USD" ? "Dólares (USD)" : "Bolívares (BsS)"}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-[#8B949E]">
              {capitalCurrency === "USD" ? "$" : "Bs"}
            </span>
            <input
              type="number"
              value={capitalAmount}
              onChange={(e) => setCapitalAmount(e.target.value)}
              placeholder={capitalCurrency === "USD" ? "10000" : "365000"}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg pl-12 pr-5 py-4 text-xl text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
              autoFocus
            />
          </div>

          {Number(capitalAmount) > 0 && (
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8B949E]">En USD:</span>
                <span className="font-mono font-semibold">${capitalInUSD().toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B949E]">En BsS (tasa BCV):</span>
                <span className="font-mono font-semibold">Bs {(capitalInUSD() * bcvRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-[#30363D] mt-2">
                <span className="text-[#484F58]">Tasa BCV actual:</span>
                <span className="text-[#484F58]">Bs {bcvRate.toFixed(2)} / USD</span>
              </div>
            </div>
          )}

          <InfoCallout title={`Mínimo recomendado para ${COMPANY_TYPE_INFO[tipoEmpresa].nombre}`}>
            {COMPANY_TYPE_INFO[tipoEmpresa].capital}. El capital puede estar en efectivo depositado en una cuenta o como inventario de bienes equivalente.
          </InfoCallout>
        </div>
      )}

      {step === 10 && (
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
                onChange={(e) => { const c = [...socios]; c[i].nombre = e.target.value; setSocios(c); }}
                placeholder="Nombre completo"
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={socio.cedula}
                  onChange={(e) => { const c = [...socios]; c[i].cedula = e.target.value; setSocios(c); }}
                  placeholder="Cédula / Pasaporte"
                  className="bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={socio.porcentaje}
                    onChange={(e) => { const c = [...socios]; c[i].porcentaje = Number(e.target.value); setSocios(c); }}
                    placeholder="50"
                    className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 pr-10 text-[#F0F6FC] placeholder-[#484F58] focus:outline-none focus:border-[#3B82F6]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B949E]">%</span>
                </div>
              </div>
              <select
                value={socio.cargo}
                onChange={(e) => { const c = [...socios]; c[i].cargo = e.target.value; setSocios(c); }}
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-lg px-4 py-3 text-[#F0F6FC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option>Presidente</option><option>Vicepresidente</option><option>Director</option><option>Gerente</option><option>Accionista</option>
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

      {step === 11 && (
        <div className="space-y-4">
          <InfoCallout title="¿Qué es el ejercicio fiscal?">
            Es el período anual durante el cual tu empresa calcula sus impuestos. Al cerrar cada ejercicio, presentas la declaración anual de ISLR al SENIAT. El ejercicio más común es el año calendario (1 enero al 31 diciembre).
          </InfoCallout>
          <div className="space-y-3">
            <OptionCard selected={ejercicioFiscal === "enero-diciembre"} onClick={() => setEjercicioFiscal("enero-diciembre")} title="Año calendario" description="1 enero al 31 diciembre — el más común, recomendado" />
            <OptionCard selected={ejercicioFiscal === "julio-junio"} onClick={() => setEjercicioFiscal("julio-junio")} title="Julio a junio" description="1 julio al 30 junio del año siguiente — útil para negocios estacionales" />
            <OptionCard selected={ejercicioFiscal === "custom"} onClick={() => setEjercicioFiscal("custom")} title="Otro período" description="Lo ajustaremos contigo más adelante" />
          </div>
        </div>
      )}

      {step === 12 && tipoEmpresa && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-3">
          <Row label="Tipo de empresa" value={COMPANY_TYPE_INFO[tipoEmpresa].nombre} />
          <Row label="Nombre" value={nombreEmpresa} />
          <Row label="Ubicación" value={[direccion, municipio, estado].filter(Boolean).join(", ")} />
          <Row label="Objeto social" value={objetoSocial} />
          <Row label="Capital" value={`${capitalCurrency === "USD" ? "$" : "Bs "}${Number(capitalAmount).toLocaleString()} ${capitalCurrency}  →  $${capitalInUSD().toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`} />
          <Row label="Socios" value={`${socios.length} (${socios.map(s => s.nombre).filter(Boolean).join(", ")})`} />
          <Row label="Ejercicio fiscal" value={ejercicioFiscal === "enero-diciembre" ? "1 enero — 31 diciembre" : ejercicioFiscal} />
          <Row label="Tipo de negocio" value={TIPOS_NEGOCIO.find(t => t.value === tipoNegocio)?.label || ""} />
        </div>
      )}

      {step === 13 && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#3B82F6] to-[#F97316] flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Todo listo?</h3>
            <p className="text-[#8B949E]">
              Al hacer clic en &quot;Crear empresa&quot;, generaremos tu Acta Constitutiva y el plan completo de pasos a seguir, incluyendo los requisitos específicos de {estado || "tu estado"}.
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
      <div className="text-sm text-[#8B949E] w-32 flex-shrink-0">{label}</div>
      <div className="flex-1 text-[#F0F6FC] font-medium text-sm">{value || <span className="text-[#484F58] italic">Sin especificar</span>}</div>
    </div>
  );
}

function getDefaultTareas(companyId: string, tipoNegocio: string, esExtranjero: boolean | null, _estado: string) {
  const tareas = [
    { fase: 5, nombre: "Reserva de nombre en SAREN", descripcion: "Verificar y reservar el nombre elegido", orden: 1, link: "https://www.saren.gob.ve" },
    { fase: 5, nombre: "Visado del Acta por abogado", descripcion: "Un abogado colegiado debe visar el documento", orden: 2 },
    { fase: 5, nombre: "Presentar en Registro Mercantil", descripcion: "Pagar aranceles y registrar la empresa", orden: 3 },
    { fase: 5, nombre: "Publicación en periódico mercantil", descripcion: "Publicar el acta en un periódico especializado", orden: 4 },
    { fase: 5, nombre: "Sellado de libros contables", descripcion: "Sellar los 5 libros en el Registro Mercantil", orden: 5 },
    { fase: 6, nombre: "Obtener RIF en SENIAT", descripcion: "Registro de Información Fiscal", orden: 1 },
    { fase: 6, nombre: "Abrir cuenta bancaria en 100% Banco", descripcion: "Nuestro banco aliado con proceso simplificado", orden: 2 },
    { fase: 6, nombre: "Registro en IVSS (TIUNA)", descripcion: "Instituto Venezolano de los Seguros Sociales", orden: 3 },
    { fase: 6, nombre: "Registro en BANAVIH", descripcion: "Banco Nacional de Vivienda y Hábitat", orden: 4 },
    { fase: 6, nombre: "Registro en INCES", descripcion: "Instituto Nacional de Capacitación Socialista", orden: 5 },
    { fase: 6, nombre: "Registro RNET", descripcion: "Registro Nacional de Entidades de Trabajo", orden: 6 },
    { fase: 6, nombre: "Patente de Industria y Comercio", descripcion: "Licencia municipal donde operará la empresa", orden: 7 },
    { fase: 6, nombre: "Conformidad de uso municipal", descripcion: "Verificación de zonificación del domicilio", orden: 8 },
    { fase: 6, nombre: "Permiso de Bomberos", descripcion: "Inspección y permiso del cuerpo de bomberos", orden: 9 },
  ];
  if (esExtranjero) tareas.push({ fase: 6, nombre: "Registro en SIEX", descripcion: "Superintendencia de Inversiones Extranjeras", orden: 10 });

  const licencias: Record<string, { nombre: string; descripcion: string }[]> = {
    restaurante: [{ nombre: "Permiso sanitario", descripcion: "Del Ministerio de Salud para manejo de alimentos" }, { nombre: "Registro INPSASEL", descripcion: "Prevención, Salud y Seguridad Laboral" }],
    bar_licoreria: [{ nombre: "Licencia de expendio de bebidas alcohólicas", descripcion: "Licencia SUNDDE" }, { nombre: "Permiso sanitario", descripcion: "Del Ministerio de Salud" }],
    importacion: [{ nombre: "Registro Único de Usuario Aduanero (RUA)", descripcion: "Ante SENIAT para importar" }, { nombre: "Certificados de no producción nacional", descripcion: "Cuando aplique al producto" }],
    exportacion: [{ nombre: "Registro en VUCE", descripcion: "Ventanilla Única de Comercio Exterior" }],
    salud: [{ nombre: "Permiso del MPPS", descripcion: "Ministerio del Poder Popular para la Salud" }, { nombre: "Registro de profesionales", descripcion: "Certificación del personal médico" }],
    construccion: [{ nombre: "Registro en Colegio de Ingenieros", descripcion: "Si aplica según los servicios" }, { nombre: "Permisos municipales de construcción", descripcion: "Según los proyectos específicos" }],
  };
  (licencias[tipoNegocio] || []).forEach((l, i) => tareas.push({ fase: 7, nombre: l.nombre, descripcion: l.descripcion, orden: i + 1 }));

  tareas.push(
    { fase: 8, nombre: "Declaración mensual de IVA", descripcion: "Aunque tengas cero operaciones, debes declarar mensualmente", orden: 1 },
    { fase: 8, nombre: "Anticipos mensuales de ISLR", descripcion: "0.5% de ingresos brutos mensuales", orden: 2 },
    { fase: 8, nombre: "Declaración anual de ISLR", descripcion: "Dentro del primer trimestre del año siguiente", orden: 3 },
    { fase: 8, nombre: "Aporte a Ciencia y Tecnología", descripcion: "0.5% a 2% de ingresos brutos", orden: 4 },
  );

  return tareas.map(t => ({
    company_id: companyId, fase: t.fase, nombre: t.nombre, descripcion: t.descripcion,
    orden: t.orden, link: (t as { link?: string }).link || null, completada: false,
  }));
}
