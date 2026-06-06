import { createClient } from "@supabase/supabase-js";

// Use VITE environment variables if available, otherwise fall back to the provided credentials
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://mlznlcovljuqcseircyc.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_eacV_x0HsYoKXYAkVXgPwg_1fZmQClz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
