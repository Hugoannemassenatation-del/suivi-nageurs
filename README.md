# Suivi Nageurs — Étape 1 (fondations)

## Ce qu'il y a dans ce dossier
Une application web (React + Vite) déjà connectée à votre base Supabase, avec :
- connexion par email (lien magique, sans mot de passe)
- création du tout premier compte administrateur (vous)
- panneau admin pour préparer des invitations coach / nageur
- structure prête à recevoir les autres écrans à l'étape 2

## Avant de déployer

1. Dans Supabase → **SQL Editor**, exécutez dans l'ordre :
   - `schema-supabase.sql` (déjà fait si vous l'avez lancé précédemment)
   - `schema-part2-securite.sql` (nouveau — sécurité + invitations)

2. Vérifiez qu'aucune erreur n'apparaît après chaque script.

## Déployer sur Vercel

1. Créez un nouveau dépôt sur **github.com** (bouton vert "New"), nommez-le `suivi-nageurs`.
2. Sur la page du dépôt vide, cliquez **"uploading an existing file"** et glissez-déposez
   tout le contenu de ce dossier (en gardant la structure des sous-dossiers `src/`).
3. Sur **vercel.com**, cliquez **"Add New… → Project"**, choisissez le dépôt `suivi-nageurs`.
4. Vercel détecte automatiquement "Vite" — laissez les réglages par défaut, cliquez **"Deploy"**.
5. Après 1-2 minutes, vous obtenez un lien du type `suivi-nageurs.vercel.app` — ouvrez-le.

## Premier lancement

1. Ouvrez le lien Vercel, entrez votre email, cliquez "Recevoir mon lien de connexion".
2. Ouvrez l'email reçu (vérifiez les spams si besoin), cliquez le lien.
3. L'application vous propose de devenir administrateur — acceptez.
4. Vous êtes maintenant admin. Testez la création d'un coach ou d'un nageur.
5. **Étape obligatoire pour chaque nouvelle personne** : après l'avoir "préparée" dans
   l'app, allez dans Supabase → **Authentication → Users → Invite user**, et entrez le
   même email. C'est cet envoi Supabase qui déclenche le vrai email automatique.

## Ensuite

Une fois que ce socle fonctionne bien pour vous, on passe à l'étape 2 : je reporte tous
les écrans (séances, présences, performances, VMA, forme du matin, calendrier,
communication) dans cette version connectée à Supabase.

Pour connecter `suivi-nageurs.fr`, ce sera dans Vercel → votre projet → **Settings → Domains**,
une fois l'étape 2 terminée.
