"use client";

import { useMemo, useState } from "react";

import type {
  DocumentInfo,
  SharedDocumentInfo,
} from "@/lib/supabase/documents";

type DashboardProps = {
  userName: string;
  userEmail: string;
  documents: DocumentInfo[];
  sharedDocuments: SharedDocumentInfo[];
  onCreateDocument: () => void;
  onOpenDocument: (name: string) => void;
  onCopyLink: (name: string) => void;
  onRenameDocument: (
    id: string,
    name: string
  ) => Promise<void>;
  onDeleteDocument: (
    id: string
  ) => Promise<void>;
  onLogout: () => void;
};

export default function Dashboard({
  userName,
  userEmail,
  documents,
  sharedDocuments,
  onCreateDocument,
  onOpenDocument,
  onCopyLink,
  onRenameDocument,
  onDeleteDocument,
  onLogout,
}: DashboardProps) {
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const filteredDocuments =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return documents;
      }

      return documents.filter(
        (document) =>
          document.name
            .toLowerCase()
            .includes(query)
      );
    }, [
      documents,
      searchQuery,
    ]);

  const filteredSharedDocuments =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return sharedDocuments;
      }

      return sharedDocuments.filter(
        (document) =>
          document.name
            .toLowerCase()
            .includes(query)
      );
    }, [
      sharedDocuments,
      searchQuery,
    ]);

  const startRename = (
    document: DocumentInfo
  ) => {
    setEditingId(document.id);
    setEditingName(document.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveRename = async () => {
    if (!editingId) {
      return;
    }

    const trimmedName =
      editingName.trim();

    if (!trimmedName) {
      return;
    }

    await onRenameDocument(
      editingId,
      trimmedName
    );

    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (
    document: DocumentInfo
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${document.name}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(document.id);

    try {
      await onDeleteDocument(
        document.id
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>
            Welcome, {userName}
          </h2>

          <p>{userEmail}</p>

          <p>
            Your collaborative documents
          </p>
        </div>

        <div>
          <button
            className="create-document-button"
            onClick={
              onCreateDocument
            }
          >
            + New Document
          </button>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="document-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value
            )
          }
          placeholder="🔍 Search documents..."
        />

        {searchQuery && (
          <button
            className="clear-search-button"
            onClick={() =>
              setSearchQuery("")
            }
          >
            Clear
          </button>
        )}
      </div>

      <div className="documents-section">
        <h3>My Documents</h3>

        {documents.length === 0 ? (
          <div className="empty-documents">
            <div className="empty-icon">
              📄
            </div>

            <h3>
              No documents yet
            </h3>

            <p>
              Create your first document
              and start collaborating.
            </p>

            <button
              onClick={
                onCreateDocument
              }
            >
              Create Document
            </button>
          </div>
        ) : filteredDocuments.length ===
          0 ? (
          <div className="empty-documents">
            <div className="empty-icon">
              🔍
            </div>

            <h3>
              No documents found
            </h3>

            <p>
              No documents match "
              {searchQuery}".
            </p>
          </div>
        ) : (
          <div className="document-list">
            {filteredDocuments.map(
              (document) => (
                <div
                  className="document-card"
                  key={document.id}
                >
                  <div className="document-info">
                    <div className="document-icon">
                      📄
                    </div>

                    <div className="document-details">
                      {editingId ===
                      document.id ? (
                        <div className="rename-box">
                          <input
                            autoFocus
                            value={
                              editingName
                            }
                            onChange={(
                              event
                            ) =>
                              setEditingName(
                                event
                                  .target
                                  .value
                              )
                            }
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                saveRename();
                              }

                              if (
                                event.key ===
                                "Escape"
                              ) {
                                cancelRename();
                              }
                            }}
                          />

                          <button
                            onClick={
                              saveRename
                            }
                          >
                            Save
                          </button>

                          <button
                            onClick={
                              cancelRename
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3>
                            {
                              document.name
                            }
                          </h3>

                          <p>
                            Last updated:{" "}
                            {new Date(
                              document.updated_at
                            ).toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId !==
                    document.id && (
                    <div className="document-actions">
                      <button
                        onClick={() =>
                          onOpenDocument(
                            document.room_name
                          )
                        }
                      >
                        Open
                      </button>

                      <button
                        onClick={() =>
                          onCopyLink(
                            document.room_name
                          )
                        }
                      >
                        Copy Link
                      </button>

                      <button
                        onClick={() =>
                          startRename(
                            document
                          )
                        }
                      >
                        Rename
                      </button>

                      <button
                        className="delete-button"
                        disabled={
                          deletingId ===
                          document.id
                        }
                        onClick={() =>
                          handleDelete(
                            document
                          )
                        }
                      >
                        {deletingId ===
                        document.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="documents-section shared-documents-section">
        <h3>Shared with me</h3>

        {sharedDocuments.length ===
        0 ? (
          <div className="empty-shared-documents">
            <div className="empty-icon">
              🤝
            </div>

            <h3>
              No shared documents
            </h3>

            <p>
              Documents shared with you
              will appear here.
            </p>
          </div>
        ) : filteredSharedDocuments.length ===
          0 ? (
          <div className="empty-shared-documents">
            <div className="empty-icon">
              🔍
            </div>

            <h3>
              No shared documents found
            </h3>

            <p>
              No shared documents match "
              {searchQuery}".
            </p>
          </div>
        ) : (
          <div className="document-list">
            {filteredSharedDocuments.map(
              (document) => (
                <div
                  className="document-card"
                  key={document.id}
                >
                  <div className="document-info">
                    <div className="document-icon">
                      🤝
                    </div>

                    <div>
                      <h3>
                        {
                          document.name
                        }
                      </h3>

                      <p>
                        Last updated:{" "}
                        {new Date(
                          document.updated_at
                        ).toLocaleString()}
                      </p>

                      <span className="shared-role">
                        {document.role}
                      </span>
                    </div>
                  </div>

                  <div className="document-actions">
                    <button
                      onClick={() =>
                        onOpenDocument(
                          document.room_name
                        )
                      }
                    >
                      Open
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}