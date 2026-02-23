import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";
import axios from "axios";
import { Oval } from "react-loader-spinner";
import { FiCopy, FiCheckCircle, FiUploadCloud, FiFile } from "react-icons/fi";

const Sender = ({ onBack }) => {
  const [peer, setPeer] = useState(null);
  const [code, setCode] = useState(""); // code to connect to peer id
  const [status, setStatus] = useState("Intializing..."); // current connection status
  const [conn, setConn] = useState(null); // receiver
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false); // Copied state

  const fileInputRef = useRef(null);

  useEffect(() => {
    // 1. Create peer object. The peer object is where we create and receive connections
    const newPeer = new Peer({
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
    // now we store the peer object in our states.
    setPeer(newPeer);

    // 2. Now that we have a peer, we need to share it. So, we use our /create-session function that binds the peer id with a code.
    newPeer.on("open", async (id) => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/p2p/create-session`,
          { peerID: id },
        ); // this sends a req to our backend and sends the peer id in the body.

        setCode(res.data.code); // the create-session returns the CODE that the receiver will use to connect
        setStatus("Waiting for receiver to join...");
      } catch (err) {
        setStatus("Error connecting to server.");
      }
    });

    // 3. Wait for connection & the data channel to open

    newPeer.on("connection", (connection) => {
      // Wait for the channel to actually open before updating the UI
      connection.on("open", () => {
        setConn(connection);
        setStatus("Receiver connected! Select a file to share.");
      });

      // Handle disconnects gracefully
      connection.on("close", () => {
        setConn(null);
        setStatus("Receiver disconnected. Waiting for a new connection...");
      });
    });

    // Listen for errors to debug easier
    newPeer.on("error", (err) => {
      console.error("PeerJS Error:", err.type, err);
    });

    return () => {
      // Safely close the peer when component unmounts
      if (newPeer) newPeer.destroy();
    }; // closes all active connections, as well as connections to the server. Also destroys the peer.
  }, []);

  const sendFile = () => {
    if (!conn || !file) {
      return;
    }

    setStatus(`Sending ${file.name}...`);

    // 4. Send metadata first.
    conn.send({
      type: "metadata",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // 5. Chunking Logic
    // We can't send large files (1Gb+) all at once. So, we have to create chunks of data.

    const CHUNK_SIZE = 16 * 1024; //16KB
    let offset = 0;

    const reader = new FileReader(); // web interface to read files

    reader.onload = async (e) => {
      conn.send({ type: "chunk", data: e.target.result });
      offset += e.target.result.byteLength;

      // update progress
      setProgress(Math.round((offset / file.size) * 100));

      if (offset < file.size) {
        await readNextChunk();
      } else {
        conn.send({ type: "end" });
        setProgress(100);

        setStatus("Sent Successfully!");
      }
    };

    const readNextChunk = async () => {
      // Pause if the WebRTC buffer exceeds 1MB to prevent crashing on large files
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
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="glass-card flex flex-col items-center p-8 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-gray-200 dark:border-neutral-700/50 rounded-2xl shadow-xl w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-6">
        Sender Mode
      </h2>

      {/* Dynamic Status Badge (Replaces the green text) */}
      <div
        className={`flex items-center justify-center gap-2 px-4 py-2 mb-6 rounded-full text-sm font-medium transition-colors w-full text-center ${
          conn
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
            : "bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700"
        }`}
      >
        {conn ? (
          <FiCheckCircle className="w-4 h-4 shrink-0" />
        ) : (
          <Oval
            height={14}
            width={14}
            color="#3B82F6"
            secondaryColor="#93C5FD"
            strokeWidth={4}
          />
        )}
        <span className="truncate">{status}</span>
      </div>

      {!conn ? (
        <div className="text-center w-full flex flex-col items-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">
            Share this code to connect
          </p>
          <div className="flex items-center justify-center gap-3 bg-white dark:bg-neutral-900/50 py-4 px-6 rounded-xl border border-gray-100 dark:border-neutral-700 w-full mb-2">
            <h1 className="text-4xl dark:text-white text-neutral-900 font-mono font-bold tracking-widest">
              {code || (
                <Oval
                  height={36}
                  width={36}
                  color="#3B82F6"
                  secondaryColor="#93C5FD"
                />
              )}
            </h1>
            {code && (
              <button
                onClick={handleCopy}
                className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer transition-colors"
                title="Copy Code"
              >
                {copied ? <FiCheckCircle size={20} /> : <FiCopy size={20} />}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {/* Custom File Picker UI */}
          <label className="relative flex flex-col items-center justify-center w-full py-6 px-4 border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setProgress(0);
                  setStatus("Ready to send!");
                }
                // reset the input value so the browser registers a change
                e.target.value = null;
              }}
            />
            {file ? (
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                <FiFile className="w-6 h-6 shrink-0" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-blue-500 dark:text-blue-400">
                <FiUploadCloud className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">
                  Click to select a file
                </span>
              </div>
            )}
          </label>

          {progress > 0 && (
            <div className="w-full">
              <div className="flex justify-between mb-1.5 px-1">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  {progress === 100 ? "Transfer Complete!" : "Transferring..."}
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

          {progress === 100 ? (
            <button
              onClick={() => {
                setFile(null);
                setProgress(0);
                setStatus("Ready for next file!");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2"
            >
              Send Another File
            </button>
          ) : (
            <button
              onClick={sendFile}
              disabled={!file || progress > 0} // Prevents double-clicking during transfer
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-300 dark:disabled:bg-neutral-700 disabled:text-gray-500 dark:disabled:text-neutral-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-2"
            >
              {progress > 0 ? "Transferring..." : "Send File"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Sender;
