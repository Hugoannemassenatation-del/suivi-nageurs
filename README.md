# Suivi Nageurs — Étape 2 (application complète)

Cette mise à jour ajoute tous les écrans à la version connectée à Supabase :
Nageurs, Séances, Présences (+ RPE), Forme du matin, VMA & Allures, Performances,
Calendrier, Communication, Fiche nageur, et le panneau Comptes & accès (admin).

## Comment mettre à jour votre dépôt GitHub

Le plus simple et le plus sûr : **remplacer entièrement le dossier `src`**.

1. Sur GitHub, ouvrez votre dépôt `suivi-nageurs`
2. Cliquez sur le dossier **`src`**
3. Pour chaque fichier à l'intérieur (`App.jsx`, `main.jsx`, et le dossier `lib`),
   supprimez-les : ouvrez le fichier, cliquez l'icône poubelle en haut à droite,
   puis "Commit changes". Répétez pour tout ce qu'il y a dans `src`.
4. Une fois `src` complètement vide, retournez à la racine du dépôt
5. Cliquez **"Add file" → "Upload files"**
6. Sur votre ordinateur, dézippez ce nouveau fichier `suivi-nageurs-v2.zip`
7. **Glissez le dossier `src` complet** (pas son contenu, le dossier lui-même)
   dans la zone d'upload GitHub — cela recrée automatiquement toute la structure
   avec ses sous-dossiers `lib` et `views`
8. En bas de page, cliquez **"Commit changes"**

Vercel redéploiera automatiquement votre site dans la minute qui suit (aucune
action nécessaire de votre part sur Vercel).

## Vérification après déploiement

1. Ouvrez votre site, connectez-vous
2. Vous devriez voir tous les onglets dans le menu de gauche selon votre rôle
3. Testez la création d'une séance, l'appel de présence, un chrono, un test VMA
