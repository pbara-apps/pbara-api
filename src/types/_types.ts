export interface ExecutiveTypes {
  image: string;
  name: string;
  office: string;
  email: string;
  phone: string;
  church: string;
  rank_id?: string | null;
  start_year: number;
  end_year?: number;
  status: "active" | "inactive" | "completed";
  password: string;
  role?: "super_admin" | "admin" | "editor" | "viewer";
}

export interface ChurchTypes {
  name: string;
  address?: string;
  chapter: string;
  counsellor?: string;
  status: "active" | "inactive";
  image?: string;
}

export interface PatronTypes {
  name: string;
  role: string;
  quote: string;
  description?: string | null;
  image?: string | null;
  status: "active" | "inactive";
  sort_order?: number;
}

export interface OfficeTypes {
  _id: string;
  name?: string;
  description?: string;
}

export interface RankTypes {
  name: string;
  description: string;
  category: string;
  image?: string | null;
}

export interface DirectorDeskTypes {
  executive_id: string;
  title: string;
  description: string;
  current: boolean;
}
export interface LoginTypes {
  email: string;
  password: string;
}

export interface BankDetailsTypes {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface RegistrationProgramTypes {
  title: string;
  slug?: string;
  programCode?: string | null;
  category: string;
  description?: string | null;
  flyerImageUrl?: string | null;
  amount: number;
  bankDetails: BankDetailsTypes;
  registrationMode: "single" | "bulk" | "both";
  registrationDeadline?: string | Date | null;
  isActive?: boolean;
  termsAndConditions?: string | null;
}

export interface RegistrationEntryTypes {
  name: string;
  rank: string;
  church: string;
  registrationCode?: string;
}

export interface RegistrationTypes {
  programId: string;
  registrantName: string;
  registrantPhone: string;
  proofOfPaymentUrl: string;
  registrationType: "single" | "bulk";
  entries: RegistrationEntryTypes[];
  status?: "pending" | "verified" | "rejected";
  adminNote?: string | null;
}
