import { useEffect, useState } from 'react';
import axios from 'axios';
import './EmailNotes.css';

interface EmailNote {
  id: number;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

function EmailNotes() {
  const [notes, setNotes] = useState<EmailNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    axios
      .get<EmailNote[]>('/api/email-notes')
      .then((response) => setNotes(response.data))
      .catch(() => setError('Failed to load notes.'))
      .finally(() => setLoading(false));
  }

  function startEdit(note: EmailNote) {
    setEditingId(note.id);
    setDraftBody(note.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftBody('');
  }

  async function saveEdit(id: number) {
    setSavingId(id);
    setError(null);
    try {
      const response = await axios.put<EmailNote>(`/api/email-notes/${id}`, { body: draftBody });
      setNotes((prev) => prev.map((note) => (note.id === id ? response.data : note)));
      setEditingId(null);
    } catch {
      setError('Failed to save the note.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this note?')) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await axios.delete(`/api/email-notes/${id}`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch {
      setError('Failed to delete the note.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="email-notes-container">Loading...</p>;
  }

  return (
    <div className="email-notes-container">
      <h2 className="email-notes-title">E-mail notes</h2>
      <p className="email-notes-hint">
        Notes recorded against a sender e-mail address or domain (e.g. by the agent via <code>add_note</code>). They
        are auto-surfaced on matching e-mails.
      </p>

      {error && <p className="email-notes-error">{error}</p>}

      {notes.length === 0 && <p>No notes yet.</p>}

      {notes.length > 0 && (
        <table className="email-notes-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Body</th>
              <th>Created</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id}>
                <td className="email-notes-subject">{note.subject}</td>
                <td className="email-notes-body">
                  {editingId === note.id ? (
                    <textarea rows={3} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
                  ) : (
                    note.body
                  )}
                </td>
                <td>{new Date(note.createdAt).toLocaleString()}</td>
                <td>{note.updatedAt ? new Date(note.updatedAt).toLocaleString() : '-'}</td>
                <td className="email-notes-actions">
                  {editingId === note.id ? (
                    <>
                      <button type="button" onClick={() => saveEdit(note.id)} disabled={savingId === note.id}>
                        {savingId === note.id ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={savingId === note.id}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(note)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(note.id)} disabled={deletingId === note.id}>
                        {deletingId === note.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EmailNotes;
