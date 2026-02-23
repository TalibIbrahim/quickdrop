import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import axios from "axios";

const Receiver = () => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Enter code to join");
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const peerRef = useRef(null); // Keep peer instance alive across renders

  // Safely cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const joinRoom = async () => {
    setStatus("Looking for room...");

    try {
      //1. Get peer id for the code from backend
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/p2p/get-session/${code}`,
      );

      const hostPeerID = res.data.peerID;
      console.log("Found PEER ID: ", hostPeerID);

      //2. connect to the peer id
      const peer = new Peer({
        host: `${import.meta.env.VITE_SIGNALING_URL}`,
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
        pingInterval: 5000,
        debug: 2,
      });

      console.log("Connecting to peer: ", peer);

      peerRef.current = peer;

      peer.on("open", () => {
        const conn = peer.connect(hostPeerID, { reliable: true });

        console.log("Executing setup connection");
        setupConnection(conn);
      });

      //error handling
      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setStatus(`Connection error: ${err.type}`);
      });
    } catch (err) {
      setStatus("Invalid Code or Room not found");
    }
  };

  const setupConnection = (conn) => {
    let receivedSize = 0;
    let buffer = []; // array of chunks that will be reassembled to form the full file later
    let metadata = {};
    console.log("INSIDE setup connection");

    conn.on("open", () => {
      setStatus("Connected! Waiting for file...");
    });

    // error and close listeners to debug network blocks
    conn.on("error", (err) => {
      console.error("Data Channel Error:", err);
      setStatus("P2P Connection failed. Network may be blocking it.");
    });

    conn.on("close", () => {
      setStatus("Connection closed.");
    });

    conn.on("data", (data) => {
      if (data.type === "metadata") {
        metadata = data;
        buffer = [];
        receivedSize = 0;
        setIsDownloading(true);
        setStatus(`Receiving ${data.fileName}...`);
      } else if (data.type === "chunk") {
        buffer.push(data.data); // push chunks to our file transfer buffer
        receivedSize += data.data.byteLength;
        setProgress(Math.round((receivedSize / metadata.fileSize) * 100)); //current divided by total
      } else if (data.type === "end") {
        // 3. reassemble and download
        const blob = new Blob(buffer, { type: metadata.fileType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = metadata.fileName;
        a.click();

        setStatus("File Received!");
        setIsDownloading(false);
        setTimeout(() => setStatus("Waiting for next file..."), 3000);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-600">Receiver Mode</h2>

      {!isDownloading && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="123456"
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="border p-2 rounded text-center tracking-widest text-xl font-mono uppercase"
          />
          <button
            onClick={joinRoom}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Join
          </button>
        </div>
      )}

      <p className="text-gray-500 mt-4">{status}</p>

      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Receiver;
