# Arranca

One-stop shop para constituir y operar empresas en Venezuela.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend / DB**: Supabase (Postgres + Auth + RLS)
- **Deploy**: Render
- **PDF**: jsPDF

## Setup local

```bash
npm install
cp .env.example .env.local
# Llenar las variables de Supabase
npm run dev
```

## Setup Supabase

1. Crear nuevo proyecto en https://supabase.com
2. Ir al SQL Editor y ejecutar `supabase/schema.sql`
3. Copiar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
4. Agregarlos al `.env.local` y a Render

## Deploy en Render

1. Nuevo Web Service, conectar al repo `MaxAICZ/arranca`
2. Runtime: Node 20
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Flow del producto

1. **Descubrimiento** (4 preguntas)
2. **Recomendación** de tipo de empresa
3. **Wizard** guiado (1 pregunta por pantalla)
4. **Acta Constitutiva** PDF generada
5. **Constitución** tracker
6. **Post-constitución** (RIF, banco, libros, parafiscales)
7. **Licencias** por tipo de negocio
8. **Obligaciones fiscales** recurrentes
