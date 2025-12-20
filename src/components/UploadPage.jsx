import { useState } from "react";
import { FiCopy, FiTrash2 } from "react-icons/fi";
import { LuUpload } from "react-icons/lu";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";
import axios from "axios";
import ExpiryTimer from "./UI/ExpiryTimer";
import { Oval } from "react-loader-spinner";

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

  // Upload single file. Can upload both single and multiple
  const uploadSingleFile = async (file, cloudName, formDataBase) => {
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalSize = file.size;

    // because of how cloudinary treats pdfs, we FORCE our pdf upload to send the file as 'raw'
    // on auto, it sends it as 'image'
    const isPDF = file.type === "application/pdf";
    const resourceType = isPDF ? "raw" : "auto";

    // if small file, direct Upload
    if (totalSize < 6 * 1024 * 1024) {
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
          onUploadProgress: (e) => {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
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
      formData.append("file", chunk);

      const headers = {
        "X-Unique-Upload-Id": uniqueUploadId,
        "Content-Range": `bytes ${start}-${end - 1}/${totalSize}`,
      };

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        formData,
        {
          headers,
          onUploadProgress: (e) => {
            const totalUploaded = start + e.loaded;
            const percent = Math.round((totalUploaded * 100) / totalSize);
            setUploadProgress(percent);
          },
        }
      );

      finalResponse = res;
      start = end;
      end = Math.min(start + CHUNK_SIZE, totalSize);
    }

    return finalResponse;
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

    setSelectedFiles(filesArray);
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
      // 1. Get Signature (Once for the session)
      const signRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/sign-upload`,
        { method: "POST" }
      );

      if (!signRes.ok) throw new Error("Failed to get upload permission");

      const { signature, timestamp, cloudName, apiKey, folder } =
        await signRes.json();

      const formDataBase = new FormData();
      formDataBase.append("api_key", apiKey);
      formDataBase.append("timestamp", timestamp);
      formDataBase.append("signature", signature);
      formDataBase.append("folder", folder);

      // 2. Upload Files Individually
      const uploadedFilesData = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentFileIndex(i + 1); // Update UI to show "Uploading 1 of X"
        setUploadProgress(0);

        const file = selectedFiles[i];
        const res = await uploadSingleFile(file, cloudName, formDataBase);
        const data = res.data;

        uploadedFilesData.push({
          fileName: file.name,
          fileURL: data.secure_url,
          publicId: data.public_id,
          resourceType: data.resource_type,
          size: data.bytes,
        });
      }

      // 3. Save Metadata (Send the ARRAY of files)
      const saveRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/save-metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: uploadedFilesData, // Sending array
          }),
        }
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
        `${import.meta.env.VITE_BACKEND_URL}/api/files/${uploadCode}`
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
      className={` ${
        hasUploaded ? "min-h-[calc(105vh)]" : "min-h-[calc(100vh-100px)]"
      } flex flex-col items-center justify-center mb-10 `}
    >
      <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-500 pt-28 mb-6">
        Upload Files
      </h2>

      {/* Drag-and-Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full max-w-xl h-48 border-2 flex flex-col items-center justify-center border-dashed border-blue-400 rounded-lg text-center text-gray-600 dark:hover:bg-blue-950 hover:bg-blue-50 transition mb-6 px-4"
      >
        {selectedFiles.length > 0 ? (
          <div className="text-blue-600 dark:text-blue-500">
            <p className="font-bold text-lg mb-1">
              {selectedFiles.length} files selected
            </p>
            <ul className="text-sm opacity-80 list-none">
              {selectedFiles.slice(0, 3).map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
              {selectedFiles.length > 3 && (
                <li>...and {selectedFiles.length - 3} more</li>
              )}
            </ul>
            <p className="text-xs mt-2 opacity-70">
              Total:{" "}
              {(
                selectedFiles.reduce((acc, f) => acc + f.size, 0) /
                1024 /
                1024
              ).toFixed(2)}{" "}
              MB
            </p>
          </div>
        ) : (
          <p className="dark:text-neutral-100">
            Drag and drop files here <br />
            <span className="text-xs opacity-70">(150MB Total)</span>
          </p>
        )}
      </div>

      <input
        type="file"
        id="fileInput"
        name="file"
        multiple // Enable multiple selection
        onChange={handleFileChange}
        className="hidden"
      />

      <label
        htmlFor="fileInput"
        onClick={hasUploaded ? handleReset : undefined}
        className="glass-card interactive dark:rounded-4xl dark:px-9 dark:py-3.5 cursor-pointer px-7 py-3 mb-4 bg-white border-2 border-blue-500 text-blue-500 rounded-md font-semibold hover:bg-blue-500 hover:shadow-md/50 hover:text-white transition duration-200"
      >
        {hasUploaded ? "Upload New Files" : "Choose Files"}
      </label>

      {/* Upload Button / Progress Bar */}
      {loading ? (
        <div className="w-full max-w-xs mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-700 dark:text-white">
              Uploading {currentFileIndex}/{selectedFiles.length}...
            </span>
            <span className="text-sm font-medium text-blue-700 dark:text-white">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleUpload}
          disabled={hasUploaded || selectedFiles.length === 0}
          className={`flex items-center gap-2 dark:rounded-4xl dark:px-9 dark:py-3.5 px-7 py-3 mb-4 cursor-pointer disabled:cursor-not-allowed rounded-md font-semibold transition duration-200 
            ${
              hasUploaded || selectedFiles.length === 0
                ? "bg-gray-300 dark:bg-neutral-700 dark:text-neutral-200 text-gray-600 cursor-not-allowed"
                : "bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:bg-blue-600 hover:shadow-md/50"
            }`}
        >
          {hasUploaded ? "Files Uploaded!" : uploadText}
        </button>
      )}

      {/* Upload Code Display */}
      {uploadCode && (
        <div className="mt-4 flex flex-col items-center gap-4 text-black dark:text-neutral-50 font-medium text-2xl">
          {/* EXPIRY TIMER */}
          <ExpiryTimer createdAt={uploadTime} />
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-blue-500 mr-2">Code: </strong>{" "}
              {uploadCode}
            </span>
            {/* COPY BUTTON */}
            <button
              onClick={handleCopy}
              className="px-2 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition text-sm"
            >
              {copied ? "Copied!" : <FiCopy size={20} />}
            </button>
          </div>
          {/* DELETE BUTTON */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`glass-btn-red flex items-center gap-2 dark:rounded-4xl dark:px-9 dark:py-3.5 text-base cursor-pointer px-7 py-3 mt-2  bg-neutral-50 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-500 hover:shadow-md/50 hover:text-white transition duration-200
              ${isDeleting ? "opacity-70 cursor-wait" : ""}`}
          >
            {isDeleting ? (
              <>
                <Oval
                  height={20}
                  width={20}
                  color="#ef4444"
                  secondaryColor="#ef4444"
                  strokeWidth={4}
                />
                <span className="text-red-500">Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 className="w-5 h-5" />
                <span>Delete Now</span>
              </>
            )}
          </button>
        </div>
      )}

      {!hasUploaded && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-6 mb-4 text-center">
          Please read our{" "}
          <Link
            to="/usage"
            className="text-blue-600 hover:underline dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-700"
          >
            Usage Guide
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-blue-600 hover:underline dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-700"
          >
            Privacy Policy
          </Link>{" "}
          before using QuickDrop.
        </p>
      )}

      {uploadCode.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-gray-700 dark:text-gray-200 font-medium">
            Scan to download
          </span>
          <div className="bg-white p-4 rounded shadow">
            <QRCode
              value={`${window.location.origin}/download/${uploadCode}`}
              size={150}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-200 mt-3 text-center break-all">
            Download Link:{" "}
            <a
              href={`${window.location.origin}/download/${uploadCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {`${window.location.origin}/download/${uploadCode}`}
            </a>
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-4 text-red-500 font-medium">{error}</div>}
    </div>
  );
};

export default UploadPage;
