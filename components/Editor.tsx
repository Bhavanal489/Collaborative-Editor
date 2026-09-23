"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

import {
  useHocuspocusAwareness,
  useHocuspocusConnectionStatus,
  useHocuspocusProvider,
} from "@hocuspocus/provider-react";

import { IndexeddbPersistence } from "y-indexeddb";

import Toolbar from "./Toolbar";
import ShareDialog from "./ShareDialog";

const USER_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#ea580c",
  "#db2777",
  "#0891b2",
];

function getUserColor(name: string) {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash =
      name.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  const index =
    Math.abs(hash) % USER_COLORS.length;

  return USER_COLORS[index];
}

type EditorProps = {
  userName: string;
  documentName: string;
  documentId: string;
  role: "owner" | "editor" | "viewer";
};

export default function Editor({
  userName,
  documentName,
  documentId,
  role,
}: EditorProps) {
  const provider =
    useHocuspocusProvider();

  const users =
    useHocuspocusAwareness();

  const connectionStatus =
    useHocuspocusConnectionStatus();

  const [showShare, setShowShare] =
    useState(false);

  const userColor =
    getUserColor(userName);

  const isViewer =
    role === "viewer";

  const canShare =
    role === "owner";

  const persistenceRef =
    useRef<IndexeddbPersistence | null>(
      null
    );

  if (!persistenceRef.current) {
    persistenceRef.current =
      new IndexeddbPersistence(
        documentName,
        provider.document
      );
  }

  useEffect(() => {
    return () => {
      persistenceRef.current?.destroy();
      persistenceRef.current = null;
    };
  }, []);

  const editor = useEditor({
    editable: !isViewer,

    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),

      Collaboration.configure({
        document: provider.document,
      }),

      CollaborationCaret.configure({
        provider,

        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],

    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.updateUser({
      name: userName,
      color: userColor,
    });

    editor.setEditable(!isViewer);
  }, [
    editor,
    userName,
    userColor,
    isViewer,
  ]);

  if (!editor) {
    return null;
  }

  const isConnected =
    connectionStatus === "connected";

  const isConnecting =
    connectionStatus === "connecting";

  const isOffline =
    connectionStatus === "disconnected";

  return (
    <div className="editor-container">
      <div className="workspace-header">
        <div>
          <strong>
            Document
          </strong>

          <span className="document-name">
            {documentName}
          </span>

          <span className="document-role">
            {role}
          </span>
        </div>

        <div className="workspace-header-actions">
          <div className="workspace-status">
            <span
              className={`status-dot ${
                isConnected
                  ? "online"
                  : isConnecting
                    ? "connecting"
                    : "offline"
              }`}
            />

            {isConnected
              ? "Online"
              : isConnecting
                ? "Connecting..."
                : "Offline"}
          </div>

          {canShare && (
            <button
              className="share-button"
              onClick={() =>
                setShowShare(true)
              }
            >
              Share
            </button>
          )}
        </div>
      </div>

      {isConnecting && (
        <div className="connection-notice connecting-notice">
          Connecting to collaboration server...
        </div>
      )}

      {isOffline && (
        <div className="connection-notice offline-notice">
          Connection lost. Trying to reconnect...
          Your local changes are saved.
        </div>
      )}

      {isViewer && (
        <div className="viewer-notice">
          You have viewer access. This
          document is read-only.
        </div>
      )}

      <div className="collaborators">
        <div>
          <strong>
            People in this document
          </strong>

          <span className="online-count">
            {users.length} online
          </span>
        </div>

        <div className="user-list">
          {users.map((user) => {
            const userInfo =
              user.user as
                | {
                    name?: string;
                    color?: string;
                  }
                | undefined;

            const name =
              userInfo?.name ||
              "Unknown user";

            const color =
              userInfo?.color ||
              "#7c3aed";

            return (
              <div
                className="user-item"
                key={user.clientId}
              >
                <span
                  className="user-avatar"
                  style={{
                    backgroundColor:
                      color,
                  }}
                >
                  {name[0]?.toUpperCase() ||
                    "U"}
                </span>

                <span className="user-name">
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {!isViewer && (
        <Toolbar editor={editor} />
      )}

      <EditorContent
        editor={editor}
      />

      {showShare && (
        <ShareDialog
          documentId={documentId}
          documentName={documentName}
          onClose={() =>
            setShowShare(false)
          }
        />
      )}
    </div>
  );
}