import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

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
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center px-4 dark:top-20 relative">
      <div className="glass-card flex flex-col items-center p-8 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-gray-200 dark:border-neutral-700/50 rounded-2xl shadow-xl w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-6 text-center">
          Download File
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="ENTER CODE"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 p-4 rounded-xl text-center tracking-[0.3em] text-xl font-mono uppercase focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:tracking-normal"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Retrieve</span>
            <FaArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DownloadForm;
