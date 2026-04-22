import { createClient } from "@supabase/supabase-js";

// Colocando as chaves diretamente para a Vercel nao quebrar o build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bekjfcjlywgrsfqkakfn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_GdYDi1FKgtsdbb3HIHxpIA_Jm2y1HFA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

type SupabaseResult<T = unknown> = {
  data: T | null;
  error: any;
};

export function isExpiredJwtError(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.code === "PGRST303" || message.includes("jwt expired");
}

export async function recoverExpiredSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    await supabase.auth.signOut();
    return null;
  }

  return data.session;
}

export async function withFreshSession<T>(
  operation: () => PromiseLike<SupabaseResult<T>>,
): Promise<SupabaseResult<T>> {
  const firstTry = await operation();

  if (!isExpiredJwtError(firstTry.error)) {
    return firstTry;
  }

  const session = await recoverExpiredSession();
  if (!session) {
    return firstTry;
  }

  return operation();
}
