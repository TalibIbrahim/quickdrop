import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Peer } from "peerjs";
import { generateRandomUser } from "./nameGenerator";
import { Oval } from "react-loader-spinner";
import { FiCheckCircle, FiFile } from "react-icons/fi";

const LocalRadar = ({ onBack }) => {
  const [me, setMe] = useState(null);
  const [activePeers, setActivePeers] = useState({}); // stores discovered devices
  const [status, setStatus] = useState("Initializing Radar...");

  // Transfer States
  const [transferProgress, setTransferProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const fileInputRef = useRef(null);
  const targetPeerIdRef = useRef(null); // Keeps track of who we clicked

  useEffect(() => {
    // Generate your identity on mount
    const myIdentity = generateRandomUser();

    // Initialize Socket.io (Connect to Render URL)
    const socket = io(
      import.meta.env.VITE_SIGNALING_URL.replace("/myapp", ""),
      {
        transports: ["websocket"],
      },
    );
    socketRef.current = socket;

    // Initialize PeerJS (existing metered.ca config goes here later)
    const peer = new Peer({
      host: import.meta.env.VITE_SIGNALING_URL,
      port: 443,
      path: "/myapp",
      secure: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          { urls: "stun:stun.relay.metered.ca:80" },
          {
            urls: "turn:standard.relay.metered.ca:80",
            username: `${import.meta.env.VITE_TURN_SERVER_USERNAME}`,
            credential: `${import.meta.env.VITE_TURN_SERVER_CREDENTIAL}`,
          },
          {
            urls: "turn:standard.relay.metered.ca:80?transport=tcp",
            username: `${import.meta.env.VITE_TURN_SERVER_USERNAME}`,
            credential: `${import.meta.env.VITE_TURN_SERVER_CREDENTIAL}`,
          },
          {
            urls: "turn:standard.relay.metered.ca:443",
            username: `${import.meta.env.VITE_TURN_SERVER_USERNAME}`,
            credential: `${import.meta.env.VITE_TURN_SERVER_CREDENTIAL}`,
          },
          {
            urls: "turns:standard.relay.metered.ca:443?transport=tcp",
            username: `${import.meta.env.VITE_TURN_SERVER_USERNAME}`,
            credential: `${import.meta.env.VITE_TURN_SERVER_CREDENTIAL}`,
          },
        ],
      },
      debug: 2,
    });
    peerRef.current = peer;

    // --- SETUP PEERJS ---
    peer.on("open", (id) => {
      setMe({ ...myIdentity, peerId: id });
      setStatus("Scanning local network...");

      // Now that we have a WebRTC ID, tell the Socket room who we are
      socket.emit("join-radar", { ...myIdentity, peerId: id });
    });

    // --- SETUP SOCKET.IO (The Radar) ---
    // When a new device joins our Wi-Fi room
    socket.on("peer-joined", (userData) => {
      console.log("New device discovered:", userData.name);
      setActivePeers((prev) => ({ ...prev, [userData.peerId]: userData }));
    });

    // catch the list of people already in the room when we join
    socket.on("sync-peers", (peersList) => {
      const peersObj = {};
      peersList.forEach((p) => {
        peersObj[p.peerId] = p;
      });
      setActivePeers((prev) => ({ ...prev, ...peersObj }));
    });

    // When a device leaves our Wi-Fi room
    socket.on("peer-left", (peerId) => {
      setActivePeers((prev) => {
        const updated = { ...prev };
        delete updated[peerId];
        return updated;
      });
    });

    // --- RECEIVE FILES (The Receiver Logic) ---

    peer.on("connection", (conn) => {
      let receivedSize = 0;
      let buffer = [];
      let metadata = {};

      conn.on("open", () => {
        setIsTransferring(true);
        setTransferMessage("Incoming connection...");
      });

      conn.on("data", (data) => {
        if (data.type === "metadata") {
          metadata = data;
          buffer = [];
          receivedSize = 0;
          setTransferMessage(`Receiving ${data.fileName}...`);
        } else if (data.type === "chunk") {
          buffer.push(data.data);
          receivedSize += data.data.byteLength;
          setTransferProgress(
            Math.round((receivedSize / metadata.fileSize) * 100),
          );
        } else if (data.type === "end") {
          // Reassemble and trigger download
          const blob = new Blob(buffer, { type: metadata.fileType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = metadata.fileName;
          a.click();

          setTransferMessage("File Received!");
          setTimeout(() => {
            setIsTransferring(false);
            setTransferProgress(0);
          }, 3000);
        }
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      peer.destroy();
    };
  }, []);

  // --- SEND FILES (The Sender Logic) ---
  const handleAvatarClick = (peerId) => {
    targetPeerIdRef.current = peerId;
    fileInputRef.current.click(); // Open the hidden file picker
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !targetPeerIdRef.current) return;

    setIsTransferring(true);
    setTransferMessage(`Connecting to send ${file.name}...`);

    // Connect directly to the clicked peer
    const conn = peerRef.current.connect(targetPeerIdRef.current, {
      reliable: true,
    });

    conn.on("open", () => {
      setTransferMessage(`Sending ${file.name}...`);

      // Send Metadata
      conn.send({
        type: "metadata",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Chunking Logic
      const CHUNK_SIZE = 16 * 1024;
      let offset = 0;
      const reader = new FileReader();

      reader.onload = async (event) => {
        conn.send({ type: "chunk", data: event.target.result });
        offset += event.target.result.byteLength;
        setTransferProgress(Math.round((offset / file.size) * 100));

        if (offset < file.size) {
          readNextChunk();
        } else {
          conn.send({ type: "end" });
          setTransferMessage("Sent Successfully!");
          setTimeout(() => {
            setIsTransferring(false);
            setTransferProgress(0);
          }, 3000);
        }
      };

      const readNextChunk = async () => {
        // Buffer control to prevent memory crash on large files
        while (
          conn.dataChannel &&
          conn.dataChannel.bufferedAmount > 1024 * 1024
        ) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
      };

      readNextChunk();
    });

    conn.on("error", (err) => {
      console.error("Connection failed", err);
      setTransferMessage("Connection failed!");
      setTimeout(() => setIsTransferring(false), 3000);
    });

    // Reset input
    e.target.value = null;
  };

  return (
    <div className="glass-card flex flex-col items-center p-8 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-gray-200 dark:border-neutral-700/50 rounded-2xl shadow-xl w-full max-w-4xl mx-auto min-h-[60vh] relative overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-blue-500 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full border border-blue-500 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
      </div>

      <div className="z-10 w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-2">
          Local Radar
        </h2>

        {/* Transfer Status Banner */}
        {isTransferring ? (
          <div className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-xl border border-blue-200 dark:border-blue-800/50 mb-4 w-64 text-center">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
              {transferMessage}
            </span>
            <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${transferProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-8">{status}</p>
        )}

        <div className="relative w-full h-[400px] flex items-center justify-center">
          {/* My Avatar */}
          {me ? (
            <div className="flex flex-col items-center z-20">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/50 ring-4 ring-white dark:ring-neutral-800">
                {me.name.charAt(0)}
              </div>
              <span className="mt-3 font-medium text-gray-700 dark:text-gray-300">
                You ({me.name})
              </span>
            </div>
          ) : (
            <Oval
              height={40}
              width={40}
              color="#3B82F6"
              secondaryColor="#93C5FD"
            />
          )}

          {/* Other Devices */}
          {Object.values(activePeers).map((peer, index) => {
            const angle =
              (index / Object.keys(activePeers).length) * Math.PI * 2;
            const radius = 140;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={peer.peerId}
                className="absolute flex flex-col items-center cursor-pointer hover:scale-110 transition-transform z-10 group"
                style={{ transform: `translate(${x}px, ${y}px)` }}
                onClick={() => handleAvatarClick(peer.peerId)}
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold border-2 border-transparent group-hover:border-blue-500 group-hover:shadow-lg transition-all">
                  {peer.name.charAt(0)}
                </div>
                <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-neutral-900/50 px-2 py-1 rounded-md">
                  {peer.name}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onBack}
          className="mt-auto text-blue-500 hover:text-blue-600 underline"
        >
          Exit Radar
        </button>
      </div>
    </div>
  );
};

export default LocalRadar;
