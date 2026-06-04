export interface ExecutiveTypes {
  image: string;
  name: string;
  office: string;
  email: string;
  phone: string;
  church: string;
  start_year: number;
  end_year?: number;
  status: "active" | "inactive" | "completed";
  password: string;
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
  name?: string;
  description?: string;
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
