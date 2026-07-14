import { useEffect, useState } from 'react';
import { deleteNote, listNotes, updateNote } from './api';
import type { Note } from './types';
import './NotesView.css';

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
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
    listNotes()
      .then(setNotes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }

  function startEdit(note: Note) {
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
      const updated = await updateNote(id, draftBody);
      setNotes((prev) => prev.map((note) => (note.id === id ? updated : note)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      await deleteNote(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="notes">Loading...</p>;
  }

  return (
    <div className="notes">
      <h1>Notes</h1>
      <p className="notes__hint">
        Notes recorded against a sender e-mail address or domain (e.g. by the agent via{' '}
        <code>add_note</code>). They are auto-surfaced on matching e-mails.
      </p>

      {error && <p className="notes__error">{error}</p>}

      {notes.length === 0 && <p>No notes yet.</p>}

      {notes.length > 0 && (
        <table className="notes__table">
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
                <td className="notes__subject">{note.subject}</td>
                <td className="notes__body">
                  {editingId === note.id ? (
                    <textarea rows={3} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
                  ) : (
                    note.body
                  )}
                </td>
                <td>{new Date(note.createdAt).toLocaleString()}</td>
                <td>{note.updatedAt ? new Date(note.updatedAt).toLocaleString() : '-'}</td>
                <td className="notes__actions">
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
