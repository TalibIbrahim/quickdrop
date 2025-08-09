import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DownloadForm = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/download/${code.trim()}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)]  flex flex-col items-center justify-center bg-neutral-50 px-4">
      <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">
        Enter File Code to Download
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 items-center"
      >
        <input
          type="text"
          placeholder="Enter file code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="px-4 py-2 border-2 border-blue-400 rounded-md uppercase focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 w-64 sm:w-80"
          required
        />
        <button
          type="submit"
          className="px-6 py-2 border-2 border-blue-500  bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition duration-200"
        >
          Go
        </button>
      </form>
    </div>
  );
};

export default DownloadForm;
