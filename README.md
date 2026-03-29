# QuickDrop

**QuickDrop** is a fast, privacy-focused file sharing service — no account, no sign-up, just share. It supports two distinct transfer modes: a **Cloud Upload** flow for async file sharing via a short code or QR, and a **real-time P2P transfer** mode for direct device-to-device sharing, both globally and over a local network.

---

## Features

- **No login or sign-up required** — share files instantly
- **Cloud Upload** — upload files to the cloud and share with a 6-character code or QR code
- **Global P2P Transfer** — connect two devices anywhere in the world via a room code using WebRTC
- **Local Radar** — discover and share files with nearby devices on the same Wi-Fi network
- **Multi-file support** — upload multiple files at once; downloads are automatically bundled into a ZIP
- **Chunked transfers** — large files are split into chunks for reliable upload and P2P transfer
- **Auto-expiry** — uploaded files expire after 5 minutes and are deleted from the server
- **Manual deletion** — senders can delete their files at any time before expiry
- **Dark mode** — full light/dark theme support
- **No compression** — files are transferred at 100% lossless quality

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS v4 |
| Routing | React Router v7 |
| Animations | Framer Motion |
| P2P / WebRTC | PeerJS v1.5 |
| Real-time Discovery | Socket.io |
| File Storage | Cloudinary |
| HTTP Client | Axios |
| Multi-file Download | JSZip |
| QR Code | react-qr-code |
| Deployment | Vercel |

---

## Architecture Overview

QuickDrop has two completely independent file transfer flows, each serving a different use case.

### 1. Cloud Upload (Async Sharing)

This mode uploads files to a cloud storage provider and maps them to a short alphanumeric code. The sender and receiver do not need to be online at the same time.

```
Sender                   Backend                    Cloudinary
  |                         |                            |
  |-- POST /sign-upload --→ |                            |
  |←-- signature, key ---- |                            |
  |                         |                            |
  |-- POST /v1_1/.../upload (with signature) ----------→|
  |←---------------------------------------- secure_url |
  |                         |                            |
  |-- POST /save-metadata → |                            |
  |  { files, urls, etc }   |-- stores in DB             |
  |←-- { code: "ABC123" }--|                            |
  |                         |                            |

Receiver
  |
  |-- enters code "ABC123"
  |-- GET /api/files/ABC123 → metadata + download URLs
  |-- fetches file blobs directly from Cloudinary
  |-- triggers browser download (single file or ZIP)
```

**Key details:**
- Files under 6 MB are uploaded directly; files 6 MB or larger are uploaded in **5 MB chunks** using Cloudinary's resumable upload API
- The backend signs each upload server-side, keeping the Cloudinary API secret out of the browser
- PDFs are uploaded as `raw` resource type to prevent Cloudinary from treating them as images
- Multiple files are downloaded client-side and bundled into a ZIP using JSZip before being saved to disk
- All uploaded files expire after **5 minutes**

---

### 2. Global P2P Transfer (Real-time, Code-based)

This mode establishes a direct **WebRTC data channel** between two browsers anywhere in the world. No files ever touch a server — data flows peer-to-peer.

```
Sender (Browser A)            Signaling Server             Receiver (Browser B)
        |                            |                              |
  PeerJS connects                   |                              |
        |-- registers peer ID ---→  |                              |
        |-- POST /create-session →  |                              |
        |   { peerID }              |-- stores code↔peerID map    |
        |←-- { code: "XYZ789" } -- |                              |
        |                           |                              |
        |   (Sender shares code "XYZ789" with receiver)           |
        |                           |                              |
        |                           |←-- GET /get-session/XYZ789 --|
        |                           |-- { peerID } -------------→  |
        |                           |         PeerJS connects       |
        |←====== WebRTC Data Channel Established ================→ |
        |                           |                              |
  sends metadata chunk, chunk, "end" signal                        |
        |=================== file bytes ========================→  |
        |                           |            reassembles blob  |
        |                           |         triggers download    |
```

**Key details:**
- The **signaling server** (a self-hosted PeerJS server) only brokers the initial handshake — it maps a human-readable room code to a PeerJS peer ID
- Once the WebRTC data channel is open, all data flows **directly between browsers** with no relay, unless the network requires it (see TURN server section below)
- Files are sent in **32 KB chunks** with back-pressure control: the sender pauses if the WebRTC buffer exceeds 1 MB to prevent memory crashes on large files
- Transfer progress is tracked in real time on both sides

---

### 3. Local Radar (LAN Discovery)

This mode combines **Socket.io** for device discovery with **PeerJS** for the actual data transfer, making it ideal for large files on a shared network.

```
Device A (You)                Socket.io Server               Device B
     |                               |                            |
     |-- socket "join-radar" -----→  |                            |
     |                               |←-- "join-radar" ----------|
     |←-- "sync-peers" (list) ------ |                            |
     |←-- "peer-joined" (Device B) - |                            |
     |                               |                            |
     | (Device A clicks Device B avatar)                         |
     |                               |                            |
     |←======= WebRTC Data Channel (PeerJS) ==================→  |
     |                               |                            |
  sends file in 32KB chunks          |       triggers download    |
```

**Key details:**
- Devices are grouped by their **local network** (IP subnet) on the signaling server, so only devices on the same Wi-Fi appear in each other's radar
- Each device gets a randomly generated name for the session (e.g. "Swift Falcon")
- The radar UI renders discovered peers around a central avatar; clicking any peer opens a file picker and immediately initiates a transfer to that device

