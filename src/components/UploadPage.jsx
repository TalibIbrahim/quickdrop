import { useState } from "react";
import { Oval } from "react-loader-spinner";
import { FiCopy } from "react-icons/fi";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadCode, setUploadCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasUploaded, setHasUploaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // sets file state to the uploaded file
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadCode("");
    setError("");
    setHasUploaded(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setUploadCode("");
      setError("");
      setHasUploaded(false);
    }
  };

  const handleUpload = async () => {
    // 1.check if file exists
    if (!file) {
      setError("Please select a file");
      return;
    }

    console.log(import.meta.env.VITE_BACKEND_URL, "BACKEND URL");

    // turn on the loading state if true and empty the error state (just in case)
    setLoading(true);
    setError("");

    // push the file to formData
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/files/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      // if faced an error during upload throw this error

      if (!res.ok) {
        // Try to get error message from backend JSON response
        const errorData = await res.json();
        throw new Error(errorData.message || "Upload failed");
      }

      // save the generated shortid code to display to the user
      const data = await res.json();
      setUploadCode(data.code);
      setHasUploaded(true);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
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

    setFile(null);
    setUploadCode("");
    setHasUploaded(false);
    setCopied(false);
    setError("");
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center bg-neutral-50 px-4">
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Upload a File</h2>

      {/* Drag-and-Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full max-w-xl h-48 border-2 flex flex-col items-center justify-center border-dashed border-blue-400 rounded-lg text-center text-gray-600 hover:bg-blue-50 transition mb-6"
      >
        {file ? (
          <p className="text-blue-600 font-medium">{file.name}</p>
        ) : (
          <p>Drag and drop your file here</p>
        )}
      </div>

      {/* File Input (Hidden) */}
      <input
        type="file"
        id="fileInput"
        name="file"
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="fileInput"
        onClick={hasUploaded ? handleReset : undefined}
        className="cursor-pointer px-6 py-2 mb-4 bg-white border-2 border-blue-500 text-blue-500 rounded-md font-semibold hover:bg-blue-500 hover:text-white transition duration-200"
      >
        {hasUploaded ? "Choose New File" : "Choose File"}
      </label>

      {/* Upload Button */}
      {loading ? (
        <div className="mb-4">
          <Oval
            height={60}
            width={60}
            color="#3B82F6"
            secondaryColor="#3B82F6"
          />
        </div>
      ) : (
        <button
          onClick={handleUpload}
          disabled={hasUploaded}
          className={`px-8 py-3 mb-4 cursor-pointer rounded-md font-semibold transition duration-200 ${
            hasUploaded
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg"
          }`}
        >
          {hasUploaded ? "Uploaded!" : "Upload"}
        </button>
      )}

      {/* Upload Code Display */}
      {uploadCode && (
        <div className="mt-4 flex items-center gap-4 text-black font-medium text-2xl">
          <span>
            <strong className="text-blue-500 mr-2">Code: </strong> {uploadCode}
          </span>
          <button
            onClick={handleCopy}
            className="px-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            {copied ? "Copied!" : <FiCopy size={20} />}
          </button>
        </div>
      )}

      {!hasUploaded && (
        <p className="text-sm text-gray-600 mt-6 mb-4 text-center">
          Please read our{" "}
          <Link
            to="/usage"
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            Usage Guide
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            Privacy Policy
          </Link>{" "}
          before using QuickDrop.
        </p>
      )}

      {uploadCode.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-gray-700 font-medium">Scan to download</span>
          <div className="bg-white p-4 rounded shadow">
            {typeof window !== "undefined" &&
              console.log(
                "DOWNLOAD LINK IS: ",
                `${window.location.origin}/download/${uploadCode}`
              )}
            <QRCode
              value={`${window.location.origin}/download/${uploadCode}`}
              size={150}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center break-all">
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
