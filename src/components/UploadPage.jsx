import { useRef, useState } from "react";
import { FiCopy, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { LuUpload } from "react-icons/lu";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";
import axios from "axios";
import ExpiryTimer from "./UI/ExpiryTimer";
import { Oval } from "react-loader-spinner";

// Cloudinary FREE plan per-file limits (Settings -> Account -> Usage limits)
const MB = 1024 * 1024;
const FREE_PLAN_LIMITS = { image: 10 * MB, raw: 10 * MB, video: 100 * MB };
const MEDIA_EXTENSIONS =
  /\.(mp4|mov|m4v|webm|mkv|avi|wmv|flv|3gp|mpeg|mpg|mp3|wav|aac|m4a|ogg|oga|flac|opus|wma)$/i;

const UPLOAD_CONCURRENCY = 3; // files uploaded at the same time
const SIGNATURE_MAX_AGE = 45 * 60 * 1000; // Cloudinary signatures are valid for 1 hour

// Which Cloudinary resource type a file ends up as (only video/audio get the 100MB limit)
const getLimitType = (file) => {
  if (file.type === "application/pdf") return "raw"; // we force PDFs to raw below
  if (file.type.startsWith("video/") || file.type.startsWith("audio/"))
    return "video";
  if (!file.type && MEDIA_EXTENSIONS.test(file.name)) return "video";
  if (file.type.startsWith("image/")) return "image";
  return "raw";
};

const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState([]); // Store array of files
  const [uploadTime, setUploadTime] = useState(null); // timer state
  const [uploadCode, setUploadCode] = useState(""); // code state
  // UI HELPER STATES:
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [hasUploaded, setHasUploaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Progress state
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload signature, fetched as soon as files are picked (this also wakes the backend up)
  const signatureRef = useRef(null); // { promise, fetchedAt }

  // Upload single file. Can upload both single and multiple
  // onProgress receives how many bytes of THIS file have been uploaded so far
  const uploadSingleFile = async (file, cloudName, formDataBase, onProgress) => {
    // Cloudinary chunks must be at least 5MB. The free plan caps images/raw at 10MB, so only
    // video/audio (up to 100MB) is ever chunked - 20MB chunks keep that to 5 requests max.
    const CHUNK_SIZE = 20 * 1024 * 1024;
    const totalSize = file.size;

    // because of how cloudinary treats pdfs, we FORCE our pdf upload to send the file as 'raw'
    // on auto, it sends it as 'image'
    const isPDF = file.type === "application/pdf";
    const resourceType = isPDF ? "raw" : "auto";

    // if small file, direct Upload
    if (totalSize <= CHUNK_SIZE) {
      const formData = new FormData();
      for (const [key, value] of formDataBase.entries()) {
        formData.append(key, value);
      }
      formData.append("file", file);

      return await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => onProgress(Math.min(e.loaded, totalSize)),
        },
      );
    }

    // if Large file, upload in chunks
    const uniqueUploadId = Date.now().toString() + Math.random().toString();
    let start = 0;
    let end = Math.min(CHUNK_SIZE, totalSize);
    let finalResponse = null;

    while (start < totalSize) {
      const chunk = file.slice(start, end);
      const formData = new FormData();
      for (const [key, value] of formDataBase.entries()) {
        formData.append(key, value);
      }
      // pass the real name, otherwise Cloudinary records it as "blob" (used for names in ZIPs)
      formData.append("file", chunk, file.name);

      const headers = {
        "X-Unique-Upload-Id": uniqueUploadId,
        "Content-Range": `bytes ${start}-${end - 1}/${totalSize}`,
      };

      const chunkStart = start;
      const chunkLength = end - start;
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        formData,
        {
          headers,
          onUploadProgress: (e) =>
            onProgress(chunkStart + Math.min(e.loaded, chunkLength)),
        },
      );

      finalResponse = res;
      start = end;
      end = Math.min(start + CHUNK_SIZE, totalSize);
    }

    return finalResponse;
  };

  // Get (or reuse) an upload signature from our backend
  const getSignature = (forceNew = false) => {
    const cached = signatureRef.current;
    if (
      !forceNew &&
      cached &&
      Date.now() - cached.fetchedAt < SIGNATURE_MAX_AGE
    ) {
      return cached.promise;
    }

    const promise = fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/files/sign-upload`,
      { method: "POST" },
    ).then((res) => {
      if (!res.ok) throw new Error("Failed to get upload permission");
      return res.json();
    });

    signatureRef.current = { promise, fetchedAt: Date.now() };
    promise.catch(() => {
      // don't keep a failed request around, the upload click will try again
      if (signatureRef.current?.promise === promise) signatureRef.current = null;
    });
    return promise;
  };

  const processFiles = (fileList) => {
    setError("");
    setHasUploaded(false);
    setUploadCode("");

    // // LIMIT max 10 files:
    // if (fileList.length > 10) {
    //   setError("Maximum 10 files allowed.");
    //   return;
    // }

    //  Max upload size is 150MB (total), individual upload limits are fixed by cloudinary.
    let totalSize = 0;
    const filesArray = Array.from(fileList);
    for (let i = 0; i < filesArray.length; i++) {
      totalSize += filesArray[i].size;
    }

    // 150mb in bytes
    if (totalSize > 150 * 1024 * 1024) {
      setError("Total size exceeds 150MB limit.");
      return;
    }

    // Cloudinary's free plan rejects bigger files, so stop here instead of after uploading them
    const tooBig = filesArray.find(
      (f) => f.size > FREE_PLAN_LIMITS[getLimitType(f)],
    );
    if (tooBig) {
      const limitMB = FREE_PLAN_LIMITS[getLimitType(tooBig)] / MB;
      setError(
        `"${tooBig.name}" is too large. Max ${limitMB}MB for this file type (videos/audio: 100MB).`,
      );
      return;
    }

    setSelectedFiles(filesArray);
    getSignature().catch(() => {}); // warm up, so it's ready when "Start Upload" is clicked
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select files");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);
    setCurrentFileIndex(0);

    try {
      // 1. Get Signature (usually already fetched when the files were picked)
      let signed;
      try {
        signed = await getSignature();
      } catch {
        signed = await getSignature(true); // the early request failed, try once more
      }
      const { signature, timestamp, cloudName, apiKey, folder } = signed;

      const formDataBase = new FormData();
      formDataBase.append("api_key", apiKey);
      formDataBase.append("timestamp", timestamp);
      formDataBase.append("signature", signature);
      formDataBase.append("folder", folder);

      // 2. Upload Files, a few at the same time
      const uploadedFilesData = new Array(selectedFiles.length); // keeps the original order
      const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0) || 1;
      const loadedBytes = new Array(selectedFiles.length).fill(0);
      let completed = 0;
      let nextIndex = 0;

      // one combined progress bar for all files
      const updateProgress = () => {
        const loaded = loadedBytes.reduce((acc, n) => acc + n, 0);
        setUploadProgress(
          Math.min(100, Math.round((loaded * 100) / totalBytes)),
        );
      };

      const worker = async () => {
        while (nextIndex < selectedFiles.length) {
          const i = nextIndex++;
          const file = selectedFiles[i];

          const res = await uploadSingleFile(
            file,
            cloudName,
            formDataBase,
            (bytes) => {
              loadedBytes[i] = bytes;
              updateProgress();
            },
          );
          const data = res.data;

          uploadedFilesData[i] = {
            fileName: file.name,
            fileURL: data.secure_url,
            publicId: data.public_id,
            resourceType: data.resource_type,
            size: data.bytes,
          };

          loadedBytes[i] = file.size;
          completed++;
          // Update UI to show "Uploading 2 of X"
          setCurrentFileIndex(Math.min(completed + 1, selectedFiles.length));
          updateProgress();
        }
      };

      setCurrentFileIndex(1);
      await Promise.all(
        Array.from(
          { length: Math.min(UPLOAD_CONCURRENCY, selectedFiles.length) },
          worker,
        ),
      );


      // 3. Save Metadata (Send the ARRAY of files)
      const saveRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/save-metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: uploadedFilesData, // Sending array
          }),
        },
      );

      if (!saveRes.ok) throw new Error("Failed to save file code");

      const data = await saveRes.json();
      setUploadCode(data.code);
      setUploadTime(data.createdAt || new Date()); // TIMER is set from here
      setHasUploaded(true);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error?.message || err.message;
      setError(msg || "Upload failed");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uploadCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    const input = document.getElementById("fileInput");
    if (input) input.value = null;

    // RESET ALL STATES:
    setSelectedFiles([]);
    setUploadCode("");
    setUploadTime(null); // Reset Timestamp
    setHasUploaded(false);
    setCopied(false);
    setError("");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete these files immediately?"))
      return;

    setIsDeleting(true);

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/${uploadCode}`,
      );

      // Reset the UI after successful delete
      handleReset();
      alert("Files deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete files.");
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadText = (
    <div className="flex flex-row justify-between gap-3">
      <span>Upload</span>
      <LuUpload className="w-5 h-5" strokeWidth={2.5} />
    </div>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center relative dark:top-16 bottom-16  px-4 ${hasUploaded ? "my-16" : "min-h-[calc(100vh-100px)]"} transition-all duration-300`}
    >
      <div className="glass-card flex flex-col items-center p-8 bg-white/70 dark:bg-neutral-800/70 mt-24 backdrop-blur-lg border border-gray-200 dark:border-neutral-700/50 rounded-2xl shadow-xl w-full max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-6 text-center">
          Cloud Upload
        </h2>

        {!hasUploaded ? (
          <div className="w-full flex flex-col gap-4">
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative flex flex-col items-center justify-center w-full py-10 px-4 border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group"
            >
              <input
                type="file"
                id="fileInput"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFiles.length > 0 ? (
                <div className="text-blue-700 dark:text-blue-400 flex flex-col items-center text-center">
                  <p className="font-semibold text-lg mb-1">
                    {selectedFiles.length} files selected
                  </p>
                  <ul className="text-sm opacity-80 list-none">
                    {selectedFiles.slice(0, 3).map((f, i) => (
                      <li key={i} className="truncate max-w-[250px]">
                        {f.name}
                      </li>
                    ))}
                    {selectedFiles.length > 3 && (
                      <li>...and {selectedFiles.length - 3} more</li>
                    )}
                  </ul>
                  <div className="bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full text-xs font-medium mt-3">
                    Total:{" "}
                    {(
                      selectedFiles.reduce((acc, f) => acc + f.size, 0) /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-blue-500 dark:text-blue-400">
                  <LuUpload className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-center">
                    Click or drag files here
                  </p>
                  <span className="text-xs opacity-70">Up to 150MB total</span>
                </div>
              )}
            </label>

            {loading && (
              <div className="w-full mt-2">
                <div className="flex justify-between mb-1.5 px-1">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Uploading {currentFileIndex}/{selectedFiles.length}...
                  </span>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-300 dark:disabled:bg-neutral-700 disabled:text-gray-500 dark:disabled:text-neutral-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-2 flex items-center justify-center gap-2"
            >
              {loading ? "Uploading..." : "Start Upload"}
            </button>
            {error && (
              <p className="text-red-500 text-sm font-medium text-center">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <ExpiryTimer createdAt={uploadTime} />

            <div className="text-center w-full flex flex-col items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">
                Your download code
              </p>
              <div className="flex items-center justify-center gap-3 bg-white dark:bg-neutral-900/50 py-4 px-6 rounded-xl border border-gray-100 dark:border-neutral-700 w-full mb-2">
                <h1 className="text-4xl dark:text-white text-neutral-900 font-mono font-bold tracking-widest">
                  {uploadCode}
                </h1>
                <button
                  onClick={handleCopy}
                  className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer transition-colors"
                  title="Copy Code"
                >
                  {copied ? <FiCheckCircle size={20} /> : <FiCopy size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 bg-white/50 dark:bg-neutral-900/30 p-4 rounded-xl border border-gray-100 dark:border-neutral-700/50 w-full">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Scan to download
              </span>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <QRCode
                  value={`${window.location.origin}/download/${uploadCode}`}
                  size={130}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-600 transition-all flex items-center justify-center"
              >
                Upload More
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold py-3 rounded-xl border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" /> Delete Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!hasUploaded && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
            By uploading, you agree to our{" "}
            <Link
              to="/usage"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Usage Guide
            </Link>{" "}
            &{" "}
            <Link
              to="/privacy"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
