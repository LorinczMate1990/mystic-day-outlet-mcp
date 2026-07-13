import type { EmailSignature, UpdateEmailSignatureInput } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7000';

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  // Nest sends an empty body (not JSON "null") for a null return value.
  return (text ? JSON.parse(text) : null) as T;
}

export function getEmailSignature(): Promise<EmailSignature | null> {
  return fetch(`${API_BASE_URL}/email-signature`).then((res) => handleResponse<EmailSignature | null>(res));
}

export function updateEmailSignature(input: UpdateEmailSignatureInput): Promise<EmailSignature> {
  return fetch(`${API_BASE_URL}/email-signature`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => handleResponse<EmailSignature>(res));
}
