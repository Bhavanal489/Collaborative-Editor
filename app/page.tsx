"use client";

import { useEffect, useState } from "react";

import {
  HocuspocusProviderWebsocketComponent,
  HocuspocusRoom,
} from "@hocuspocus/provider-react";

import Editor from "@/components/Editor";

export default function Home() {
  const [userName, setUserName] = useState("Bhavana");
  const [documentName, setDocumentName] = useState("project-a");
  const [joined, setJoined] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [roomKey, setRoomKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Load workspace information for this tab
  useEffect(() => {
    const savedUserName = sessionStorage.getItem("userName");
    const savedDocumentName = sessionStorage.getItem("documentName");
    const savedJoined = sessionStorage.getItem("joined");

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room");

    if (savedUserName) {
      setUserName(savedUserName);
    }

    if (roomFromUrl) {
      setDocumentName(roomFromUrl);
    } else if (savedDocumentName) {
      setDocumentName(savedDocumentName);
    }

    if (savedJoined === "true" && !roomFromUrl) {
      setJoined(true);
    }

    setLoaded(true);
  }, []);

  // Join the selected document
  const joinWorkspace = () => {
    const name = userName.trim();
    const document = documentName.trim();

    if (!name || !document) {
      return;
    }

    setUserName(name);
    setDocumentName(document);

    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("documentName", document);
    sessionStorage.setItem("joined", "true");

    window.history.replaceState(
      null,
      "",
      `/?room=${encodeURIComponent(document)}`
    );

    setRoomKey((current) => current + 1);
    setJoined(true);
  };

  // Switch to another document
  const switchDocument = () => {
    sessionStorage.removeItem("joined");
    setJoined(false);
    setCopied(false);

    window.history.replaceState(
      null,
      "",
      "/"
    );
  };

  // Copy the current room link
  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <main>
      <h1>Collaborative Workspace</h1>

      <p>Real-time collaborative document editor</p>

      {!joined ? (
        <div className="join-box">
          <div>
            <label>
              Your name:
              <input
                value={userName}
                onChange={(event) =>
                  setUserName(event.target.value)
                }
                placeholder="Enter your name"
              />
            </label>
          </div>

          <div>
            <label>
              Document name:
              <input
                value={documentName}
                onChange={(event) =>
                  setDocumentName(event.target.value)
                }
                placeholder="Enter document name"
              />
            </label>
          </div>

          <button onClick={joinWorkspace}>
            Join Workspace
          </button>
        </div>
      ) : (
        <>
          <HocuspocusProviderWebsocketComponent
            key={roomKey}
            url={process.env.NEXT_PUBLIC_COLLAB_URL}
          >
            <HocuspocusRoom name={documentName}>
              <Editor
                userName={userName}
                documentName={documentName}
              />
            </HocuspocusRoom>
          </HocuspocusProviderWebsocketComponent>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <button
              onClick={copyRoomLink}
              style={{
                padding: "9px 15px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                background: "#7c3aed",
                color: "white",
              }}
            >
              {copied ? "Link Copied!" : "Copy Room Link"}
            </button>

            <button
              onClick={switchDocument}
              style={{
                padding: "9px 15px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                background: "#222",
                color: "white",
              }}
            >
              Switch Document
            </button>
          </div>
        </>
      )}
    </main>
  );
}