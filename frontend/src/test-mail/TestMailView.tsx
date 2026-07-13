import { useState } from 'react';
import type { FormEvent } from 'react';
import { attachmentDownloadUrl, findEmailsByAddress, getEmail, listEmails } from './api';
import type { EmailDetail, EmailHeader } from './types';
import './TestMailView.css';

type SearchMode = 'range' | 'address';

function toDatetimeLocalDefault(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setSeconds(0, 0);
  return date.toISOString().slice(0, 16);
}

export function TestMailView() {
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
      const result =
        mode === 'range'
          ? await listEmails(new Date(from).toISOString(), new Date(to).toISOString())
          : await findEmailsByAddress(address.trim());
      setEmails(result);
    } catch (error) {
      setListError(error instanceof Error ? error.message : String(error));
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
      const result = await getEmail(id);
      setDetail(result);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : String(error));
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
    <div className="test-mail">
      <h1>E-mail handler test view</h1>
      <p className="test-mail__hint">
        Exercises <code>EmailHandlerModule</code> via the <code>test/mail/*</code> endpoints (dev-only).
      </p>

      <div className="test-mail__mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'range'}
          className={mode === 'range' ? 'test-mail__mode-btn test-mail__mode-btn--active' : 'test-mail__mode-btn'}
          onClick={() => handleModeChange('range')}
        >
          By date range
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'address'}
          className={mode === 'address' ? 'test-mail__mode-btn test-mail__mode-btn--active' : 'test-mail__mode-btn'}
          onClick={() => handleModeChange('address')}
        >
          By address
        </button>
      </div>

      {mode === 'range' ? (
        <form className="test-mail__form" onSubmit={handleListSubmit}>
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
        <form className="test-mail__form" onSubmit={handleListSubmit}>
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

      {listError && <p className="test-mail__error">{listError}</p>}

      <div className="test-mail__layout">
        <div className="test-mail__table-wrap">
          <table className="test-mail__table">
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
                  className={email.id === selectedId ? 'test-mail__row--selected' : undefined}
                  onClick={() => handleSelectEmail(email.id)}
                >
                  <td>{email.subject}</td>
                  <td>{email.from.join(', ')}</td>
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

        <div className="test-mail__detail">
          {detailLoading && <p>Loading e-mail...</p>}
          {detailError && <p className="test-mail__error">{detailError}</p>}
          {detail && (
            <>
              <h2>{detail.header.subject}</h2>
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

              <h3>Body</h3>
              <pre className="test-mail__body">{detail.body}</pre>

              <h3>Attachments ({detail.attachments.length})</h3>
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
