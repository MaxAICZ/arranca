import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { COMPANY_TYPE_INFO, CompanyType } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: company } = await supabase
    .from("companies")
    .select("*, socios(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!company) return new NextResponse("Not found", { status: 404 });

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const info = COMPANY_TYPE_INFO[company.type as CompanyType];
  const sufijo = company.type === "CA" ? "C.A." : company.type === "SRL" ? "S.R.L." : company.type === "PYME" ? "PYME" : "";
  const razonSocial = `${company.name}${sufijo ? ", " + sufijo : ""}`;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 60;
  let y = margin;

  function text(content: string, options: { size?: number; bold?: boolean; align?: "left" | "center" | "justify"; spaceAfter?: number } = {}) {
    const { size = 11, bold = false, align = "justify", spaceAfter = 10 } = options;
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const maxWidth = pageWidth - margin * 2;
    const lines = doc.splitTextToSize(content, maxWidth);
    if (y + lines.length * (size * 1.2) > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, align === "center" ? pageWidth / 2 : margin, y, { align, maxWidth });
    y += lines.length * (size * 1.2) + spaceAfter;
  }

  text(`ACTA CONSTITUTIVA Y ESTATUTOS SOCIALES DE ${razonSocial.toUpperCase()}`, { size: 13, bold: true, align: "center", spaceAfter: 20 });

  const sociosNames = company.socios?.map((s: { nombre: string; cedula: string }) => `${s.nombre}, titular de la cédula de identidad N° ${s.cedula}`).join("; ") || "";

  text(`Nosotros, ${sociosNames}, venezolanos, mayores de edad, civilmente hábiles, domiciliados en la República Bolivariana de Venezuela, por medio del presente documento declaramos: Que hemos convenido constituir, como en efecto constituimos, una ${info?.nombre}, la cual se regirá por las cláusulas siguientes:`, { spaceAfter: 16 });

  text("TÍTULO I — DENOMINACIÓN, DOMICILIO, OBJETO Y DURACIÓN", { bold: true, align: "center", spaceAfter: 14 });

  text(`CLÁUSULA PRIMERA: La sociedad se denominará "${razonSocial}".`, { spaceAfter: 10 });
  text(`CLÁUSULA SEGUNDA: El domicilio de la sociedad será: ${company.domicilio}, pudiendo establecer sucursales, agencias o representaciones en cualquier lugar del territorio nacional o del extranjero.`, { spaceAfter: 10 });
  text(`CLÁUSULA TERCERA: El objeto social de la compañía será: ${company.objeto_social}. Asimismo, podrá realizar cualquier actividad lícita de comercio relacionada directa o indirectamente con el objeto principal.`, { spaceAfter: 10 });
  text(`CLÁUSULA CUARTA: La duración de la sociedad será de cincuenta (50) años, contados a partir de la fecha de inscripción en el Registro Mercantil correspondiente, pudiendo ser prorrogada por decisión de la Asamblea de Socios.`, { spaceAfter: 16 });

  text("TÍTULO II — CAPITAL SOCIAL", { bold: true, align: "center", spaceAfter: 14 });
  text(`CLÁUSULA QUINTA: El capital social de la compañía es la cantidad de ${Number(company.capital_social).toLocaleString("es-VE")} dólares de los Estados Unidos de América (USD $${Number(company.capital_social).toLocaleString()}), o su equivalente en bolívares según la tasa de cambio oficial del Banco Central de Venezuela.`, { spaceAfter: 10 });

  if (company.socios && company.socios.length > 0) {
    text(`CLÁUSULA SEXTA: El capital social ha sido suscrito y pagado en su totalidad de la siguiente manera:`, { spaceAfter: 8 });
    company.socios.forEach((s: { nombre: string; porcentaje: number; cedula: string }) => {
      const monto = (Number(company.capital_social) * s.porcentaje) / 100;
      text(`• ${s.nombre} (C.I. ${s.cedula}): ${s.porcentaje}% equivalente a USD $${monto.toLocaleString()}.`, { spaceAfter: 5 });
    });
    y += 10;
  }

  text("TÍTULO III — ADMINISTRACIÓN", { bold: true, align: "center", spaceAfter: 14 });
  text(`CLÁUSULA SÉPTIMA: La dirección y administración de la compañía estará a cargo de una Junta Directiva integrada por los socios mencionados, quienes tendrán las más amplias facultades de administración y disposición, incluyendo la representación legal de la sociedad frente a terceros y entes públicos.`, { spaceAfter: 10 });
  text(`CLÁUSULA OCTAVA: El ejercicio económico de la sociedad coincidirá con el año calendario (${company.ejercicio_fiscal === "enero-diciembre" ? "1 de enero al 31 de diciembre" : company.ejercicio_fiscal}).`, { spaceAfter: 16 });

  text("TÍTULO IV — DISPOSICIONES FINALES", { bold: true, align: "center", spaceAfter: 14 });
  text(`CLÁUSULA NOVENA: Declaramos bajo juramento que los fondos aportados al capital social provienen de actividades lícitas, de conformidad con la Ley Orgánica Contra la Delincuencia Organizada y Financiamiento al Terrorismo (LOCDOFT).`, { spaceAfter: 10 });
  text(`CLÁUSULA DÉCIMA: En todo lo no previsto en este documento, se aplicarán las disposiciones del Código de Comercio y demás leyes aplicables de la República Bolivariana de Venezuela.`, { spaceAfter: 30 });

  text(`Fecha: ${new Date().toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" })}`, { spaceAfter: 30 });
  text("_____________________________", { align: "center", spaceAfter: 0 });
  text("Firmas de los socios", { align: "center", size: 9, spaceAfter: 20 });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Generado por Arranca • arranca.app", pageWidth / 2, doc.internal.pageSize.getHeight() - 30, { align: "center" });

  const pdfBytes = doc.output("arraybuffer");
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="acta-${company.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
