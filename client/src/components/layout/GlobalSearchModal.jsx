import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, ExternalLink, Code2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getStudents } from '../../services/api';

export default function GlobalSearchModal() {
  const { searchModalOpen, setSearchModalOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [searchModalOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getStudents({ search: searchTerm, limit: 8 });
        if (res.success) {
          setResults(res.students);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--surface-main)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-color)] gap-3 bg-[var(--surface-elevated)]/40">
          <Search className="w-5 h-5 text-[var(--accent-blue)]" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name, roll number, or platform handle..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchModalOpen(false)}
            className="text-xs text-[var(--text-muted)] border border-[var(--border-color)] px-2 py-1 rounded hover:bg-[var(--surface-hover)]"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Searching college directory...
            </div>
          )}

          {!loading && searchTerm && results.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No students found matching "{searchTerm}"
            </div>
          )}

          {!loading && !searchTerm && (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">
              Type a student's name, roll number, or coding handle (e.g. "Aditya", "CS22B001", "leetcode_id")
            </div>
          )}

          <div className="space-y-1">
            {results.map((student) => (
              <div
                key={student.id}
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate(`/students/${student.id}`);
                }}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-color)] flex items-center justify-center text-xs font-semibold text-[var(--text-primary)] shrink-0 group-hover:border-[var(--accent-blue)]">
                    {student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2 truncate">
                      <span>{student.name}</span>
                      {student.student_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                          {student.student_id}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-3">
                      <span>{student.branch || 'General'}</span>
                      {student.leetcode_username && (
                        <span className="text-amber-400 font-mono text-[11px]">
                          LC: {student.leetcode_username}
                        </span>
                      )}
                      {student.codechef_rating && (
                        <span className="text-purple-400 font-mono text-[11px]">
                          CC: {student.codechef_rating}★
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                      {student.reported_solved_total} solved
                    </span>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {student.data_completeness}% completeness
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-[var(--surface-elevated)]/60 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)] flex items-center justify-between">
          <span>Navigation: Click or Enter to view student profile</span>
          <span>CAMPUS CODING INTELLIGENCE</span>
        </div>
      </div>
    </div>
  );
}
