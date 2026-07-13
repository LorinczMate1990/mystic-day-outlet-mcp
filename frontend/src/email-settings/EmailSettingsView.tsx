import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getEmailSignature, updateEmailSignature } from './api';
import { ShadowHtml } from './ShadowHtml';
import './EmailSettingsView.css';

export function EmailSettingsView() {
  const [textBody, setTextBody] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEmailSignature()
      .then((signature) => {
        setTextBody(signature?.textBody ?? '');
        setHtmlBody(signature?.htmlBody ?? '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateEmailSignature({ textBody, htmlBody: htmlBody || undefined });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="email-settings">Loading...</p>;
  }

  return (
    <div className="email-settings">
      <h1>E-mail settings</h1>
      <p className="email-settings__hint">
        These signatures are appended to outgoing drafts — the plain text one for text bodies, the HTML one (can
        include an image) for HTML bodies.
      </p>

      <form className="email-settings__form" onSubmit={handleSubmit}>
        <label>
          Plain text signature
          <textarea rows={6} value={textBody} onChange={(e) => setTextBody(e.target.value)} />
        </label>
        <label>
          HTML signature
          <ShadowHtml html={htmlBody} className="email-settings__preview" />
          <textarea rows={10} value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} />
        </label>

        {error && <p className="email-settings__error">{error}</p>}
        {saved && <p className="email-settings__success">Saved.</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
