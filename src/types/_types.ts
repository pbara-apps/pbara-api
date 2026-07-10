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
