import { createClient } from "@supabase/supabase-js";

// Ces deux valeurs sont publiques par conception (pas des secrets) :
// la vraie protection des données se fait via les règles RLS côté base.
const SUPABASE_URL = "https://iyiarwofwnzhotthspib.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cUb447fBWO41FK4fJYlQmg_rnX-dWfQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
