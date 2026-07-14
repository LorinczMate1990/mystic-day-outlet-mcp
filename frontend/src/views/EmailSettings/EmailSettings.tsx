import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import ShadowHtml from '../../components/ShadowHtml/ShadowHtml';
import './EmailSettings.css';

interface EmailSignature {
  id: number;
  textBody: string;
  htmlBody?: string;
  updatedAt: string;
}

function EmailSettings() {
  const [textBody, setTextBody] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios
      .get<EmailSignature | null>('/api/email-signature')
      .then((response) => {
        setTextBody(response.data?.textBody ?? '');
        setHtmlBody(response.data?.htmlBody ?? '');
      })
      .catch(() => setError('Failed to load the e-mail signature.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await axios.put('/api/email-signature', { textBody, htmlBody: htmlBody || undefined });
      setSaved(true);
    } catch {
      setError('Failed to save the e-mail signature.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="email-settings-container">Loading...</p>;
  }

  return (
    <div className="email-settings-container">
      <h2 className="email-settings-title">E-mail settings</h2>
      <p className="email-settings-hint">
        These signatures are appended to outgoing drafts — the plain text one for text bodies, the HTML one (can
        include an image) for HTML bodies.
      </p>

      <form className="email-settings-form" onSubmit={handleSubmit}>
        <label>
          Plain text signature
          <textarea rows={6} value={textBody} onChange={(e) => setTextBody(e.target.value)} />
        </label>
        <label>
          HTML signature
          <ShadowHtml html={htmlBody} className="email-settings-preview" />
          <textarea rows={10} value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} />
        </label>

        {error && <p className="email-settings-error">{error}</p>}
        {saved && <p className="email-settings-success">Saved.</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default EmailSettings;
