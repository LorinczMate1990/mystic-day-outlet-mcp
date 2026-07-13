export interface PushDraftInput {
  to: string[];
  subject: string;
  body: string;
  /** UID (as returned by list_emails/get_email) of the message this draft replies to. */
  replyTo?: string;
}

export interface PushDraftResult {
  /** UID of the created draft, if the server reports one (requires UIDPLUS support). */
  id?: string;
  /** Mailbox the draft was appended to. */
  mailbox: string;
}
