import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em apps/web/.env.local",
  );
}

// Usado só dentro dos Route Handlers (server-side). A chave é a publishable
// (anon); as regras de negócio (total calculado no servidor, estoque atômico)
// são garantidas pelas policies de RLS e pela função finalizar_venda no
// Postgres — veja supabase/finalizar_venda.sql.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
