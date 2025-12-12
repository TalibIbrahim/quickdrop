import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import { LuDownload, LuFile } from "react-icons/lu";
import ErrorCard from "../../UI/ErrorCard";
import JSZip from "jszip";

const DownloadFile = () => {
  const { fileid } = useParams();
  const [fileGroup, setFileGroup] = useState(null); // Changed to handle group data
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progressText, setProgressText] = useState("");

  const handleDownload = async () => {
    if (!fileGroup || !fileGroup.files) return;

    setDownloading(true);
    setProgressText("Processing...");

    try {
      // --- SCENARIO 1: Single File ---
      if (fileGroup.files.length === 1) {
        const fileData = fileGroup.files[0];

        // Raw files (existing logic)
        if (fileData.resourceType === "raw") {
          window.open(fileData.fileURL, "_self");
          setDownloading(false);
          return;
        }

        // Images/Videos - Blob download
        try {
          const res = await fetch(fileData.fileURL);
          if (!res.ok) throw new Error("Network error");

          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = fileData.fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (err) {
          // Fallback
          window.open(fileData.fileURL, "_self");
        }
        setDownloading(false);
        return;
      }

      // --- SCENARIO 2: Multiple Files (ZIP) ---
      const zip = new JSZip();
      const folderName = `QuickDrop_${fileGroup.code}`;
      const folder = zip.folder(folderName);
      let completed = 0;

      // Download all files and add to zip
      await Promise.all(
        fileGroup.files.map(async (file) => {
          try {
            const response = await fetch(file.fileURL);
            if (!response.ok)
              throw new Error(`Failed to fetch ${file.fileName}`);
            const blob = await response.blob();
            folder.file(file.fileName, blob);

            completed++;
            setProgressText(
              `Zipping ${completed}/${fileGroup.files.length}...`
            );
          } catch (err) {
            console.error(`Error downloading ${file.fileName}`, err);
            folder.file(
              `${file.fileName}_error.txt`,
              "Could not download this file."
            );
          }
        })
      );

      setProgressText("Generating Zip...");
      const content = await zip.generateAsync({ type: "blob" });

      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Error downloading files");
    } finally {
      setDownloading(false);
      setProgressText("");
    }
  };

  useEffect(() => {
    async function fetchFile() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/files/${fileid}`
        );

        if (!res.ok) throw new Error("File not found");
        const data = await res.json();
        // Backend now returns { files: [...], ... }
        // Ensure we handle both old (single) and new (array) structures if needed
        // but typically we assume the backend format matches the new controller.
        setFileGroup(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFile();
  }, [fileid]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Oval height={80} width={80} color="#3B82F6" secondaryColor="#3B82F6" />
      </div>
    );
  if (error) {
    return (
      <ErrorCard message="File not found. The code may be incorrect, expired, or there was a connection problem." />
    );
  }

  // Safe check for files array
  const fileCount = fileGroup?.files?.length || 0;
  const mainFileName =
    fileCount === 1 ? fileGroup.files[0].fileName : `${fileCount} Files`;
  const totalSize =
    fileGroup.totalSize ||
    (fileGroup.files && fileGroup.files.reduce((acc, f) => acc + f.size, 0)) ||
    0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-4 cursor-pointer">
        Download Files
      </h2>

      <div className="bg-blue-50 dark:bg-neutral-800 border border-blue-200 dark:border-blue-300 rounded-lg px-8 py-6 shadow-md text-center mb-6 w-full max-w-md">
        <p className="text-lg text-gray-700 dark:text-neutral-50 font-medium mb-2">
          <strong className="text-blue-500">Content:</strong> {mainFileName}
        </p>

        {/* If multiple files, show a small list preview */}
        {fileCount > 1 && (
          <div className="max-h-32 overflow-y-auto mb-3 bg-white/50 dark:bg-black/20 rounded p-2 text-sm text-left">
            {fileGroup.files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate"
              >
                <LuFile className="flex-shrink-0 w-3 h-3" />
                <span className="truncate">{f.fileName}</span>
              </div>
            ))}
          </div>
        )}

        {totalSize > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Size: {(totalSize / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`px-8 py-3 rounded-md font-semibold transition duration-200 flex items-center gap-2 text-white
          ${
            downloading
              ? "bg-blue-400 cursor-wait"
              : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
          }`}
      >
        {downloading ? (
          <>
            <span>{progressText || "Processing..."}</span>
            <Oval
              height={20}
              width={20}
              color="white"
              secondaryColor="white"
              strokeWidth={4}
            />
          </>
        ) : (
          <>
            <span>{fileCount > 1 ? "Download All as Zip" : "Download"}</span>
            <LuDownload className="w-5 h-5" strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
};

export default DownloadFile;
