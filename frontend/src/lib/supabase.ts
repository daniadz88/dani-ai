// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// Helper: login Google dengan redirect ke origin yang sedang aktif
// Jadi di localhost → redirect ke localhost, di Vercel → redirect ke Vercel
export function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin,
        },
    });
}