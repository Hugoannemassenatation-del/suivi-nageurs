import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iyiarwofwnzhotthspib.supabase.co";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Non authentifié" });

  const { email, redirectTo } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email requis" });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(500).json({ error: "Clé serveur manquante. Vérifiez la configuration Vercel." });
  }

  const adminClient = createClient(SUPABASE_URL, serviceKey);

  // Vérifie que l'appelant est bien connecté et administrateur avant d'envoyer quoi que ce soit.
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Session invalide" });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Réservé à l'administrateur du club" });
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectTo || undefined,
  });

  if (inviteError) {
    return res.status(500).json({ error: inviteError.message });
  }

  return res.status(200).json({ success: true });
}
