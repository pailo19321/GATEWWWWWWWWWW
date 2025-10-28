const API_URL = '/api';

interface AuthResponse {
  user?: {
    id: string;
    email: string;
  };
  error?: string;
}

interface ProfileData {
  business_type: string;
  document_number: string;
  business_name: string;
  invoice_name: string;
  average_revenue?: number;
  average_ticket?: number;
  company_website?: string;
  products_sold?: string;
  sells_physical_products: boolean;
  representative_name: string;
  representative_cpf: string;
  representative_email: string;
  representative_phone: string;
  date_of_birth: string;
  mother_name: string;
  postal_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
  document_frontal_url?: string;
  document_back_url?: string;
  document_selfie_url?: string;
  document_contract_url?: string;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    },
    credentials: 'same-origin',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

export const auth = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signOut() {
    return fetchAPI('/auth/logout', { method: 'POST' });
  },

  async getUser(): Promise<AuthResponse> {
    return fetchAPI('/auth/user');
  },
};

export const companyProfiles = {
  async get() {
    return fetchAPI('/company/profile');
  },

  async create(data: ProfileData) {
    return fetchAPI('/company/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(data: Partial<ProfileData>) {
    return fetchAPI('/company/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export const api = {
  auth,
  companyProfiles,
};
