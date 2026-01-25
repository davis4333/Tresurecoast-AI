"use client";

import { useState, useEffect, useCallback } from "react";
import { TcaButton } from "@/components/tca/TcaButton";
import { Plus, Pencil, Trash2, BookOpen, FileText, Link as LinkIcon } from "lucide-react";

type Bot = {
  publicKey: string;
  name: string;
  status: string;
};

type KnowledgeSource = {
  id: number;
  title: string;
  type: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt?: string;
};

type FormData = {
  title: string;
  content: string;
};

type FormErrors = {
  title?: string;
  content?: string;
};

const emptyForm: FormData = {
  title: "",
  content: "",
};

export default function KnowledgeBasePage() {
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotKey, setSelectedBotKey] = useState<string | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bots");
      const data = await res.json();
      if (data.ok && data.bots?.length > 0) {
        setBots(data.bots);
        if (!selectedBotKey) {
          setSelectedBotKey(data.bots[0].publicKey);
        }
      } else {
        setBots([]);
      }
    } catch {
      setError("Failed to load bots");
    }
  }, [selectedBotKey]);

  const fetchSources = useCallback(async () => {
    if (!selectedBotKey) {
      setSources([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/org/bots/${selectedBotKey}/knowledge`);
      const data = await res.json();
      if (data.ok) {
        setSources(data.sources || []);
      } else {
        setError(data.message || "Failed to load knowledge sources");
        setSources([]);
      }
    } catch {
      setError("Failed to load knowledge sources");
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBotKey]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    if (selectedBotKey) {
      setLoading(true);
      fetchSources();
    }
  }, [selectedBotKey, fetchSources]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length > 200) {
      errors.title = "Title must be 200 characters or less";
    }

    if (!formData.content.trim()) {
      errors.content = "Content is required";
    } else if (formData.content.trim().length < 100) {
      errors.content = "Content must be at least 100 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setEditingSource(null);
    setFormData(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = async (source: KnowledgeSource) => {
    setEditingSource(source);
    setFormErrors({});
    setModalOpen(true);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/org/bots/${selectedBotKey}/knowledge/${source.id}`);
      const data = await res.json();
      if (data.ok && data.source) {
        setFormData({
          title: data.source.title,
          content: data.source.content || "",
        });
      } else {
        setError("Failed to load source content");
        closeModal();
      }
    } catch {
      setError("Failed to load source content");
      closeModal();
    } finally {
      setLoadingContent(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSource(null);
    setFormData(emptyForm);
    setFormErrors({});
    setLoadingContent(false);
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedBotKey) return;

    setSaving(true);
    setError(null);

    try {
      const url = editingSource
        ? `/api/org/bots/${selectedBotKey}/knowledge/${editingSource.id}`
        : `/api/org/bots/${selectedBotKey}/knowledge`;

      const method = editingSource ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        showSuccess(editingSource ? "Knowledge source updated" : "Knowledge source created");
        closeModal();
        fetchSources();
      } else {
        if (data.error === "duplicate_content") {
          setFormErrors({ content: "A source with this content already exists" });
        } else if (data.error === "forbidden") {
          setError("Admin access required");
          closeModal();
        } else {
          setError(data.message || "Something went wrong");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sourceId: number) => {
    if (!selectedBotKey) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/org/bots/${selectedBotKey}/knowledge/${sourceId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.ok) {
        showSuccess("Knowledge source deleted");
        setDeleteConfirmId(null);
        fetchSources();
      } else if (data.error === "forbidden") {
        setError("Admin access required");
      } else {
        setError(data.message || "Failed to delete source");
      }
    } catch {
      setError("Failed to delete source");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (sourceId: number, currentStatus: string | undefined) => {
    if (!selectedBotKey) return;

    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    try {
      const res = await fetch(`/api/org/bots/${selectedBotKey}/knowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, status: newStatus }),
      });

      const data = await res.json();

      if (data.ok) {
        showSuccess(`Knowledge source ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`);
        fetchSources();
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch {
      setError('Failed to update status');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "URL":
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const contentLength = formData.content.length;

  if (loading && bots.length === 0) {
    return (
      <div className="p-6">
        <div className="tca-page-header">
          <h1 className="tca-page-title">Knowledge Base</h1>
          <p className="tca-page-subtitle">Loading...</p>
        </div>
        <div className="tca-card p-6 max-w-4xl animate-pulse">
          <div className="h-12 bg-[var(--color-surface-hover)] rounded mb-4" />
          <div className="h-12 bg-[var(--color-surface-hover)] rounded mb-4" />
          <div className="h-12 bg-[var(--color-surface-hover)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="tca-page-header">
        <h1 className="tca-page-title">Knowledge Base</h1>
        <p className="tca-page-subtitle">
          Manage knowledge sources that power your bot&apos;s responses
        </p>
      </div>

      {error && (
        <div className="mb-6 max-w-4xl rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400" data-testid="text-error">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 max-w-4xl rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm text-green-400" data-testid="text-success">{successMessage}</p>
        </div>
      )}

      {bots.length === 0 ? (
        <div className="tca-card p-6 max-w-4xl">
          <div className="text-center py-12" data-testid="empty-state-no-bots">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              No bots available
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
              Create a bot first to start adding knowledge sources.
            </p>
          </div>
        </div>
      ) : (
        <>
          {bots.length > 1 && (
            <div className="mb-6 max-w-4xl">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Select Bot
              </label>
              <select
                value={selectedBotKey || ""}
                onChange={(e) => setSelectedBotKey(e.target.value)}
                className="tca-input max-w-xs"
                data-testid="select-bot"
              >
                {bots.map((bot) => (
                  <option key={bot.publicKey} value={bot.publicKey}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="tca-card p-6 max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {bots.find((b) => b.publicKey === selectedBotKey)?.name || "Bot"} Knowledge
              </h2>
              <TcaButton
                onClick={openAddModal}
                data-testid="button-add-source"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </TcaButton>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-[var(--color-surface-hover)] rounded" />
                <div className="h-12 bg-[var(--color-surface-hover)] rounded" />
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  No knowledge sources yet
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-4">
                  Add knowledge sources to help your bot provide accurate, relevant responses.
                </p>
                <TcaButton
                  onClick={openAddModal}
                  data-testid="button-add-source-empty"
                >
                  Add Knowledge Source
                </TcaButton>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                    data-testid={`source-row-${source.id}`}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
                      {getTypeIcon(source.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-medium text-[var(--color-text-primary)] truncate"
                          data-testid={`text-source-title-${source.id}`}
                        >
                          {source.title}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                          data-testid={`badge-type-${source.id}`}
                        >
                          {source.type}
                        </span>
                        {source.status && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              source.status === 'PUBLISHED'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : source.status === 'DRAFT'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                            }`}
                            data-testid={`badge-status-${source.id}`}
                          >
                            {source.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Added {formatDate(source.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Publish/Unpublish button */}
                      {source.status === 'DRAFT' && (
                        <button
                          onClick={() => handleTogglePublish(source.id, source.status)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                          data-testid={`button-publish-${source.id}`}
                          aria-label="Publish source"
                        >
                          Publish
                        </button>
                      )}
                      {source.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleTogglePublish(source.id, source.status)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                          data-testid={`button-unpublish-${source.id}`}
                          aria-label="Unpublish source"
                        >
                          Unpublish
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(source)}
                        className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        data-testid={`button-edit-${source.id}`}
                        aria-label="Edit source"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(source.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400"
                        data-testid={`button-delete-${source.id}`}
                        aria-label="Delete source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          data-testid="modal-source"
        >
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl border border-[var(--color-border)] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              {editingSource ? "Edit Knowledge Source" : "Add Knowledge Source"}
            </h2>

            {loadingContent ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-[var(--color-surface-hover)] rounded" />
                <div className="h-40 bg-[var(--color-surface-hover)] rounded" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Business Hours & Policies"
                    className={`tca-input ${formErrors.title ? "border-red-500" : ""}`}
                    maxLength={200}
                    data-testid="input-title"
                  />
                  <div className="flex justify-between mt-1">
                    {formErrors.title ? (
                      <p className="text-xs text-red-400" data-testid="error-title">
                        {formErrors.title}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formData.title.length}/200
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter the knowledge content here. This will be used to help your bot provide accurate responses..."
                    rows={10}
                    className={`tca-input resize-y ${formErrors.content ? "border-red-500" : ""}`}
                    data-testid="input-content"
                  />
                  <div className="flex justify-between mt-1">
                    {formErrors.content ? (
                      <p className="text-xs text-red-400" data-testid="error-content">
                        {formErrors.content}
                      </p>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Minimum 100 characters
                      </span>
                    )}
                    <span
                      className={`text-xs ${
                        contentLength < 100 ? "text-amber-400" : "text-[var(--color-text-muted)]"
                      }`}
                      data-testid="text-char-count"
                    >
                      {contentLength} characters
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <TcaButton
                onClick={handleSave}
                disabled={saving || loadingContent}
                data-testid="button-save"
              >
                {saving ? "Saving..." : editingSource ? "Update" : "Create"}
              </TcaButton>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
          data-testid="modal-delete-confirm"
        >
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Delete Knowledge Source
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to delete this knowledge source? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                data-testid="button-confirm-delete"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
