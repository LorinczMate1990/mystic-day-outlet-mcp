import type { EmailDetail, EmailHeader } from './types';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${message}`);
  }
  return response.json() as Promise<T>;
}

export function listEmails(from: string, to: string): Promise<EmailHeader[]> {
  const params = new URLSearchParams({ from, to });
  return fetch(`${API_BASE_URL}/test/mail/list?${params}`).then((res) => handleResponse<EmailHeader[]>(res));
}

export function findEmailsByAddress(address: string): Promise<EmailHeader[]> {
  const params = new URLSearchParams({ address });
  return fetch(`${API_BASE_URL}/test/mail/by-address?${params}`).then((res) => handleResponse<EmailHeader[]>(res));
}

export function getEmail(id: string): Promise<EmailDetail> {
  return fetch(`${API_BASE_URL}/test/mail/${encodeURIComponent(id)}`).then((res) => handleResponse<EmailDetail>(res));
}

export function attachmentDownloadUrl(id: string, index: number): string {
  return `${API_BASE_URL}/test/mail/${encodeURIComponent(id)}/attachments/${index}`;
}
