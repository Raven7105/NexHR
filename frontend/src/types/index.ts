

export interface Company {
    id: string;
    nom: string;
    slug: string;
    email_contact: string;
    plan_abonnement: "essai" | "starter" | "pro";
    format_matricule: "departement" | "entreprise";
    prefixe_matricule: string;
    actif: boolean;
    date_creation: string;
}
export interface EmployeeProfile {
    id: string;
    matricule: string;
    poste: string;
    department: string | null;
    manager: string | null;
}

export interface User {
    id: string;
    email: string;
    role: "superadmin" | "admin_rh" | "manager" | "employe";
    company: string | null;
    company_nom: string | null;
    employee_profile: EmployeeProfile | null;
}

export interface Department {
    id: string;
    nom: string;
    code: string;
    description: string;
    company: string;
    manager: string | null;
}

export interface Employee {
    id: string;
    nom_complet: string;
    email: string;
    department_nom: string | null;
    matricule: string;
    poste: string;
    type_contrat: "cdi" | "cdd" | "stage" | "freelance";
    salaire_de_base: string;
    nombre_personnes_charge: number;
    date_embauche: string;
    date_naissance: string | null;
    phone_number: string;
    date_fin_contrat: string | null;
    statut: "actif" | "inactif" | "suspendu" | "en_conge";
    user: string;
    company: string;
    department: string | null;
    manager: string | null;
    is_active: boolean;
    deleted_at: string | null;
}
export type CreateEmployeeInput = Omit<Employee, "id" | "matricule" | "is_active" | "deleted_at">;

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface CreateEmployeeWithUserInput {
  email: string;
  password: string;
  role: "superadmin" | "admin_rh" | "manager" | "employe";
  first_name?: string;
  last_name?: string;
  poste: string;
  department?: string | null;
  manager?: string | null;
  type_contrat: "cdi" | "cdd" | "stage" | "freelance";
  date_embauche: string;
  date_naissance?: string | null;
  phone_number?: string;
  date_fin_contrat?: string | null;
  salaire_de_base: string;
  nombre_personnes_charge?: number;
}
export interface LeaveType {
    id: string;
    nom: string;
    jours_par_an: number;
    couleur: string;
    company: string;
}

export interface LeaveBalance {
    id: string;
    annee: number;
    jours_alloues: string;
    jours_utilises: string;
    employee: string;
    leave_type: string;
}

export interface LeaveRequest {
    id: string;
    date_debut: string;
    date_fin: string;
    nombre_jours: string;
    motif: string;
    statut: "en_attente" | "approuve" | "rejete" | "annule";
    employee: string;
    leave_type: string;
    validateur: string | null;
    date_validation: string | null;
    date_creation: string;
    commentaire_validateur: string;
}

export interface Holiday {
    id: string;
    nom: string;
    date: string;
    recurrent: boolean;
    company: string;
}

export interface Attendance {
    id: string;
    date: string;
    heure_arrivee: string | null;
    heure_depart: string | null;
    statut: "present" | "absent" | "retard" | "en_conge" | "jour_ferie";
    methode_pointage: "manual" | "biometric" | "qr";
    employee: string;
}

export interface Payslip {
    id: string;
    mois: number;
    annee: number;
    salaire_brut: string;
    salaire_net: string;
    statut: "brouillon" | "valide" | "paye";
    employee: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}