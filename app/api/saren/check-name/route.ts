import { NextResponse } from "next/server";

// Simplified availability check — pattern-based heuristics + suggestions.
// Real-time scraping of saren.gob.ve is blocked by their captcha/auth and would
// need a headless browser with session cookies. We recommend this simplified
// check + final manual verification on SAREN.
export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return NextResponse.json({ ok: false, error: "Nombre muy corto" }, { status: 400 });
  }

  const normalized = name.trim().toLowerCase();
  const isProblematic =
    /(banco|bank|seguros|insurance|venezuela|bolivar|caracas|miranda|zulia)\b/i.test(name) ||
    /^(el|la|los|las)\s/.test(normalized);

  const commonWords = ["solutions", "services", "ventures", "group", "company", "empresa", "corp", "tech"];
  const suggestions = commonWords.slice(0, 3).map((w) => `${name} ${w.charAt(0).toUpperCase() + w.slice(1)}`);

  return NextResponse.json({
    ok: true,
    name,
    reserved: false,
    warnings: isProblematic
      ? ["Este nombre contiene palabras que SAREN suele restringir (bancos, geografías, genéricos). Podría requerir aprobación adicional."]
      : [],
    suggestions: isProblematic ? suggestions : [],
    verifyUrl: `https://www.saren.gob.ve/consulta-de-denominaciones/?nombre=${encodeURIComponent(name)}`,
    message: isProblematic
      ? "Tu nombre tiene palabras que podrían estar restringidas. Verifica en SAREN."
      : "El nombre se ve bien. Confirma la disponibilidad final en SAREN.",
  });
}
