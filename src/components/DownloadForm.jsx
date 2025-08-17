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
    <div className="min-h-[calc(100vh-160px)]  flex flex-col items-center justify-center  px-4">
      <h2 className="text-3xl font-semibold text-blue-600 dark:text-blue-500 mb-6 text-center">
        Enter File Code to Download
      </h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 items-center"
      >
        <input
          type="text"
          placeholder="E.G. EFGHIJ"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="px-4 py-2 border-2 border-blue-400 dark:border-blue-500 dark:focus:ring-blue-400 rounded-md uppercase focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 dark:text-neutral-50 w-64 sm:w-80"
          required
        />
        <button
          type="submit"
          className="flex items-center gap-1 w-24 text-center px-6 py-2 bg-blue-500 dark:bg-blue-600 border-2 border-blue-500 text-white rounded-md font-semibold 
             transition-all duration-400 ease-in-out cursor-pointer
             hover:bg-white dark:hover:bg-blue-800 dark:hover:border-blue-700 dark:border-blue-700 dark:hover:text-white hover:text-blue-500 hover:border-blue-500 hover:gap-2.5"
        >
          <span>Go</span>
          <FaArrowRight className="w-4 h-4 " />
        </button>
      </form>
    </div>
  );
};

export default DownloadForm;
