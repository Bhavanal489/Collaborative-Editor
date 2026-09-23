"use client";

import { useEffect, useState } from "react";

import {
  addDocumentMember,
  getDocumentMembers,
  removeDocumentMember,
  updateDocumentMemberRole,
  type DocumentMember,
} from "@/lib/supabase/documents";

type ShareDialogProps = {
  documentId: string;
  documentName: string;
  onClose: () => void;
};

export default function ShareDialog({
  documentId,
  documentName,
  onClose,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");

  const [role, setRole] = useState<
    "editor" | "viewer"
  >("editor");

  const [members, setMembers] = useState<
    DocumentMember[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [sharing, setSharing] =
    useState(false);

  const [updatingMemberId, setUpdatingMemberId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const loadMembers = async () => {
    try {
      const data =
        await getDocumentMembers(
          documentId
        );

      setMembers(data);
    } catch (error) {
      console.error(
        "Failed to load members:",
        error
      );

      setMessage(
        "Unable to load collaborators."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [documentId]);

  const handleShare = async () => {
    const trimmedEmail =
      email.trim().toLowerCase();

    if (!trimmedEmail) {
      return;
    }

    setSharing(true);
    setMessage("");

    try {
      await addDocumentMember(
        documentId,
        trimmedEmail,
        role
      );

      setEmail("");

      setMessage(
        "User added successfully."
      );

      await loadMembers();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to share the document."
      );
    } finally {
      setSharing(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: "editor" | "viewer"
  ) => {
    setUpdatingMemberId(memberId);
    setMessage("");

    try {
      await updateDocumentMemberRole(
        memberId,
        newRole
      );

      setMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                role: newRole,
              }
            : member
        )
      );

      setMessage(
        "Collaborator role updated."
      );
    } catch (error) {
      console.error(
        "Failed to update role:",
        error
      );

      setMessage(
        "Unable to update collaborator role."
      );
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemove = async (
    memberId: string
  ) => {
    try {
      await removeDocumentMember(
        memberId
      );

      setMembers((current) =>
        current.filter(
          (member) =>
            member.id !== memberId
        )
      );

      setMessage(
        "User removed successfully."
      );
    } catch (error) {
      console.error(
        "Failed to remove member:",
        error
      );

      setMessage(
        "Unable to remove this user."
      );
    }
  };

  return (
    <div className="share-overlay">
      <div className="share-dialog">
        <div className="share-dialog-header">
          <div>
            <h2>
              Share Document
            </h2>

            <p>
              {documentName}
            </p>
          </div>

          <button
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="share-form">
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="Enter user's email"
          />

          <select
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as
                  | "editor"
                  | "viewer"
              )
            }
          >
            <option value="editor">
              Editor
            </option>

            <option value="viewer">
              Viewer
            </option>
          </select>

          <button
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing
              ? "Adding..."
              : "Add"}
          </button>
        </div>

        {message && (
          <p className="share-message">
            {message}
          </p>
        )}

        <div className="members-section">
          <h3>
            People with access
          </h3>

          {loading ? (
            <p>Loading...</p>
          ) : members.length === 0 ? (
            <p>
              No collaborators yet.
            </p>
          ) : (
            <div className="member-list">
              {members.map(
                (member) => {
                  const profile =
                    member.profile;

                  return (
                    <div
                      className="member-item"
                      key={
                        member.id
                      }
                    >
                      <div>
                        <strong>
                          {profile?.full_name ||
                            "User"}
                        </strong>

                        <span>
                          {profile?.email}
                        </span>
                      </div>

                      <div>
                        <select
                          className="member-role-select"
                          value={
                            member.role
                          }
                          disabled={
                            updatingMemberId ===
                            member.id
                          }
                          onChange={(
                            event
                          ) =>
                            handleRoleChange(
                              member.id,
                              event
                                .target
                                .value as
                                | "editor"
                                | "viewer"
                            )
                          }
                        >
                          <option value="editor">
                            Editor
                          </option>

                          <option value="viewer">
                            Viewer
                          </option>
                        </select>

                        <button
                          onClick={() =>
                            handleRemove(
                              member.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}