import { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../lib/api';

type Session = {
  id: string;
  title: string;
  profile: string;
  updatedAt: string;
  messages: Array<{ role: string; content: string }>;
};

type Props = {
  token: string;
  onLoad: (session: Session) => void;
  onClose: () => void;
};

export function HistoryPanel({ token, onLoad, onClose }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions(token).then((data) => {
      setSessions(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [token]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(id, token);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <span>📋 Chat History</span>
        <button onClick={onClose} className="history-close">✕</button>
      </div>
      {loading && <div className="history-loading">Loading...</div>}
      {!loading && sessions.length === 0 && (
        <div className="history-empty">Belum ada history</div>
      )}
      <div className="history-list">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="history-item"
            onClick={() => { onLoad(s); onClose(); }}
          >
            <div className="history-item-title">{s.title}</div>
            <div className="history-item-meta">
              <span className="history-badge">{s.profile}</span>
              <span className="history-date">
                {new Date(s.updatedAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            <button
              className="history-delete"
              onClick={(e) => handleDelete(s.id, e)}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
