export type Role = "doctor" | "patient" | "pharmacy" | "admin";

export type UserBrief = {
  id: string;
  fullname: string;
  role: Role;
};

export type PrescriptionItem = {
  id?: number;
  drug_code: string;
  name: string;
  quantity: number;
  dosage?: string | null;
};

export type Prescription = {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "DRAFT" | "ISSUED" | "DISPENSED";
  created_at: string;
  notes?: string | null;
  items?: PrescriptionItem[];
  // opcionales de backend:
  patient_name?: string;
};
