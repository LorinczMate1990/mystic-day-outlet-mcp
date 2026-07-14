import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import './TestMail.css';

interface EmailNote {
  id: number;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

interface EmailHeader {
  id: string;
  subject: string;
  from: string[];
  to: string[];
  cc: string[];
  bcc: string[];
  date: string;
  notes: EmailNote[];
}

interface AttachmentSummary {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

interface EmailDetail {
  header: EmailHeader;
  body: string;
  attachments: AttachmentSummary[];
}

type SearchMode = 'range' | 'address';

function toDatetimeLocalDefault(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setSeconds(0, 0);
  return date.toISOString().slice(0, 16);
}

function attachmentDownloadUrl(id: string, index: number): string {
  return `/api/test/mail/${encodeURIComponent(id)}/attachments/${index}`;
}

function TestMail() {
  const [mode, setMode] = useState<SearchMode>('range');
  const [from, setFrom] = useState(toDatetimeLocalDefault(7));
  const [to, setTo] = useState(toDatetimeLocalDefault(0));
  const [address, setAddress] = useState('');
  const [emails, setEmails] = useState<EmailHeader[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  async function handleListSubmit(event: FormEvent) {
    event.preventDefault();
    setListLoading(true);
    setListError(null);
    setDetail(null);
    setSelectedId(null);
    try {
      const response =
        mode === 'range'
          ? await axios.get<EmailHeader[]>('/api/test/mail/list', {
              params: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
            })
          : await axios.get<EmailHeader[]>('/api/test/mail/by-address', {
              params: { address: address.trim() },
            });
      setEmails(response.data);
    } catch {
      setListError('Failed to load e-mails.');
      setEmails([]);
    } finally {
      setListLoading(false);
    }
  }

  async function handleSelectEmail(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await axios.get<EmailDetail>(`/api/test/mail/${encodeURIComponent(id)}`);
      setDetail(response.data);
    } catch {
      setDetailError('Failed to load the e-mail.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleModeChange(nextMode: SearchMode) {
    setMode(nextMode);
    setEmails([]);
    setListError(null);
    setDetail(null);
    setSelectedId(null);
  }

  return (
    <div className="test-mail-container">
      <h2 className="test-mail-title">E-mail handler test view</h2>
      <p className="test-mail-hint">
        Exercises <code>EmailHandlerModule</code> via the <code>test/mail/*</code> endpoints (dev-only).
      </p>

      <div className="test-mail-mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'range'}
          className={mode === 'range' ? 'test-mail-mode-btn test-mail-mode-btn-active' : 'test-mail-mode-btn'}
          onClick={() => handleModeChange('range')}
        >
          By date range
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'address'}
          className={mode === 'address' ? 'test-mail-mode-btn test-mail-mode-btn-active' : 'test-mail-mode-btn'}
          onClick={() => handleModeChange('address')}
        >
          By address
        </button>
      </div>

      {mode === 'range' ? (
        <form className="test-mail-form" onSubmit={handleListSubmit}>
          <label>
            From
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label>
            To
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <button type="submit" disabled={listLoading}>
            {listLoading ? 'Loading...' : 'List e-mails'}
          </button>
        </form>
      ) : (
        <form className="test-mail-form" onSubmit={handleListSubmit}>
          <label>
            Address
            <input
              type="email"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="someone@example.com"
              required
            />
          </label>
          <button type="submit" disabled={listLoading || !address.trim()}>
            {listLoading ? 'Loading...' : 'Find e-mails'}
          </button>
        </form>
      )}

      {listError && <p className="test-mail-error">{listError}</p>}

      <div className="test-mail-layout">
        <div className="test-mail-table-wrap">
          <table className="test-mail-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>From</th>
                <th>To</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr
                  key={email.id}
                  className={email.id === selectedId ? 'test-mail-row-selected' : undefined}
                  onClick={() => handleSelectEmail(email.id)}
                >
                  <td>{email.subject}</td>
                  <td>
                    {email.from.join(', ')}
                    {email.notes.length > 0 && (
                      <span className="test-mail-notes-badge" title="Has notes">
                        {' '}
                        [{email.notes.length} note{email.notes.length === 1 ? '' : 's'}]
                      </span>
                    )}
                  </td>
                  <td>{email.to.join(', ')}</td>
                  <td>{new Date(email.date).toLocaleString()}</td>
                </tr>
              ))}
              {emails.length === 0 && !listLoading && (
                <tr>
                  <td colSpan={4}>No e-mails loaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="test-mail-detail">
          {detailLoading && <p>Loading e-mail...</p>}
          {detailError && <p className="test-mail-error">{detailError}</p>}
          {detail && (
            <>
              <h3>{detail.header.subject}</h3>
              <dl>
                <dt>From</dt>
                <dd>{detail.header.from.join(', ')}</dd>
                <dt>To</dt>
                <dd>{detail.header.to.join(', ')}</dd>
                <dt>Cc</dt>
                <dd>{detail.header.cc.join(', ') || '-'}</dd>
                <dt>Bcc</dt>
                <dd>{detail.header.bcc.join(', ') || '-'}</dd>
                <dt>Date</dt>
                <dd>{new Date(detail.header.date).toLocaleString()}</dd>
              </dl>

              <h4>Notes ({detail.header.notes.length})</h4>
              {detail.header.notes.length === 0 && <p>No notes for this sender or its domain.</p>}
              {detail.header.notes.length > 0 && (
                <ul className="test-mail-notes">
                  {detail.header.notes.map((note) => (
                    <li key={note.id}>
                      <span className="test-mail-notes-subject">{note.subject}</span> —{' '}
                      {new Date(note.createdAt).toLocaleString()}
                      <p>{note.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              <h4>Body</h4>
              <pre className="test-mail-body">{detail.body}</pre>

              <h4>Attachments ({detail.attachments.length})</h4>
              {detail.attachments.length === 0 && <p>No attachments.</p>}
              <ul>
                {detail.attachments.map((attachment) => (
                  <li key={attachment.index}>
                    <a href={attachmentDownloadUrl(detail.header.id, attachment.index)} target="_blank" rel="noreferrer">
                      {attachment.filename}
                    </a>{' '}
                    ({attachment.contentType}, {attachment.size} bytes)
                  </li>
                ))}
              </ul>
            </>
          )}
          {!detail && !detailLoading && !detailError && <p>Select an e-mail to see its details.</p>}
        </div>
      </div>
    </div>
  );
}

export default TestMail;
