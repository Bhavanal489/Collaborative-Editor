"use client";

import { useEffect, useState } from "react";

import {
  HocuspocusProviderWebsocketComponent,
  HocuspocusRoom,
} from "@hocuspocus/provider-react";

import { createClient } from "@/lib/supabase/client";

import {
  createDocument,
  getDocuments,
  getSharedDocuments,
  getDocumentByRoom,
  getDocumentRole,
  renameDocument,
  deleteDocument,
  type DocumentInfo,
  type SharedDocumentInfo,
  type DocumentRole,
} from "@/lib/supabase/documents";

import Editor from "@/components/Editor";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [userName, setUserName] =
    useState("");

  const [userEmail, setUserEmail] =
    useState("");

  const [documents, setDocuments] =
    useState<DocumentInfo[]>([]);

  const [sharedDocuments, setSharedDocuments] =
    useState<SharedDocumentInfo[]>([]);

  const [documentName, setDocumentName] =
    useState("");

  const [currentDocumentId, setCurrentDocumentId] =
    useState("");

  const [currentRole, setCurrentRole] =
    useState<DocumentRole | null>(null);

  const [joined, setJoined] =
    useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [roomKey, setRoomKey] =
    useState(0);

  const [copied, setCopied] =
    useState(false);

  const [sharedRoom, setSharedRoom] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const loadUserAndDocuments =
      async () => {
        const supabase =
          createClient();

        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          window.location.href =
            "/login";
          return;
        }

        const name =
          user.user_metadata
            ?.full_name ||
          user.email?.split("@")[0] ||
          "User";

        setUserName(name);
        setUserEmail(
          user.email || ""
        );

        try {
          const [
            userDocuments,
            userSharedDocuments,
          ] = await Promise.all([
            getDocuments(),
            getSharedDocuments(),
          ]);

          setDocuments(
            userDocuments
          );

          setSharedDocuments(
            userSharedDocuments
          );
        } catch (error) {
          console.error(
            "Failed to load documents:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your documents."
          );
        }

        const params =
          new URLSearchParams(
            window.location.search
          );

        const roomFromUrl =
          params.get("room");

        if (roomFromUrl) {
          setDocumentName(
            roomFromUrl
          );

          setSharedRoom(true);
        }

        setLoaded(true);
      };

    loadUserAndDocuments();
  }, []);

  const openDocument = async (
    name: string
  ) => {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      return;
    }

    setErrorMessage("");

    try {
      const document =
        await getDocumentByRoom(
          trimmedName
        );

      const role =
        await getDocumentRole(
          document.id
        );

      setDocumentName(
        document.room_name
      );

      setCurrentDocumentId(
        document.id
      );

      setCurrentRole(role);

      window.history.replaceState(
        null,
        "",
        `/?room=${encodeURIComponent(
          document.room_name
        )}`
      );

      setSharedRoom(false);

      setRoomKey(
        (current) => current + 1
      );

      setJoined(true);
    } catch (error) {
      console.error(
        "Failed to open document:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "This document does not exist or you do not have access to it."
      );
    }
  };

  const handleCreateDocument =
    async () => {
      const trimmedName =
        documentName.trim();

      if (!trimmedName) {
        setErrorMessage(
          "Document name cannot be empty."
        );
        return;
      }

      setErrorMessage("");

      try {
        const newDocument =
          await createDocument(
            trimmedName
          );

        setDocuments((current) => [
          newDocument,
          ...current,
        ]);

        setShowCreateForm(false);

        setDocumentName("");

        await openDocument(
          newDocument.room_name
        );
      } catch (error) {
        console.error(
          "Failed to create document:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to create the document."
        );
      }
    };

  const handleRenameDocument =
    async (
      id: string,
      name: string
    ) => {
      setErrorMessage("");

      try {
        const updatedDocument =
          await renameDocument(
            id,
            name
          );

        setDocuments((current) =>
          current.map(
            (document) =>
              document.id === id
                ? updatedDocument
                : document
          )
        );
      } catch (error) {
        console.error(
          "Failed to rename document:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to rename the document."
        );

        throw error;
      }
    };

  const handleDeleteDocument =
    async (id: string) => {
      setErrorMessage("");

      try {
        await deleteDocument(id);

        setDocuments((current) =>
          current.filter(
            (document) =>
              document.id !== id
          )
        );
      } catch (error) {
        console.error(
          "Failed to delete document:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to delete the document."
        );

        throw error;
      }
    };

  const createNewDocument =
    () => {
      setErrorMessage("");
      setDocumentName("");
      setShowCreateForm(true);
    };

  const copyDocumentLink =
    async (name: string) => {
      const link = `${
        window.location.origin
      }/?room=${encodeURIComponent(
        name
      )}`;

      try {
        await navigator.clipboard.writeText(
          link
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        setCopied(false);
      }
    };

  const copyCurrentRoomLink =
    async () => {
      await copyDocumentLink(
        documentName
      );
    };

  const backToDashboard =
    async () => {
      setErrorMessage("");

      setJoined(false);
      setSharedRoom(false);
      setCopied(false);
      setCurrentDocumentId("");
      setCurrentRole(null);
      setDocumentName("");

      window.history.replaceState(
        null,
        "",
        "/"
      );

      try {
        const [
          userDocuments,
          userSharedDocuments,
        ] = await Promise.all([
          getDocuments(),
          getSharedDocuments(),
        ]);

        setDocuments(
          userDocuments
        );

        setSharedDocuments(
          userSharedDocuments
        );
      } catch (error) {
        console.error(
          "Failed to refresh documents:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to refresh documents."
        );
      }
    };

  const logout = async () => {
    const supabase =
      createClient();

    await supabase.auth.signOut();

    window.location.href =
      "/login";
  };

  if (!loaded) {
    return null;
  }

  return (
    <main>
      <h1>
        Collaborative Workspace
      </h1>

      <p>
        Real-time collaborative
        document editor
      </p>

      {errorMessage && (
        <p className="auth-message">
          {errorMessage}
        </p>
      )}

      {!joined ? (
        <>
          {sharedRoom ? (
            <div className="shared-room-box">
              <div className="shared-room-icon">
                🔗
              </div>

              <h2>
                Shared Document
              </h2>

              <p>
                You have been invited
                to collaborate on:
              </p>

              <strong>
                {documentName}
              </strong>

              <p className="shared-user-info">
                You are signed in as{" "}
                <strong>
                  {userName}
                </strong>
              </p>

              <button
                onClick={() =>
                  openDocument(
                    documentName
                  )
                }
              >
                Open & Collaborate
              </button>
            </div>
          ) : (
            <>
              <Dashboard
                userName={userName}
                userEmail={userEmail}
                documents={documents}
                sharedDocuments={
                  sharedDocuments
                }
                onCreateDocument={
                  createNewDocument
                }
                onOpenDocument={
                  openDocument
                }
                onCopyLink={
                  copyDocumentLink
                }
                onRenameDocument={
                  handleRenameDocument
                }
                onDeleteDocument={
                  handleDeleteDocument
                }
                onLogout={logout}
              />

              {showCreateForm && (
                <div className="create-document-overlay">
                  <div className="create-document-box">
                    <h2>
                      Create New Document
                    </h2>

                    <label>
                      Document name:

                      <input
                        autoFocus
                        value={
                          documentName
                        }
                        onChange={(
                          event
                        ) =>
                          setDocumentName(
                            event.target.value
                          )
                        }
                        placeholder="e.g. Project Report"
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            handleCreateDocument();
                          }
                        }}
                      />
                    </label>

                    <div className="create-document-actions">
                      <button
                        onClick={
                          handleCreateDocument
                        }
                      >
                        Create
                      </button>

                      <button
                        onClick={() => {
                          setShowCreateForm(
                            false
                          );
                          setErrorMessage(
                            ""
                          );
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <HocuspocusProviderWebsocketComponent
            key={roomKey}
            url={
              process.env
                .NEXT_PUBLIC_COLLAB_URL
            }
          >
            <HocuspocusRoom
              name={documentName}
              token={async () => {
                const supabase =
                  createClient();

                const {
                  data: {
                    session,
                  },
                } =
                  await supabase.auth.getSession();

                return (
                  session?.access_token ||
                  ""
                );
              }}
              onAuthenticationFailed={({
                reason,
              }) => {
                console.error(
                  "Hocuspocus authentication failed:",
                  reason
                );

                setErrorMessage(
                  "You are not authorized to access this document."
                );
              }}
            >
              <Editor
                userName={userName}
                documentName={
                  documentName
                }
                documentId={
                  currentDocumentId
                }
                role={
                  currentRole ||
                  "viewer"
                }
              />
            </HocuspocusRoom>
          </HocuspocusProviderWebsocketComponent>

          <div className="editor-actions">
            <button
              onClick={
                copyCurrentRoomLink
              }
            >
              {copied
                ? "Link Copied!"
                : "Copy Room Link"}
            </button>

            <button
              onClick={
                backToDashboard
              }
            >
              ← Documents
            </button>
          </div>
        </>
      )}
    </main>
  );
}