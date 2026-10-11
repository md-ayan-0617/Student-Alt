import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents, deleteStudent, updateStudent } from '../services/api';

export default function AdminStudents() {
  const { showToast, refreshSystemStatus } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newStudentModal, setNewStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    student_id: '',
    branch: 'Computer Science & Engineering',
    batch: '2023-2027',
    semester: '5th Sem',
    email: '',
    leetcode_id: '',
    gfg_id: '',
    codechef_id: '',
    github_id: '',
    hackerrank_id: ''
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents({ search, limit: 50 });
      if (res.success) setStudents(res.students);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student record for "${name}"?`)) return;
    try {
      const res = await deleteStudent(id);
      if (res.success) {
        showToast(`Student "${name}" deleted.`, 'success');
        fetchStudents();
        refreshSystemStatus();
      }
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                Administration Panel
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Student Master Roster Administration
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
              Add individual student profiles, manage linked platform accounts, audit handles, and remove outdated entries.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/import?tab=edit"
              className="px-3.5 py-2 rounded-lg bg-[#EA5652]/10 border border-[#EA5652]/40 hover:bg-[#EA5652]/20 text-[#EA5652] text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Existing JSON</span>
            </Link>
            <Link
              to="/import?tab=upload"
              className="px-3.5 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Import JSON File</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roster by student name, roll number, or handle..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">Roll / ID</th>
              <th className="py-2.5 px-4">Branch & Batch</th>
              <th className="py-2.5 px-4">Linked Handles</th>
              <th className="py-2.5 px-4 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[var(--text-muted)]">
                  Loading roster...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[var(--text-muted)]">
                  No student records found.
                </td>
              </tr>
            ) : (
              students.map((st) => (
                <tr key={st.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    <Link to={`/students/${st.id}`} className="hover:text-[var(--accent-blue)]">
                      {st.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                    {st.student_id || '—'}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">
                    {st.branch} • {st.batch}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-muted)]">
                    {st.leetcode_username && <span className="text-amber-400 mr-2">LC:{st.leetcode_username}</span>}
                    {st.gfg_username && <span className="text-emerald-400 mr-2">GFG:{st.gfg_username}</span>}
                    {st.codechef_username && <span className="text-purple-400 mr-2">CC:{st.codechef_username}</span>}
                    {st.github_username && <span className="text-blue-400">GH:{st.github_username}</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/students/${st.id}`}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-blue)]"
                        title="View & Edit"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(st.id, st.name)}
                        className="p-1 text-[var(--text-muted)] hover:text-rose-400"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
