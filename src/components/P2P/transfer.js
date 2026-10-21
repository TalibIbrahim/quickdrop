// Shared P2P file transfer helpers used by Sender, Receiver and LocalRadar.
//
// Connections must be opened with { serialization: "raw" } so PeerJS hands our ArrayBuffers
// straight to the WebRTC data channel. The default "binary" mode re-packs every message and
// splits it into 16KB pieces in JavaScript, which is much slower.
//
// Wire format: control messages are JSON strings ({type: "metadata" | "end"}), file data is
// sent as plain ArrayBuffer chunks.

export const P2P_CONNECTION_OPTIONS = { reliable: true, serialization: "raw" };

const MAX_CHUNK_SIZE = 256 * 1024; // 256KB, the largest message modern browsers accept
const FALLBACK_CHUNK_SIZE = 64 * 1024; // if the browser doesn't report its limit
const HIGH_WATER_MARK = 8 * 1024 * 1024; // pause sending when 8MB is queued in the channel
const LOW_WATER_MARK = 2 * 1024 * 1024; // resume once it drains below 2MB
const BLOB_FLUSH_SIZE = 32 * 1024 * 1024; // receiver: move every 32MB of chunks into a Blob

// Pick the largest chunk both browsers can handle
const getChunkSize = (conn) => {
  const max = conn.peerConnection?.sctp?.maxMessageSize;
  if (!max) return FALLBACK_CHUNK_SIZE;
  return Math.min(MAX_CHUNK_SIZE, max);
};

// Resolves once the channel's queue drops to `threshold` bytes (event based, no polling)
const waitForDrain = (dc, threshold) =>
  new Promise((resolve) => {
    if (dc.bufferedAmount <= threshold) return resolve();
    dc.bufferedAmountLowThreshold = threshold;
    const done = () => {
      dc.removeEventListener("bufferedamountlow", done);
      dc.removeEventListener("close", done);
      resolve();
    };
    dc.addEventListener("bufferedamountlow", done);
    dc.addEventListener("close", done); // don't hang forever if the peer leaves
  });

// Only update progress when the whole-number percentage changes (max ~100 re-renders)
const createProgressReporter = (total, onProgress) => {
  let last = -1;
  return (done) => {
    const percent = total ? Math.floor((done / total) * 100) : 100;
    if (percent !== last) {
      last = percent;
      onProgress(percent);
    }
  };
};

// Sends a file over an open raw connection. Resolves once everything has left the browser.
export const sendFile = async (conn, file, onProgress = () => {}) => {
  const dc = conn.dataChannel;
  const chunkSize = getChunkSize(conn);
  const report = createProgressReporter(file.size, onProgress);

  conn.send(
    JSON.stringify({
      type: "metadata",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    }),
  );

  let offset = 0;
  while (offset < file.size) {
    if (!conn.open) throw new Error("Connection closed during transfer");
    if (dc.bufferedAmount > HIGH_WATER_MARK) await waitForDrain(dc, LOW_WATER_MARK);

    const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
    conn.send(chunk);
    offset += chunk.byteLength;
    report(offset);
  }

  conn.send(JSON.stringify({ type: "end" }));

  // wait for the queue to empty so "sent" really means sent
  if (conn.open) await waitForDrain(dc, 0);
};

// Returns a handler for conn.on("data", ...) that reassembles incoming files.
// Callbacks: onMetadata(meta), onProgress(percent), onComplete(blob, meta)
export const createFileReceiver = ({ onMetadata, onProgress, onComplete }) => {
  let meta = null;
  let parts = []; // Blobs of already-flushed chunks (the browser can keep these off the JS heap)
  let pending = []; // ArrayBuffers not yet flushed
  let pendingSize = 0;
  let received = 0;
  let report = () => {};

  return (data) => {
    if (typeof data === "string") {
      const msg = JSON.parse(data);

      if (msg.type === "metadata") {
        meta = msg;
        parts = [];
        pending = [];
        pendingSize = 0;
        received = 0;
        report = createProgressReporter(msg.fileSize, onProgress);
        onMetadata?.(msg);
      } else if (msg.type === "end" && meta) {
        const blob = new Blob([...parts, ...pending], { type: meta.fileType });
        const finished = meta;
        meta = null;
        parts = [];
        pending = [];
        onComplete?.(blob, finished);
      }
      return;
    }

    // binary chunk
    if (!meta) return;
    pending.push(data);
    pendingSize += data.byteLength;
    received += data.byteLength;

    if (pendingSize >= BLOB_FLUSH_SIZE) {
      parts.push(new Blob(pending));
      pending = [];
      pendingSize = 0;
    }
    report(received);
  };
};

// Saves a received Blob to the user's device
export const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // give the browser time to start the download before freeing the memory
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
};