---

## Custom TURN Server Configuration

### Background

WebRTC connections work by exchanging **ICE candidates** — network address candidates that two peers can use to connect to each other. There are two types of servers that help with this:

- **STUN servers** — help each browser discover its own public IP address so it can tell the other peer where to find it
- **TURN servers** — act as a relay when a direct connection is not possible (e.g. both peers are behind strict NAT or a firewall blocks direct UDP traffic)

### The Problem: ISP Restrictions in Pakistan

Certain well-known STUN and TURN servers (including some operated by Google and Twilio) are either **blocked at the ISP level or unreachable** in Pakistan due to strict network filtering policies. When the default ICE candidates fail, WebRTC falls back to the TURN relay — but if that relay is also blocked, the connection never establishes.

To solve this, QuickDrop uses a **custom TURN server configuration via [Metered.ca](https://www.metered.ca/)**, which provides relay endpoints on multiple ports and protocols specifically to maximize reachability across restrictive networks:

```js
iceServers: [
  // STUN — public address discovery
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
  { urls: "stun:stun.relay.metered.ca:80" },

  // TURN over UDP on port 80 — gets through most firewalls
  {
    urls: "turn:standard.relay.metered.ca:80",
    username: "<TURN_USERNAME>",
    credential: "<TURN_CREDENTIAL>",
  },
  // TURN over TCP on port 80 — fallback if UDP is blocked
  {
    urls: "turn:standard.relay.metered.ca:80?transport=tcp",
    username: "<TURN_USERNAME>",
    credential: "<TURN_CREDENTIAL>",
  },
  // TURN over TLS on port 443 — encrypted relay, bypasses deep packet inspection
  {
    urls: "turn:standard.relay.metered.ca:443",
    username: "<TURN_USERNAME>",
    credential: "<TURN_CREDENTIAL>",
  },
  // TURNS over TLS+TCP on port 443 — most permissive fallback for strict ISPs
  {
    urls: "turns:standard.relay.metered.ca:443?transport=tcp",
    username: "<TURN_USERNAME>",
    credential: "<TURN_CREDENTIAL>",
  },
]
```

**Why this works:**
- Port `443` with TLS (`turns:`) is treated by virtually all firewalls as standard HTTPS traffic and is rarely blocked
- Offering both UDP and TCP transports ensures the WebRTC engine can negotiate the most efficient path that the network allows
- By providing four relay fallbacks (UDP/TCP × two ports), the ICE negotiation has a high chance of finding at least one route, even on the most restrictive Pakistani ISPs

---

## Environment Variables

The frontend reads configuration from environment variables prefixed with `VITE_`. Create a `.env` file in the project root:

```env
# URL of your backend API server
VITE_BACKEND_URL=https://your-backend-url.com

# Hostname of your self-hosted PeerJS signaling server (without https://)
VITE_SIGNALING_URL=your-signaling-server.com

# Metered.ca TURN server credentials
VITE_TURN_SERVER_USERNAME=your_turn_username
VITE_TURN_SERVER_CREDENTIAL=your_turn_credential
```

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## Local Development

### Prerequisites

- Node.js 18+
- A running instance of the [QuickDrop backend](https://github.com/TalibIbrahim/quickdrop-backend) (or compatible API)
- A self-hosted [PeerJS server](https://github.com/peers/peerjs-server) for signaling
- A [Metered.ca](https://www.metered.ca/) account for TURN credentials (free tier available)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/TalibIbrahim/quickdrop.git
cd quickdrop

# 2. Install dependencies
npm install

# 3. Configure environment variables — create a .env file in the project root
# and populate it with the values listed in the Environment Variables section above

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The production-ready output is placed in the `dist/` directory.

### Lint

```bash
npm run lint
```

---

## Deployment

QuickDrop is deployed on **Vercel**. The `vercel.json` at the project root configures a catch-all rewrite rule so that React Router's client-side routing works correctly on direct URL access:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

All environment variables listed above must be added to your Vercel project's environment settings.

---

## Project Structure

```
src/
├── animations/          # WebGL background animations (Threads, DarkVeil)
├── assets/              # Static image assets and logos
├── components/
│   ├── P2P/
│   │   ├── SharePage.jsx    # Mode selection (Global P2P vs Local Radar)
│   │   ├── Sender.jsx       # Global P2P — sender side
│   │   ├── Receiver.jsx     # Global P2P — receiver side
│   │   ├── LocalRadar.jsx   # LAN discovery and transfer
│   │   └── nameGenerator.js # Random device name generator
│   ├── UI/
│   │   ├── ErrorCard.jsx    # Reusable error display
│   │   └── ExpiryTimer.jsx  # Countdown timer for uploaded files
│   ├── DownloadFile.jsx     # Download page (single file or ZIP)
│   ├── DownloadForm.jsx     # Code entry form for cloud downloads
│   ├── Home.jsx             # Landing page
│   ├── PrivacyPolicy.jsx    # Privacy policy
│   ├── UploadPage.jsx       # Cloud upload page
│   └── UsagePage.jsx        # Usage guide
├── context/
│   └── DarkModeContext.jsx  # Global dark mode state
├── layout/
│   ├── Footer.jsx
│   ├── LayoutWrapper.jsx    # App shell with navbar and footer
│   └── Navbar.jsx
├── App.jsx                  # Route definitions
└── main.jsx                 # React entry point
```

---

## License

This project is private. All rights reserved.
