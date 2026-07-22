<div align="center">

# 1SecondSharing

**Share files with Zero Friction.**

Direct peer-to-peer file sharing. Files are never stored on any central server — transfers run browser-to-browser over WebRTC, and every room lives only as long as the session.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Features

- **Peer-to-peer transfers** — files stream directly between browsers over WebRTC; the server only relays the initial handshake.
- **Zero storage** — nothing is written to disk server-side. Close the room and the data is gone.
- **Instant rooms** — create a room, share a 6-character code or a link, and the recipient joins in one click.
- **Live progress** — a filling ring shows real transferred bytes, transfer speed, and completion state in both directions.
- **Glassmorphic UI** — translucent surfaces, ambient gradients, and an animated grid backdrop.

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Animation | Motion |
| Build | Vite 6 |
| Server | Express, `ws` (WebSocket signaling) |
| Transport | WebRTC DataChannel |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build   # bundles the client and compiles the server
npm start       # serves the built app
```

## How It Works

```
Sender                    Signaling Server                  Receiver
  │                              │                              │
  ├── create_room ──────────────►│                              │
  │◄───────── room code ─────────┤                              │
  │                              │◄───────── join_room ─────────┤
  │◄──────── room_ready ─────────┼───────── room_ready ────────►│
  │                              │                              │
  ├── WebRTC offer / answer ────►│─────────────────────────────►│
  │                              │                              │
  ├══════════ file chunks, peer-to-peer (no server) ═══════════►│
```

The WebSocket server only brokers room codes and forwards WebRTC signaling. Once the peer connection is established, file data never touches the server.

## Project Structure

```
src/
├── components/
│   ├── Header.tsx             # Brand bar with back navigation
│   ├── HomeView.tsx           # Landing screen
│   ├── JoinRoomView.tsx       # Room code entry
│   ├── WaitingRoomView.tsx    # Room created, awaiting peer
│   ├── TransferRoomView.tsx   # Drag & drop, transfer lists
│   ├── CircularProgress.tsx   # Ring showing live transfer progress
│   └── Toast.tsx              # Dismissible notifications
├── lib/
│   ├── useRoomWebSocket.ts    # Signaling, WebRTC, chunked transfer
│   └── utils.ts               # Byte and speed formatting
├── types.ts                   # Shared types
└── index.css                  # Design tokens and glass components
server.ts                      # Express + WebSocket signaling server
```

## Configuration

Copy `.env.example` to `.env` and fill in values as needed. Environment files are gitignored — never commit real credentials.

## License

MIT
