import type { Note } from './types';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  // Nest sends an empty body (not JSON "null") for a null return value.
  return (text ? JSON.parse(text) : null) as T;
}

export function listNotes(): Promise<Note[]> {
  return fetch(`${API_BASE_URL}/notes`).then((res) => handleResponse<Note[]>(res));
}

export function updateNote(id: number, body: string): Promise<Note> {
  return fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  }).then((res) => handleResponse<Note>(res));
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
  await handleResponse<{ success: true }>(res);
}
