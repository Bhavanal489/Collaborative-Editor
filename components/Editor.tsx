"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % USER_COLORS.length;

  return USER_COLORS[index];
}

type EditorProps = {
  userName: string;
  documentName: string;
};

export default function Editor({
  userName,
  documentName,
}: EditorProps) {
  // Hocuspocus provider
  const provider = useHocuspocusProvider();

  // Connected users
  const users = useHocuspocusAwareness();

  // WebSocket connection status
  const connectionStatus = useHocuspocusConnectionStatus();

  // User color
  const userColor = getUserColor(userName);

  // IndexedDB persistence
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);

  if (!persistenceRef.current) {
    persistenceRef.current = new IndexeddbPersistence(
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

  // Tiptap editor
  const editor = useEditor({
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

  // Update user information
  useEffect(() => {
    if (!editor) return;

    editor.commands.updateUser({
      name: userName,
      color: userColor,
    });
  }, [editor, userName, userColor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container">
      <div className="workspace-header">
        <div>
          <strong>Document</strong>

          <span className="document-name">
            {documentName}
          </span>
        </div>

        <div className="workspace-status">
          <span
            className={`status-dot ${
              connectionStatus === "connected"
                ? "online"
                : connectionStatus === "connecting"
                  ? "connecting"
                  : "offline"
            }`}
          />

          {connectionStatus === "connected"
            ? "Online"
            : connectionStatus === "connecting"
              ? "Connecting..."
              : "Offline"}
        </div>
      </div>

      <div className="collaborators">
        <div>
          <strong>People in this document</strong>

          <span className="online-count">
            {users.length} online
          </span>
        </div>

        <div className="user-list">
          {users.map((user) => {
            const userInfo = user.user as
              | {
                  name?: string;
                  color?: string;
                }
              | undefined;

            const name = userInfo?.name || "Unknown user";
            const color = userInfo?.color || "#7c3aed";

            return (
              <div
                className="user-item"
                key={user.clientId}
              >
                <span
                  className="user-avatar"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  {name[0]?.toUpperCase() || "U"}
                </span>

                <span className="user-name">
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Toolbar editor={editor} />

      <EditorContent editor={editor} />
    </div>
  );
}