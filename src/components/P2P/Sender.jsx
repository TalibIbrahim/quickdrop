import { useEffect, useState } from "react";
import Peer from "peerjs";
import axios from "axios";
import { Oval } from "react-loader-spinner";

const Sender = ({ onBack }) => {
  const [peer, setPeer] = useState(null);
  const [code, setCode] = useState(""); // code to connect to peer id
  const [status, setStatus] = useState("Intializing..."); // current connection status
  const [conn, setConn] = useState(null); // receiver
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-600">Sender Mode</h2>

      {!conn ? (
        <div className="text-center">
          <p className="text-gray-500">Share this code:</p>
          <h1 className="text-5xl dark:text-white text-neutral-900 font-mono font-bold flex items-center justify-center tracking-widest my-4">
            {code || (
              <Oval
                height={40}
                width={40}
                color="#005CFF"
                secondaryColor="#3B82F6"
              />
            )}
          </h1>
          <p className="text-sm text-gray-400">{status}</p>
        </div>
      ) : (
        <div className="w-full">
          <p className="text-green-500 font-bold mb-4 text-center">
            Connected to Receiver
          </p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <button
            onClick={sendFile}
            disabled={!file}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send File
          </button>
        </div>
      )}
    </div>
  );
};

export default Sender;
