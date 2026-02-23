import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import { LuDownload, LuFile } from "react-icons/lu";
import ErrorCard from "./UI/ErrorCard";
import JSZip from "jszip";
import ExpiryTimer from "./UI/ExpiryTimer";

const DownloadFile = () => {
  const { fileid } = useParams();
  const [fileGroup, setFileGroup] = useState(null); // Changed to handle group data
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  const handleDownload = async () => {
    if (!fileGroup || !fileGroup.files) return;

    setDownloading(true);
    setProgressText("Processing...");

    try {
      // --- Single File ---
      if (fileGroup.files.length === 1) {
        const fileData = fileGroup.files[0];

        // Images/Videos/PDFs - Blob download
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

          // cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // end
        } catch (err) {
          // Fallback
          console.error("Blob download failed:", err);
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

            completed++; //increment count of files completed
            setProgressText(
              `Zipping ${completed}/${fileGroup.files.length}...`,
            );
          } catch (err) {
            console.error(`Error downloading ${file.fileName}`, err);
            folder.file(
              `${file.fileName}_error.txt`,
              "Could not download this file.",
            );
          }
        }),
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
          `${import.meta.env.VITE_BACKEND_URL}/api/files/${fileid}`,
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
    <div className="min-h-[calc(100vh-100px)] flex flex-col relative dark:top-20 items-center justify-center px-4">
      <div className="glass-card flex flex-col items-center p-8 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-gray-200 dark:border-neutral-700/50 rounded-2xl shadow-xl w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-6 text-center">
          Download Ready
        </h2>

        <div className="w-full flex flex-col items-center mb-6">
          <div className="mb-4">
            {fileGroup && <ExpiryTimer createdAt={fileGroup.createdAt} />}
          </div>

          <p className="text-lg text-gray-800 dark:text-neutral-100 font-semibold mb-3 text-center truncate w-full">
            {mainFileName}
          </p>

          {fileCount > 1 && (
            <div className="w-full max-h-32 overflow-y-auto mb-3 bg-white/50 dark:bg-neutral-900/50 rounded-xl p-3 text-sm text-left border border-gray-100 dark:border-neutral-700/50">
              {fileGroup.files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate py-1"
                >
                  <LuFile className="flex-shrink-0 w-4 h-4 text-blue-500" />
                  <span className="truncate">{f.fileName}</span>
                </div>
              ))}
            </div>
          )}

          {totalSize > 0 && (
            <div className="bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400">
              {(totalSize / 1024 / 1024).toFixed(2)} MB Total
            </div>
          )}
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || isExpired}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200
            ${
              downloading
                ? "bg-blue-400 dark:bg-blue-500 cursor-wait text-white"
                : isExpired
                  ? "bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-neutral-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
            }`}
        >
          {downloading ? (
            <>
              <span>{progressText || "Processing..."}</span>
              <Oval
                height={18}
                width={18}
                color="white"
                secondaryColor="rgba(255,255,255,0.5)"
                strokeWidth={4}
              />
            </>
          ) : (
            <>
              <span>
                {isExpired
                  ? "File Expired"
                  : fileCount > 1
                    ? "Download Zip"
                    : "Download File"}
              </span>
              {!isExpired && <LuDownload className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DownloadFile;
