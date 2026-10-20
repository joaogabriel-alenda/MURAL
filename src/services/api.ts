import type {
  User,
  Recommendation,
  CategoryType,
  CreateRecommendationInput,
  UpdateRecommendationInput,
  StatsResponse,
} from '../types.ts';

const TOKEN_KEY = 'mural_auth_token';
const USER_KEY = 'mural_user';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Erro HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Autenticação
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async register(
    email: string,
    password: string,
    displayName: string,
    avatarUrl?: string
  ): Promise<{ user: User; token: string }> {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, avatarUrl }),
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async loginDemo(email?: string): Promise<{ user: User; token: string }> {
    const data = await fetchWithAuth('/api/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async getMe(): Promise<User> {
    const data = await fetchWithAuth('/api/auth/me');
    authStorage.setUser(data.user);
    return data.user;
  },

  logout() {
    authStorage.clear();
  },

  // Recomendações
  async getRecommendations(params: {
    category?: CategoryType | 'all';
    search?: string;
    sortBy?: 'recent' | 'rating' | 'likes';
    userId?: string;
  }): Promise<Recommendation[]> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') {
      query.set('category', params.category);
    }
    if (params.search) {
      query.set('search', params.search);
    }
    if (params.sortBy) {
      query.set('sortBy', params.sortBy);
    }
    if (params.userId) {
      query.set('userId', params.userId);
    }

    const data = await fetchWithAuth(`/api/recommendations?${query.toString()}`);
    return data.data || [];
  },

  async getRecommendation(id: string): Promise<Recommendation> {
    const data = await fetchWithAuth(`/api/recommendations/${id}`);
    return data.data;
  },

  async createRecommendation(input: CreateRecommendationInput): Promise<Recommendation> {
    const data = await fetchWithAuth('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.data;
  },

  async updateRecommendation(
    id: string,
    input: UpdateRecommendationInput
  ): Promise<Recommendation> {
    const data = await fetchWithAuth(`/api/recommendations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return data.data;
  },

  async deleteRecommendation(id: string): Promise<boolean> {
    await fetchWithAuth(`/api/recommendations/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  async bulkDeleteRecommendations(ids: string[]): Promise<number> {
    const res = await fetchWithAuth('/api/recommendations/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    return res.count || ids.length;
  },

  async duplicateRecommendation(id: string): Promise<Recommendation> {
    const res = await fetchWithAuth(`/api/recommendations/${id}/duplicate`, {
      method: 'POST',
    });
    return res.data;
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    return await fetchWithAuth(`/api/recommendations/${id}/like`, {
      method: 'POST',
    });
  },

  // Estatísticas e Schemas
  async getStats(): Promise<StatsResponse> {
    return await fetchWithAuth('/api/stats');
  },

  async resetSeed(): Promise<void> {
    await fetchWithAuth('/api/database/seed', { method: 'POST' });
  },

  async getSchemas(): Promise<{ prisma: string; sql: string; supabase?: string }> {
    return await fetchWithAuth('/api/database/schemas');
  },
};
