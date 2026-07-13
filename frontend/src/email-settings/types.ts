export interface EmailSignature {
  id: number;
  textBody: string;
  htmlBody?: string;
  updatedAt: string;
}

export interface UpdateEmailSignatureInput {
  textBody: string;
  htmlBody?: string;
}
