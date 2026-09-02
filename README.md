# NexHR — Système de Gestion du Capital Humain & Ressources Humaines

[![Statut de Build](https://img.shields.io/badge/Build-Succès-brightgreen?style=flat-square)](#-tests--assurance-qualité)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_%7C_TypeScript-61DAFB?style=flat-square&logo=react)](#-stack-technique)
[![Backend](https://img.shields.io/badge/Backend-Django_5_%7C_DRF-092E20?style=flat-square&logo=django)](#-stack-technique)
[![Styles](https://img.shields.io/badge/Style-Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss)](#-stack-technique)
[![Licence](https://img.shields.io/badge/Licence-Propriétaire-blue?style=flat-square)](#-licence--propriété-intellectuelle)

**NexHR** est une plateforme SaaS moderne de gestion du capital humain conçue pour automatiser les processus RH, le suivi des congés et des soldes, le pointage quotidien des présences, le calcul de la paie conforme aux cotisations sociales (CNSS, INAM, IRPP), l'organigramme hiérarchique et le calendrier d'équipe.

---

## 🌟 Présentation Exécutive

NexHR réunit la gestion administrative et le libre-service employé au sein d'une interface web réactive et sécurisée. Conçue pour offrir haute performance et conformité, la plateforme automatise les flux de travail complexes tout en garantissant un contrôle d'accès strict basé sur les rôles (RBAC).

---

## 🚀 Modules & Fonctionnalités Clés

### 👥 1. Annuaire Employés & Structure
* **Gestion des Données de Référence** : Centralisation des profils, contrats, salaires de base et contacts d'urgence.
* **Génération Intelligente des Matricules** : Format configurable (`NEX-001` ou préfixe départemental `IT-001`).
* **Hiérarchie Départementale** : Regroupement par équipe sous la responsabilité directe d'un manager.

### 🌴 2. Gestion des Congés & Soldes Automatisés
* **Circuit de Validation** : Demandes en ligne traitées en temps réel par les managers et les RH.
* **Décompte en Temps Réel** : Déduction automatique des soldes par type de congé (Payé, Maladie, Maternité, Sans solde).
* **Contrôles RH** : Outils d'ajustement direct et de réinitialisation annuelle des soldes.

### ⏱️ 3. Présences & Pointage Quotidien
* **Pointage Rapide Arrivée/Départ** : Widget quotidien pour les employés en 1 clic.
* **Registre Général des Présences** : Suivi des statuts (*Présent*, *En retard*, *Absent*, *En congé*, *Jour Férié*).
* **Synchronisation Automatique** : Les congés approuvés alimentent automatiquement le registre de présence.

### 💰 4. Moteur de Paie & Conformité Fiscale
* **Génération Automatique des Bulletins** : Création mensuelle des fiches de paie.
* **Calcul des Cotisations & Impôts** : Calcul en temps réel de la CNSS, de l'INAM et de l'IRPP.
* **Composants Salariaux Personnalisables** : Primes, indemnités exonérées et retenues spécifiques.

### 🌳 5. Organigramme Hiérarchique & Calendrier
* **Arbre Interactif de Subordination** : Représentation visuelle de la chaîne de commandement (*Direction $\rightarrow$ Managers $\rightarrow$ Équipes*).
* **Calendrier d'Équipe Centralisé** : Vue mensuelle regroupant les congés validés des collègues et les jours fériés officiels.

---

## 🛠️ Stack Technique

| Couche | Technologie | Bibliothèques & Spécifications |
| :--- | :--- | :--- |
| **Frontend** | React 18 (Vite) | TypeScript, Tailwind CSS, TanStack React Query, Lucide Icons, Sonner |
| **Backend** | Python 3.10+, Django 5 | Django REST Framework (DRF), Django SimpleJWT, Django Filter |
| **Base de données** | SQLite (Dev) / PostgreSQL (Prod) | ORM Django avec intégrité transactionnelle stricte |
| **Sécurité** | JWT (JSON Web Tokens) | Intercepteur automatique de rafraîchissement des jetons 401 & RBAC |

---

## 📁 Architecture du Projet

```
NexHR/
├── backend/
│   ├── apps/
│   │   ├── users/        # Modèle Utilisateur, Authentification JWT, /me/
│   │   ├── companies/    # Paramètres Société & Configuration SaaS
│   │   ├── employees/    # Profils Employés & Hiérarchie des Départements
│   │   ├── leaves/       # Types de Congés, Soldes & Validation
│   │   ├── attendance/   # Registre de Présence, Pointages & Jours Fériés
│   │   └── payroll/      # Réglages de Paie, Bulletins & Composants Salariaux
│   ├── config/           # Configuration globale Django & Routage URLs
│   └── manage.py
│
└── frontend/
    ├── src/
    │   ├── api/          # Instance Axios avec rafraîchissement automatique des jetons
    │   ├── components/   # Design System UI & Composants de Layout
    │   ├── context/      # Context d'Authentification React
    │   ├── hooks/        # Hooks personnalisés TanStack React Query
    │   ├── pages/        # Vues de l'application (Dashboard, Congés, Paie, etc.)
    │   └── types/        # Interfaces et Types TypeScript
    ├── index.html
    └── package.json
```

---

## 🔐 Matrice des Rôles & Permissions (RBAC)

| Fonctionnalité / Permission | SuperAdmin / Responsable RH | Manager d'Équipe | Employé |
| :--- | :---: | :---: | :---: |
| **Gérer les Fiches Employés** | ✅ Accès Total | 👁️ Équipe Uniquement | 👁️ Mon Profil |
| **Ajuster les Soldes de Congés** | ✅ Accès Total | ❌ Restreint | ❌ Restreint |
| **Valider les Demandes de Congés** | ✅ Accès Total | ✅ Équipe Directe | ❌ Restreint |
| **Soumettre une Demande de Congé** | ✅ Accès Total | ✅ Accès Total | ✅ Personnel |
| **Pointage Quotidien Arrivée/Départ** | ✅ Accès Total | ✅ Accès Total | ✅ Personnel |
| **Consulter le Registre de Présence** | ✅ Accès Total | 👁️ Équipe Uniquement | 👁️ Mes Pointages |
| **Traiter la Paie & Bulletins** | ✅ Accès Total | ❌ Restreint | 👁️ Mon Bulletin |
| **Paramètres de l'Entreprise** | ✅ Accès Total | ❌ Restreint | ❌ Restreint |

---

## 🚦 Guide de Démarrage Rapide

### Prérequis
* **Python** 3.10+
* **Node.js** 18+ & **npm**

---

### Installation du Backend (Django)

1. Accéder au dossier backend :
   ```bash
   cd backend
   ```

2. Créer et activer un environnement virtuel Python :
   ```bash
   python -m venv env
   source env/bin/activate  # Sur Windows: env\Scripts\activate
   ```

3. Installer les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Appliquer les migrations de base de données :
   ```bash
   python manage.py migrate
   ```

5. Lancer le serveur de développement Django :
   ```bash
   python manage.py runserver
   ```
   > Endpoint API Backend : `http://localhost:8000/api/`

---

### Installation du Frontend (React)

1. Accéder au dossier frontend :
   ```bash
   cd frontend
   ```

2. Installer les dépendances JavaScript :
   ```bash
   npm install
   ```

3. Lancer le serveur de développement Vite :
   ```bash
   npm run dev
   ```
   > Interface application Web : `http://localhost:5173/`

---

## 🧪 Tests & Assurance Qualité

### Exécuter la suite de tests Backend
```bash
cd backend
python manage.py test
```

### Vérifier le typage TypeScript Frontend
```bash
cd frontend
npx tsc -b
```

---

## 📄 Licence & Propriété Intellectuelle

Copyright © 2026 **NexHR Systems**. Tous droits réservés. Logiciel propriétaire.
