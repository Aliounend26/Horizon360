# Horizon360 — Gestion intelligente de votre parc automobile

Plateforme SaaS de gestion de location de véhicules (MERN + TypeScript).

## Structure

```
/server   API Express + TypeScript + MongoDB (Mongoose)
/client   Application React + Vite + TypeScript + Tailwind
```

## Démarrage rapide

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

- Sans `MONGODB_URI` configuré dans `.env`, le serveur démarre automatiquement une base
  MongoDB en mémoire (pratique pour tester, mais **les données sont perdues au redémarrage**).
- Pour une base persistante : installez MongoDB localement ou créez un cluster gratuit sur
  MongoDB Atlas, puis renseignez `MONGODB_URI` dans `server/.env`.
- Au premier démarrage sur une base vide, l'application seed automatiquement des données de
  démonstration (parcs, véhicules, zones, tarifs, clients, locations, dépenses, entretiens,
  comptes utilisateurs).
- API disponible sur `http://localhost:5000/api`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Application disponible sur `http://localhost:5173` (le dev server proxy `/api` vers le port 5000).

## Comptes de démonstration

| Rôle        | Identifiant  | Mot de passe    |
|-------------|--------------|-----------------|
| SuperAdmin  | `superadmin` | `SuperAdmin123!`|
| Admin       | `admin`      | `Admin123!`     |
| Utilisateur | `user`       | `User123!`      |

## Fonctionnalités livrées

- Authentification JWT (access + refresh token), rôles SuperAdmin / Admin / Utilisateur,
  changement de mot de passe obligatoire à la création d'un compte.
- Parcs, véhicules (fiche complète, photo, statut), zones, tarification par véhicule et par zone.
- Locations : vérification de disponibilité en temps réel, calcul automatique du tarif
  (jours × tarif de zone − réduction + frais), suivi des paiements et du reste à payer,
  cycle de statuts (réservation → confirmée → en cours → terminée/annulée), suivi kilométrique.
- Clients avec historique de locations et montant total dépensé.
- Dépenses par catégorie, avec justificatifs.
- Entretiens basés sur kilométrage et/ou date, avec statuts calculés automatiquement
  (à venir / bientôt dû / dû / en retard) et notifications générées automatiquement.
- Notifications : entretien, assurance, contrôle technique, locations en retard.
- Tableau de bord avec KPI, graphiques (CA vs dépenses, performance véhicules, dépenses par
  catégorie), jauges (utilisation, disponibilité, entretien), filtrable par période/parc.
- Calendrier des locations.
- Rapports : export Excel multi-feuilles (résumé, locations, dépenses, véhicules, rentabilité)
  et reçu de location PDF.
- Journal d'activité (audit trail) pour les actions sensibles.
- Paramètres d'entreprise (SuperAdmin uniquement).

## Notes techniques

- Toutes les statistiques du dashboard sont calculées en temps réel depuis MongoDB
  (aucune donnée codée en dur côté frontend).
- Le fichier Excel `Gestion Vehicules HC.xlsx` a servi de référence métier pour la structure
  des locations, dépenses et catégories, mais le modèle de données a été considérablement
  étendu (multi-parcs, tarification par zone, entretiens, rôles, etc.).
