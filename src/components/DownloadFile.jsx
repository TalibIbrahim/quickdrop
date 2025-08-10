import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import { LuDownload } from "react-icons/lu";
import ErrorCard from "../../UI/ErrorCard";

const DownloadFile = () => {
  const { fileid } = useParams();
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const res = await fetch(fileData.fileURL);

      if (!res.ok) throw new Error("Failed to fetch file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileData.fileName; // triggers "Save As" with correct name
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // cleanup
    } catch (err) {
      alert(
        "Download failed.\n\nThis might be because:\n• The code is incorrect\n• The file has expired (files are available for only 5 minutes)\n\nPlease check the code or upload again."
      );
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
        setFileData(data);
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
    console.error(error);

    return (
      <ErrorCard message="File not found. The code may be incorrect, expired, or there was a connection problem." />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <h2 className="text-3xl font-bold text-blue-600 mb-4 cursor-pointer">
        Download File
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-8 py-6 shadow-md text-center mb-6">
        <p className="text-lg text-gray-700 font-medium">
          <strong className="text-blue-500">File Name:</strong>{" "}
          {fileData.fileName}
        </p>
      </div>

      <button
        onClick={handleDownload}
        className="px-8 py-3 bg-blue-500 cursor-pointer text-white rounded-md font-semibold hover:bg-blue-600 transition duration-200 flex items-center gap-2"
      >
        <span>Download</span>
        <LuDownload className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default DownloadFile;
