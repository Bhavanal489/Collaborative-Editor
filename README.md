# Real-Time Collaborative Workspace

A full-stack real-time collaborative document editor where multiple users can edit the same document simultaneously, with authentication, document sharing, role-based access control, offline persistence, and live collaboration.

## Live Application

https://collaborative-editor.vercel.app

## GitHub Repository

https://github.com/BhavanaL489/Collaborative-Editor

---

## Features

- Real-time collaborative document editing
- Multiple users editing the same document simultaneously
- Live collaborator presence and cursors
- User-specific cursor colors
- User authentication
- Email/password authentication
- Google OAuth authentication
- Create, rename, and delete documents
- Multiple independent document rooms
- Share documents with other users
- Editor and Viewer roles
- Server-side Viewer permission enforcement
- Search documents
- Shareable document links
- Offline document persistence
- Automatic reconnection after connection loss
- Connection status indicator
- Local IndexedDB persistence
- PostgreSQL document and user data storage
- Production deployment

---

## Architecture

```text
                         ┌─────────────────────────┐
                         │        Browser          │
                         │                         │
                         │  Next.js + Tiptap       │
                         │  Yjs + IndexedDB        │
                         └────────────┬────────────┘
                                      │
                         HTTPS        │        WSS
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌──────────────────┐                ┌──────────────────┐
          │      Vercel      │                │      Render      │
          │                  │                │                  │
          │ Next.js Frontend │                │   Hocuspocus     │
          │                  │                │ WebSocket Server │
          └────────┬─────────┘                └────────┬─────────┘
                   │                                   │
                   │                                   │
                   └──────────────┬────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Supabase     │
                         │                  │
                         │ Authentication   │
                         │ PostgreSQL       │
                         │ Documents        │
                         │ Members          │
                         │ Profiles         │
                         └──────────────────┘