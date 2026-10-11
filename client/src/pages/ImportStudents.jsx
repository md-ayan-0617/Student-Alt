import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  History,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  FileText,
  FileEdit,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Code,
  Table,
  FolderOpen,
  RefreshCw,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  previewImport,
  commitImport,
  getImportTemplate,
  getImportHistory,
  getCurrentRosterJson,
  getImportFiles,
  getImportFileContent,
  saveImportFileJson
} from '../services/api';

export default function ImportStudents() {
  const { showToast, refreshSystemStatus } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'upload' | 'paste' | 'edit' | 'history'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'edit';
  });

  // Upload Tab States
  const [file, setFile] = useState(null);
  const [fileContentRaw, setFileContentRaw] = useState('');

  // Paste Tab States
  const [jsonText, setJsonText] = useState('');

  // Preview & Commit Pipeline States
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [duplicatePolicy, setDuplicatePolicy] = useState('update'); // 'update' | 'skip'
  const [autoSync, setAutoSync] = useState(true);
  const [commitResult, setCommitResult] = useState(null);

  // JSON Editor States
  const [editorContent, setEditorContent] = useState('');
  const [editorFilename, setEditorFilename] = useState('sample_college_students.json');
  const [editorSource, setEditorSource] = useState('sample-file'); // 'file' | 'live-roster' | 'template' | 'custom'
  const [editorMode, setEditorMode] = useState('code'); // 'code' | 'table'
  const [editorError, setEditorError] = useState(null);
  const [editorRecordsCount, setEditorRecordsCount] = useState(0);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [isSavingDisk, setIsSavingDisk] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Update tab from query param if URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['upload', 'paste', 'edit', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Fetch import history
  const fetchHistory = async () => {
    try {
      const res = await getImportHistory();
      if (res.success) {
        setHistoryJobs(res.jobs);
      }
    } catch (e) {
      console.warn('Failed to load history', e);
    }
  };

  // Fetch list of files in data/
  const loadAvailableFiles = async () => {
    try {
      const res = await getImportFiles();
      if (res.success && res.files) {
        setAvailableFiles(res.files);
      }
    } catch (e) {
      console.warn('Failed to list data files', e);
    }
  };

  useEffect(() => {
    fetchHistory();
    loadAvailableFiles();
  }, []);

  // Validate JSON text and return parsed array if valid
  const validateEditorJson = (text) => {
    if (!text || !text.trim()) {
      setEditorError(null);
      setEditorRecordsCount(0);
      return null;
    }
    try {
      let parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        if (parsed && typeof parsed === 'object') {
          parsed = [parsed];
        } else {
          setEditorError('Root element must be a student object or array of student objects: [ { ... } ]');
          setEditorRecordsCount(0);
          return null;
        }
      }
      setEditorError(null);
      setEditorRecordsCount(parsed.length);
      return parsed;
    } catch (err) {
      setEditorError(err.message);
      setEditorRecordsCount(0);
      return null;
    }
  };

  const handleEditorChange = (newVal) => {
    setEditorContent(newVal);
    validateEditorJson(newVal);
  };

  // Load sample_college_students.json or any specific file
  const loadFileIntoEditor = async (filename = 'sample_college_students.json') => {
    setIsLoadingFile(true);
    try {
      const res = await getImportFileContent(filename);
      if (res.success) {
        const formatted = JSON.stringify(res.data, null, 2);
        setEditorContent(formatted);
        setEditorFilename(filename);
        setEditorSource('file');
        validateEditorJson(formatted);
        showToast(`Loaded ${filename} (${res.count || 0} students)`, 'info');
      } else {
        showToast(res.error || 'Failed to read file', 'error');
      }
    } catch (err) {
      showToast('Error loading file: ' + err.message, 'error');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load live SQLite roster
  const loadLiveRosterIntoEditor = async () => {
    setIsLoadingFile(true);
    try {
      const res = await getCurrentRosterJson();
      if (res.success) {
        const formatted = JSON.stringify(res.students, null, 2);
        setEditorContent(formatted);
        setEditorFilename('current_live_roster.json');
        setEditorSource('live-roster');
        validateEditorJson(formatted);
        showToast(`Loaded live database roster (${res.count} students)`, 'info');
      } else {
        showToast(res.error || 'Failed to load live roster', 'error');
      }
    } catch (err) {
      showToast('Error loading roster: ' + err.message, 'error');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load template
  const loadTemplateIntoEditor = async () => {
    setIsLoadingFile(true);
    try {
      const res = await getImportTemplate();
      if (res.success) {
        const formatted = JSON.stringify(res.template, null, 2);
        setEditorContent(formatted);
        setEditorFilename('students_template.json');
        setEditorSource('template');
        validateEditorJson(formatted);
        showToast('Loaded standard roster template', 'info');
      }
    } catch (err) {
      showToast('Failed to load template', 'error');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Auto-load default file when switching to 'edit' if empty
  useEffect(() => {
    if (activeTab === 'edit' && !editorContent) {
      loadFileIntoEditor('sample_college_students.json');
    }
  }, [activeTab]);

  // Format / Beautify JSON
  const handleFormatJson = () => {
    try {
      if (!editorContent.trim()) return;
      const parsed = JSON.parse(editorContent);
      const pretty = JSON.stringify(parsed, null, 2);
      setEditorContent(pretty);
      validateEditorJson(pretty);
      showToast('JSON beautified successfully', 'success');
    } catch (err) {
      showToast('Cannot format invalid JSON: ' + err.message, 'error');
    }
  };

  // Insert Student Snippet
  const handleInsertStudentSnippet = () => {
    let list = [];
    try {
      if (editorContent.trim()) {
        const parsed = JSON.parse(editorContent);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch (_) {
      showToast('Please fix JSON syntax errors before inserting a new entry', 'error');
      return;
    }

    const nextIndex = list.length + 1;
    const newStudent = {
      name: `Student Name ${nextIndex}`,
      student_id: `CS24B${String(nextIndex).padStart(3, '0')}`,
      branch: 'Computer Science & Engineering',
      batch: '2023-2027',
      semester: '5th Sem',
      leetcode_id: `coder_${nextIndex}`,
      gfg_id: `gfg_${nextIndex}`,
      codechef_id: `cc_${nextIndex}`,
      github_id: `github_${nextIndex}`,
      hackerrank_id: `hr_${nextIndex}`
    };

    const updated = [...list, newStudent];
    const pretty = JSON.stringify(updated, null, 2);
    setEditorContent(pretty);
    validateEditorJson(pretty);
    showToast(`Appended student #${nextIndex} to JSON array`, 'success');
  };

  // Table row edit handlers
  const handleTableRowChange = (index, field, value) => {
    try {
      const list = JSON.parse(editorContent);
      if (!Array.isArray(list)) return;
      const updated = [...list];
      updated[index] = { ...updated[index], [field]: value };
      const pretty = JSON.stringify(updated, null, 2);
      setEditorContent(pretty);
      validateEditorJson(pretty);
    } catch (err) {
      showToast('Cannot edit in table while JSON syntax has errors', 'error');
    }
  };

  const handleTableDeleteRow = (index) => {
    try {
      const list = JSON.parse(editorContent);
      if (!Array.isArray(list)) return;
      const updated = list.filter((_, i) => i !== index);
      const pretty = JSON.stringify(updated, null, 2);
      setEditorContent(pretty);
      validateEditorJson(pretty);
      showToast(`Removed row #${index + 1}`, 'info');
    } catch (err) {
      showToast('Cannot delete row: ' + err.message, 'error');
    }
  };

  // Parsed records for table view
  const parsedRecords = useMemo(() => {
    try {
      if (!editorContent.trim()) return [];
      const parsed = JSON.parse(editorContent);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }, [editorContent]);

  const filteredRecords = useMemo(() => {
    if (!tableSearch.trim()) return parsedRecords;
    const q = tableSearch.toLowerCase();
    return parsedRecords.filter((r) =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.student_id && r.student_id.toLowerCase().includes(q)) ||
      (r.leetcode_id && r.leetcode_id.toLowerCase().includes(q)) ||
      (r.gfg_id && r.gfg_id.toLowerCase().includes(q)) ||
      (r.codechef_id && r.codechef_id.toLowerCase().includes(q)) ||
      (r.branch && r.branch.toLowerCase().includes(q))
    );
  }, [parsedRecords, tableSearch]);

  // Save edits back to server disk file
  const handleSaveToDisk = async () => {
    const parsed = validateEditorJson(editorContent);
    if (!parsed) {
      showToast('Cannot save: Invalid JSON syntax or not an array', 'error');
      return;
    }
    setIsSavingDisk(true);
    try {
      const targetName = editorFilename.trim() || 'sample_college_students.json';
      const res = await saveImportFileJson(parsed, targetName);
      if (res.success) {
        showToast(res.message || `Saved ${res.count} students to ${res.filename} successfully!`, 'success');
        loadAvailableFiles();
      } else {
        showToast(res.error || 'Failed to save file', 'error');
      }
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setIsSavingDisk(false);
    }
  };

  // Download local copy
  const handleDownloadEditorJson = () => {
    try {
      const blob = new Blob([editorContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = editorFilename || 'college_students.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${a.download}`, 'success');
    } catch (err) {
      showToast('Download failed: ' + err.message, 'error');
    }
  };

  // Copy to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
      setCopiedJson(true);
      showToast('JSON copied to clipboard', 'info');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const raw = event.target.result;
          setFileContentRaw(raw);
          let parsed = JSON.parse(raw);
          if (!Array.isArray(parsed) && typeof parsed === 'object') {
            parsed = [parsed];
          }
          runPreview(parsed, selectedFile.name);
        } catch (parseErr) {
          showToast('Invalid JSON file syntax: ' + parseErr.message, 'error');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  // Send uploaded file straight to the editor
  const handleOpenUploadedInEditor = () => {
    if (!file || !fileContentRaw) return;
    try {
      let parsed = JSON.parse(fileContentRaw);
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        parsed = [parsed];
      }
      const pretty = JSON.stringify(parsed, null, 2);
      setEditorContent(pretty);
      setEditorFilename(file.name);
      setEditorSource('custom');
      validateEditorJson(pretty);
      setActiveTab('edit');
      showToast(`Opened "${file.name}" in interactive JSON editor`, 'info');
    } catch (err) {
      showToast('Failed to open file: ' + err.message, 'error');
    }
  };

  // Paste Tab Submit
  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      showToast('Please paste a JSON array or student object', 'error');
      return;
    }
    try {
      let parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        parsed = [parsed];
      }
      runPreview(parsed, 'pasted_roster.json');
    } catch (parseErr) {
      showToast('Malformed JSON syntax: ' + parseErr.message, 'error');
    }
  };

  // Validation & Preview Pipeline
  const runPreview = async (jsonArray, filename) => {
    setPreviewLoading(true);
    setPreviewData(null);
    setCommitResult(null);
    try {
      const res = await previewImport(jsonArray);
      if (res.success) {
        setPreviewData({ ...res, filename, originalArray: jsonArray });
        showToast(`Validated ${res.total_records} records. Review preview below.`, 'info');
      } else {
        showToast(res.error || 'Failed to validate JSON file', 'error');
      }
    } catch (err) {
      showToast('Validation failed: ' + err.message, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewFromEditor = () => {
    const parsed = validateEditorJson(editorContent);
    if (!parsed) {
      showToast('Cannot preview: Please fix JSON syntax errors', 'error');
      return;
    }
    runPreview(parsed, editorFilename);
  };

  // Commit Import to Master Database
  const handleConfirmCommit = async () => {
    if (!previewData || !previewData.originalArray) return;
    setCommitLoading(true);
    try {
      const res = await commitImport({
        students: previewData.originalArray,
        filename: previewData.filename || 'roster.json',
        duplicatePolicy,
        autoSync
      });
      if (res.success) {
        showToast(`Successfully committed ${res.created} new students, updated ${res.updated} existing records.`, 'success');
        await refreshSystemStatus();
        fetchHistory();
        setCommitResult({
          ...res,
          filename: previewData.filename,
          autoSyncStarted: res.autoSyncStarted
        });
        setPreviewData(null);
        setFile(null);
        setJsonText('');
      } else {
        showToast(res.error || 'Commit failed', 'error');
      }
    } catch (err) {
      showToast('Error committing import: ' + err.message, 'error');
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await getImportTemplate();
      const blob = new Blob([JSON.stringify(res.template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'college_students_template.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded official JSON roster template.', 'success');
    } catch (e) {
      showToast('Failed to download template', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#EA5652] bg-[#EA5652]/10 px-2 py-0.5 rounded border border-[#EA5652]/30">
                Institutional Data Pipeline
              </span>
              <span className="text-[11px] font-mono text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                Full JSON Editor & Sync
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              College Student JSON Roster & File Editor
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl mt-1">
              Directly inspect, edit, format, and save the college's student JSON roster. Modify existing records, add new students, save changes back to disk (<code className="text-[#EA5652] font-mono">sample_college_students.json</code>), or commit updates directly into the active SQLite database.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('edit');
                loadFileIntoEditor('sample_college_students.json');
              }}
              className="px-3.5 py-2 rounded-lg bg-[#EA5652]/10 border border-[#EA5652]/40 hover:bg-[#EA5652]/20 text-xs font-semibold text-[#EA5652] transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileEdit className="w-4 h-4 text-[#EA5652]" />
              <span>Edit Existing JSON</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-[var(--accent-teal)]" />
              <span>Download Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)] text-xs font-medium gap-2">
        <button
          onClick={() => setActiveTab('edit')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'edit'
              ? 'border-[#EA5652] text-[#EA5652] font-semibold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Edit Existing JSON</span>
          <span className="text-[10px] bg-[#EA5652]/15 text-[#EA5652] px-1.5 py-0.2 rounded font-mono">
            Interactive
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)] font-semibold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload JSON File</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'paste'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)] font-semibold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Direct JSON Paste</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)] font-semibold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Import History & Audit</span>
        </button>
      </div>

      {/* TAB: EDIT EXISTING JSON */}
      {activeTab === 'edit' && (
        <div className="space-y-4">
          {/* Preset Loaders & File Switcher Bar */}
          <div className="card-base p-4 bg-[var(--surface-elevated)] space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 mr-1">
                  <FolderOpen className="w-4 h-4 text-[#EA5652]" />
                  <span>Load File / Source:</span>
                </span>

                <button
                  onClick={() => loadFileIntoEditor('sample_college_students.json')}
                  disabled={isLoadingFile}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    editorFilename === 'sample_college_students.json' && editorSource === 'file'
                      ? 'bg-[#EA5652]/15 border-[#EA5652] text-[#EA5652]'
                      : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>sample_college_students.json</span>
                </button>

                <button
                  onClick={loadLiveRosterIntoEditor}
                  disabled={isLoadingFile}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    editorSource === 'live-roster'
                      ? 'bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--accent-blue)]'
                      : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFile ? 'animate-spin' : ''}`} />
                  <span>Live Database Roster</span>
                </button>

                <button
                  onClick={loadTemplateIntoEditor}
                  disabled={isLoadingFile}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    editorSource === 'template'
                      ? 'bg-[var(--accent-teal)]/15 border-[var(--accent-teal)] text-[var(--accent-teal)]'
                      : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Standard Template</span>
                </button>

                <button
                  onClick={() => {
                    setEditorContent('[\n  \n]');
                    setEditorFilename('new_roster.json');
                    setEditorSource('custom');
                    validateEditorJson('[\n  \n]');
                  }}
                  className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border-color)] bg-[var(--surface-main)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <span>Clear / Blank Array</span>
                </button>
              </div>

              {/* Target File Name Input */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-mono whitespace-nowrap">File name:</span>
                <input
                  type="text"
                  value={editorFilename}
                  onChange={(e) => setEditorFilename(e.target.value)}
                  placeholder="sample_college_students.json"
                  className="px-3 py-1 text-xs font-mono bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[#EA5652] w-56"
                />
              </div>
            </div>

            {/* List other server files if present */}
            {availableFiles.length > 1 && (
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]/60 text-[11px] text-[var(--text-muted)] overflow-x-auto">
                <span className="font-semibold text-[var(--text-secondary)]">Available Files in /data:</span>
                {availableFiles.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => loadFileIntoEditor(f.filename)}
                    className="font-mono px-2 py-0.5 rounded bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[#EA5652] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
                  >
                    {f.filename} ({f.recordsCount} students)
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor Header Toolbar & View Toggle */}
          <div className="card-base p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--surface-elevated)] border-b-0 rounded-b-none">
            {/* Left: Status Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {editorError ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[11px]">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-xs md:max-w-md">JSON Error: {editorError}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Valid JSON Array • {editorRecordsCount} Students</span>
                </div>
              )}

              <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
                {editorContent.length} chars • {editorContent.split('\n').length} lines
              </span>
            </div>

            {/* Right: Mode Toggle & Action Tools */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mode Toggle */}
              <div className="flex items-center bg-[var(--surface-main)] rounded-lg p-0.5 border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setEditorMode('code')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    editorMode === 'code'
                      ? 'bg-[#EA5652] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editorError) {
                      showToast('Fix JSON syntax errors to switch to Table Mode', 'error');
                      return;
                    }
                    setEditorMode('table');
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    editorMode === 'table'
                      ? 'bg-[#EA5652] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table Grid View</span>
                </button>
              </div>

              {/* Code Tools */}
              {editorMode === 'code' && (
                <>
                  <button
                    onClick={handleFormatJson}
                    title="Beautify and auto-format JSON indentation"
                    className="px-2.5 py-1 rounded bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Beautify</span>
                  </button>

                  <button
                    onClick={handleInsertStudentSnippet}
                    title="Append a new student template object to the array"
                    className="px-2.5 py-1 rounded bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-emerald-500 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Student</span>
                  </button>
                </>
              )}

              <button
                onClick={handleCopyJson}
                title="Copy entire JSON to clipboard"
                className="px-2.5 py-1 rounded bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadEditorJson}
                title="Download JSON file to local computer"
                className="px-2.5 py-1 rounded bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* MODE 1: RAW CODE EDITOR */}
          {editorMode === 'code' && (
            <div className="card-base p-0 overflow-hidden rounded-t-none border-t-0 focus-within:border-[#EA5652]">
              <div className="relative">
                <textarea
                  value={editorContent}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  rows={20}
                  spellCheck={false}
                  placeholder="[\n  {\n    &quot;name&quot;: &quot;Student Name&quot;,\n    &quot;leetcode_id&quot;: &quot;username&quot;\n  }\n]"
                  className="w-full p-4 bg-[#0B0F19] text-[var(--text-primary)] font-mono text-xs leading-relaxed focus:outline-none resize-y min-h-[360px] border-none select-text"
                  style={{
                    fontFamily: '"Geist Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                    tabSize: 2
                  }}
                />
              </div>
            </div>
          )}

          {/* MODE 2: VISUAL TABLE GRID VIEW */}
          {editorMode === 'table' && (
            <div className="card-base p-0 overflow-hidden rounded-t-none border-t-0 space-y-3">
              {/* Table search & add action */}
              <div className="p-3 bg-[var(--surface-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search by student name, roll number, or handle..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[#EA5652]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInsertStudentSnippet}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-medium text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Row</span>
                  </button>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Showing {filteredRecords.length} of {parsedRecords.length}
                  </span>
                </div>
              </div>

              {/* Table scroll container */}
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--surface-elevated)] text-[var(--text-secondary)] sticky top-0 border-b border-[var(--border-color)] shadow-sm">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center font-mono">#</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Student Name *</th>
                      <th className="py-2.5 px-3 min-w-[130px]">LeetCode ID</th>
                      <th className="py-2.5 px-3 min-w-[130px]">GFG ID</th>
                      <th className="py-2.5 px-3 min-w-[130px]">CodeChef ID</th>
                      <th className="py-2.5 px-3 min-w-[130px]">GitHub ID</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Student ID / Roll</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Branch</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-[var(--text-muted)]">
                          {parsedRecords.length === 0 ? 'No students found in JSON array.' : 'No students match your search filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((row, index) => (
                        <tr key={index} className="hover:bg-[var(--surface-hover)] group">
                          <td className="py-2 px-3 text-center font-mono text-[var(--text-muted)] text-[11px]">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.name || ''}
                              onChange={(e) => handleTableRowChange(index, 'name', e.target.value)}
                              placeholder="Full Name"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[#EA5652] font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.leetcode_id || ''}
                              onChange={(e) => handleTableRowChange(index, 'leetcode_id', e.target.value)}
                              placeholder="leetcode handle"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-amber-400 font-mono focus:outline-none focus:border-[#EA5652]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.gfg_id || ''}
                              onChange={(e) => handleTableRowChange(index, 'gfg_id', e.target.value)}
                              placeholder="gfg handle"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-emerald-400 font-mono focus:outline-none focus:border-[#EA5652]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.codechef_id || ''}
                              onChange={(e) => handleTableRowChange(index, 'codechef_id', e.target.value)}
                              placeholder="codechef handle"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-purple-400 font-mono focus:outline-none focus:border-[#EA5652]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.github_id || ''}
                              onChange={(e) => handleTableRowChange(index, 'github_id', e.target.value)}
                              placeholder="github username"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-sky-400 font-mono focus:outline-none focus:border-[#EA5652]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.student_id || ''}
                              onChange={(e) => handleTableRowChange(index, 'student_id', e.target.value)}
                              placeholder="CS22B001"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-[var(--text-muted)] font-mono focus:outline-none focus:border-[#EA5652]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.branch || ''}
                              onChange={(e) => handleTableRowChange(index, 'branch', e.target.value)}
                              placeholder="CSE / IT"
                              className="w-full px-2 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-[var(--text-secondary)] focus:outline-none focus:border-[#EA5652]"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleTableDeleteRow(index)}
                              title="Delete this student row"
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Primary Actions Bar */}
          <div className="card-base p-4 bg-[var(--surface-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <ShieldAlert className="w-4 h-4 text-[#EA5652]" />
              <span>
                Saving to file modifies <code className="text-[#EA5652] font-mono">{editorFilename}</code> on disk. To update live student profiles and metrics, click <strong>Validate & Preview Import</strong>.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveToDisk}
                disabled={isSavingDisk || !!editorError}
                className="px-4 py-2.5 rounded-lg bg-[#EA5652] hover:bg-[#832008] text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDisk ? 'Saving to Disk...' : `Save to File (${editorFilename})`}</span>
              </button>

              <button
                onClick={handlePreviewFromEditor}
                disabled={previewLoading || !!editorError || editorRecordsCount === 0}
                className="px-4 py-2.5 rounded-lg bg-[var(--accent-blue)] hover:opacity-95 text-white text-xs font-semibold disabled:opacity-50 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span>{previewLoading ? 'Validating Roster...' : 'Validate & Preview Import'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: UPLOAD JSON */}
      {activeTab === 'upload' && (
        <div className="card-base p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-color)] mx-auto flex items-center justify-center text-[var(--accent-blue)] shadow-md">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Select or Drop College Student JSON File
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Expects array schema: <code className="text-amber-400 font-mono">[{'{"name", "leetcode_id", "gfg_id", "codechef_id"}'}]</code>
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <label className="cursor-pointer px-4 py-2.5 rounded-lg bg-[var(--accent-blue)] hover:opacity-95 text-white text-xs font-medium transition-opacity shadow-sm flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Choose JSON File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {file && (
              <button
                type="button"
                onClick={handleOpenUploadedInEditor}
                className="px-4 py-2.5 rounded-lg bg-[#EA5652]/10 border border-[#EA5652]/40 hover:bg-[#EA5652]/20 text-[#EA5652] text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                <FileEdit className="w-4 h-4 text-[#EA5652]" />
                <span>Open & Edit in JSON Editor</span>
              </button>
            )}
          </div>

          {file && (
            <div className="text-xs font-mono text-emerald-400">
              Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border-color)] max-w-lg mx-auto text-xs text-[var(--text-muted)]">
            <span>Want to modify existing college records directly? </span>
            <button
              onClick={() => {
                setActiveTab('edit');
                loadFileIntoEditor('sample_college_students.json');
              }}
              className="text-[#EA5652] hover:underline font-medium ml-1 inline-flex items-center gap-1"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Open sample_college_students.json in Editor</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PASTE JSON */}
      {activeTab === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="card-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-primary)]">
              Paste Raw Student JSON Roster
            </label>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Valid JSON Array Required
            </span>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={10}
            placeholder={`[\n  {\n    "name": "Aarav Sharma",\n    "leetcode_id": "aarav_coder",\n    "gfg_id": "aarav101",\n    "codechef_id": "aarav_cc"\n  }\n]`}
            className="w-full p-4 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setJsonText('')}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={previewLoading}
              className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              {previewLoading ? 'Validating...' : 'Validate & Preview Roster'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="card-base overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)]">
            Past Import Executions
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)]">
              <tr>
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4">Total Records</th>
                <th className="py-2.5 px-4">Valid Entries</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Execution Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {historyJobs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[var(--text-muted)]">
                    No import history logged yet.
                  </td>
                </tr>
              ) : (
                historyJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                      {job.filename}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{job.total_records}</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">{job.valid_records}</td>
                    <td className="py-2.5 px-4">
                      <span className="badge-base bg-emerald-500/15 text-emerald-400 font-mono text-[10px]">
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)] font-mono">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* POST-COMMIT RESULTS SUMMARY (Displayed after successful commit) */}
      {commitResult && (
        <div className="card-base p-6 space-y-5 border-emerald-500/50 bg-emerald-500/5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Student Roster Import & Database Commit Completed
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  File: <span className="font-mono text-[var(--text-primary)]">{commitResult.filename}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCommitResult(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Dismiss
              </button>
              <button
                onClick={() => navigate('/students')}
                className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                <span>View Students Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Result Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-base p-3 bg-[var(--surface-elevated)]">
              <span className="text-[10px] text-blue-400 uppercase font-semibold">New Students Added</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                {commitResult.created}
              </div>
            </div>

            <div className="card-base p-3 bg-[var(--surface-elevated)]">
              <span className="text-[10px] text-purple-400 uppercase font-semibold">Existing Records Updated</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {commitResult.updated}
              </div>
            </div>

            <div className="card-base p-3 bg-[var(--surface-elevated)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Duplicates Skipped</span>
              <div className="text-2xl font-bold font-mono text-[var(--text-muted)] mt-1">
                {commitResult.skipped}
              </div>
            </div>

            <div className="card-base p-3 bg-emerald-500/10 border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Total Processed</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {commitResult.totalProcessed}
              </div>
            </div>
          </div>

          {/* Background Live Profile Fetch Notice */}
          {commitResult.autoSyncStarted && (
            <div className="p-3.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--accent-teal)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-[var(--accent-teal)] animate-spin shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">
                    Live Profile Analytics Fetching in Background
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Platform connectors are querying LeetCode, GFG, CodeChef, GitHub, and HackerRank via controlled background concurrency without blocking your dashboard.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/synchronization')}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-teal)]/15 border border-[var(--accent-teal)]/40 hover:bg-[var(--accent-teal)]/25 text-[var(--accent-teal)] text-xs font-medium transition-colors shrink-0 whitespace-nowrap"
              >
                Track Sync Progress
              </button>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW SECTION (Displayed after validation) */}
      {previewData && (
        <div className="card-base p-6 space-y-6 border-[var(--accent-blue)]/50 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Import Validation Summary
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                File: <span className="font-mono text-[var(--text-primary)]">{previewData.filename}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewData(null)}
                className="px-3.5 py-2 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCommit}
                disabled={commitLoading || previewData.valid_records === 0}
                className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span>{commitLoading ? 'Committing to Master...' : 'Confirm & Commit Roster'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Policy & Auto-Sync Controls Bar */}
          <div className="p-3.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[var(--text-secondary)]">Duplicate Record Policy:</span>
              <select
                value={duplicatePolicy}
                onChange={(e) => setDuplicatePolicy(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[var(--surface-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[#EA5652]"
              >
                <option value="update">Update Existing Records (Keep Historical Snapshots)</option>
                <option value="skip">Skip Existing Records (Insert New Only)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded border-[var(--border-color)] text-[#EA5652] focus:ring-0"
              />
              <span className="font-medium text-xs">Automatically fetch live platform stats after import</span>
            </label>
          </div>

          {/* Validation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="card-base p-3 bg-[var(--surface-elevated)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Total In File</span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {previewData.total_records}
              </div>
            </div>

            <div className="card-base p-3 bg-emerald-500/10 border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase">Valid Entries</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {previewData.valid_records}
              </div>
            </div>

            <div className="card-base p-3 bg-blue-500/10 border-blue-500/30">
              <span className="text-[10px] text-blue-400 uppercase">New Students</span>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                {previewData.new_students}
              </div>
            </div>

            <div className="card-base p-3 bg-purple-500/10 border-purple-500/30">
              <span className="text-[10px] text-purple-400 uppercase">To Update</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                {previewData.existing_students_to_update}
              </div>
            </div>

            <div className="card-base p-3 bg-rose-500/10 border-rose-500/30">
              <span className="text-[10px] text-rose-400 uppercase">Invalid / Issues</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {previewData.invalid_records + previewData.duplicates_in_file}
              </div>
            </div>
          </div>

          {/* Preview Rows Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Record Mapping Preview (Showing up to 100 entries)
            </span>

            <div className="border border-[var(--border-color)] rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-elevated)] text-[var(--text-secondary)] sticky top-0 border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">LeetCode</th>
                    <th className="py-2.5 px-3">GFG</th>
                    <th className="py-2.5 px-3">CodeChef</th>
                    <th className="py-2.5 px-3">Planned Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] font-mono text-[11px]">
                  {previewData.preview?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2 px-3">
                        {p.status === 'new' && (
                          <span className="text-blue-400 font-semibold">New</span>
                        )}
                        {p.status === 'existing_match' && (
                          <span className="text-purple-400 font-semibold">Update</span>
                        )}
                        {p.status === 'invalid' && (
                          <span className="text-rose-400 font-semibold">Invalid</span>
                        )}
                        {p.status === 'duplicate_in_file' && (
                          <span className="text-amber-400 font-semibold">Duplicate</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium text-[var(--text-primary)]">
                        {p.record?.name || '—'}
                      </td>
                      <td className="py-2 px-3 text-amber-400">
                        {p.record?.leetcode_id || '—'}
                      </td>
                      <td className="py-2 px-3 text-emerald-400">
                        {p.record?.gfg_id || '—'}
                      </td>
                      <td className="py-2 px-3 text-purple-400">
                        {p.record?.codechef_id || '—'}
                      </td>
                      <td className="py-2 px-3 text-[var(--text-muted)] font-sans">
                        {p.errors ? p.errors.join(', ') : p.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
