import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iyiarwofwnzhotthspib.supabase.co";
const SITE_URL = "https://suivi-nageurs.fr";
const FROM = "Suivi Nageurs <notifications@suivi-nageurs.fr>";

async function emailsOfProfiles(adminClient, profiles) {
  const emails = [];
  for (const p of profiles || []) {
    const { data } = await adminClient.auth.admin.getUserById(p.id);
    if (data?.user?.email) emails.push(data.user.email);
  }
  return [...new Set(emails)];
}

async function sendEmail(to, subject, html) {
  if (!to || to.length === 0) return;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Clé RESEND_API_KEY manquante côté serveur.");
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error("Échec de l'envoi Resend : " + t);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Non authentifié" });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: "Clé serveur manquante." });
  const adminClient = createClient(SUPABASE_URL, serviceKey);

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: "Session invalide" });

  const { type, swimmerId, auteur, texte, jourInfo, notifyStaff } = req.body || {};

  try {
    if (type === "message") {
      let emails = [];
      if (swimmerId) {
        const { data: fam } = await adminClient.from("profiles").select("id").eq("role", "famille").eq("swimmer_id", swimmerId);
        emails = emails.concat(await emailsOfProfiles(adminClient, fam));
      } else if (!notifyStaff) {
        const { data: fam } = await adminClient.from("profiles").select("id").eq("role", "famille");
        emails = emails.concat(await emailsOfProfiles(adminClient, fam));
      }
      if (notifyStaff) {
        const { data: staff } = await adminClient.from("profiles").select("id").in("role", ["admin", "coach"]);
        emails = emails.concat(await emailsOfProfiles(adminClient, staff));
      }
      emails = [...new Set(emails)];
      await sendEmail(
        emails,
        `Nouveau message de ${auteur || "un membre du club"}`,
        `<p><strong>${auteur || "Un membre du club"}</strong> a écrit sur Suivi Nageurs :</p><blockquote style="border-left:3px solid #ccc;padding-left:10px;color:#333;">${(texte || "").replace(/\n/g, "<br/>")}</blockquote><p><a href="${SITE_URL}">Voir sur Suivi Nageurs</a></p>`
      );
    }

    if (type === "absence") {
      const { data: staff } = await adminClient.from("profiles").select("id").in("role", ["admin", "coach"]);
      const emails = await emailsOfProfiles(adminClient, staff);
      await sendEmail(
        emails,
        `Absence signalée — ${auteur || "un nageur"}`,
        `<p><strong>${auteur || "Un nageur"}</strong> a signalé une absence pour l'entraînement du <strong>${jourInfo || ""}</strong>.</p>${texte ? `<p>Motif indiqué : ${texte}</p>` : "<p>Aucun motif indiqué.</p>"}<p><a href="${SITE_URL}">Voir sur Suivi Nageurs</a></p>`
      );
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
