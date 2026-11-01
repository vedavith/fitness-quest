import type { Account, DayLog, Profile } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(apiUrl: string, path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const firstError = body?.errors ? Object.values(body.errors as Record<string, string[]>)[0]?.[0] : undefined;
    throw new ApiError(res.status, firstError ?? body?.message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

type AuthResponse = { token: string; user: { name: string; email: string } };

export const api = {
  register: (apiUrl: string, name: string, email: string, password: string) =>
    request<AuthResponse>(apiUrl, '/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (apiUrl: string, email: string, password: string) =>
    request<AuthResponse>(apiUrl, '/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: (a: Account) => request(a.apiUrl, '/logout', { method: 'POST', token: a.token }),

  saveProfile: (a: Account, profile: Profile, timezone: string) =>
    request(a.apiUrl, '/profile', { method: 'PUT', token: a.token, body: JSON.stringify({ ...profile, timezone }) }),

  saveDay: (a: Account, log: DayLog) => {
    const { xp: _xp, finished_at: _f, plan_day, ...fields } = log;
    return request<DayLog & { stale?: boolean }>(a.apiUrl, `/days/${plan_day}`, {
      method: 'PUT',
      token: a.token,
      body: JSON.stringify(fields),
    });
  },

  finishDay: (a: Account, planDay: number) =>
    request<{ day: DayLog; total_xp: number; streak: number; already_finished: boolean }>(
      a.apiUrl,
      `/days/${planDay}/finish`,
      { method: 'POST', token: a.token },
    ),

  checkIn: (a: Account, type: 'weight' | 'waist', value: number) =>
    request(a.apiUrl, '/check-ins', { method: 'POST', token: a.token, body: JSON.stringify({ type, value }) }),

  days: (a: Account) => request<DayLog[]>(a.apiUrl, '/days', { token: a.token }),

  summary: (a: Account) => request<{ total_xp: number; current_streak: number }>(a.apiUrl, '/summary', { token: a.token }),
};
