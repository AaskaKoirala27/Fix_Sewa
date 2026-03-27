import api from './api';
import type { User } from './types';

export async function login(username: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login/', { username, password });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout/');
}

export async function register(payload: {
  full_name: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>('/auth/register/', payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me/');
  return data;
}
