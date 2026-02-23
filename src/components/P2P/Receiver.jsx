import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import axios from "axios";
import { Oval } from "react-loader-spinner";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const Receiver = () => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Enter code to join");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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
      // console.log("Found PEER ID: ", hostPeerID);

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

      // console.log("Connecting to peer: ", peer);

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
    // console.log("INSIDE setup connection");

    conn.on("open", () => {
      setIsConnected(true);
      setStatus("Connected! Waiting for file...");
    });

    // error and close listeners to debug network blocks
    conn.on("error", (err) => {
      console.error("Data Channel Error:", err);
      setStatus("P2P Connection failed. Network may be blocking it.");
    });

    conn.on("close", () => {
      setIsConnected(false);
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
        setProgress(0);
        setTimeout(() => {
          setStatus((prev) =>
            prev === "File Received!" ? "Waiting for next file..." : prev,
          );
        }, 3000);
      }
    });
  };

  // badge styling based on status string content
  const isSuccess =
    status.includes("Connected") ||
    status.includes("Received") ||
    status.includes("Receiving");
  const isError =
    status.includes("error") ||
    status.includes("Invalid") ||
    status.includes("failed");

  return (
    <div className="glass-card flex flex-col items-center p-8 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-gray-200 dark:border-neutral-700/50 rounded-2xl shadow-xl w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-6">
        Receiver Mode
      </h2>

      <div className="w-full flex flex-col items-center gap-4">
        {/* Dynamic Status Badge */}
        <div
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors w-full text-center ${
            isSuccess
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
              : isError
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                : "bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700"
          }`}
        >
          {isSuccess ? (
            <FiCheckCircle className="w-4 h-4 shrink-0" />
          ) : isError ? (
            <FiAlertCircle className="w-4 h-4 shrink-0" />
          ) : status === "Looking for room..." ? (
            <Oval
              height={14}
              width={14}
              color="#3B82F6"
              secondaryColor="#93C5FD"
              strokeWidth={4}
            />
          ) : null}
          <span className="truncate">{status}</span>
        </div>

        {!isConnected && (
          <div className="w-full flex flex-col gap-4 mt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="ENTER CODE"
                maxLength={6}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 p-4 rounded-xl text-center tracking-[0.5em] text-2xl font-mono uppercase focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:tracking-normal"
              />
            </div>
            <button
              onClick={joinRoom}
              disabled={code.length < 1}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-300 dark:disabled:bg-neutral-700 disabled:text-gray-500 dark:disabled:text-neutral-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Connect to Peer
            </button>
          </div>
        )}

        {progress > 0 && (
          <div className="w-full mt-2">
            <div className="flex justify-between mb-1.5 px-1">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Downloading...
              </span>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Receiver;
