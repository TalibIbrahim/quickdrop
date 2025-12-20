import { MdErrorOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const ErrorCard = ({ title = "Something went wrong", message }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-50 px-4 text-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full shadow-lg">
        <MdErrorOutline className="text-red-500 text-5xl mb-4 mx-auto" />

        <h2 className="text-2xl font-bold text-red-700 mb-3">{title}</h2>
        <p className="text-red-600 text-sm mb-6 break-words">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 text-white cursor-pointer font-medium rounded-lg shadow hover:bg-red-600 active:scale-95 transition"
          >
            Try Again
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-500 text-white cursor-pointer font-medium rounded-lg shadow hover:bg-gray-600 active:scale-95 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorCard;
