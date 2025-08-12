import { TypeAnimation } from "react-type-animation";
import { useNavigate } from "react-router-dom";
import { LuUpload, LuDownload } from "react-icons/lu";
import Threads from "../animations/Threads";
import DarkVeil from "../animations/DarkVeil";
import { useDarkMode } from "../context/DarkModeContext";

const Home = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  return (
    <>
      <div
        style={{
          width: "100%",
          height: darkMode ? "90%" : "500px",
          position: "absolute",
          bottom: darkMode ? "" : "5em",
          zIndex: 0,
        }}
      >
        {darkMode ? (
          <DarkVeil
            hueShift={15}
            speed={0.6}
            scanlineIntensity={0.7}
            scanlineFrequency={1.5}
            warpAmount={5}
          />
        ) : (
          <Threads
            amplitude={1}
            distance={0.5}
            enableMouseInteraction={true}
            color={[0.231, 0.51, 0.965]}
          />
        )}
      </div>
      <div className="min-h-[calc(100vh-150px)] flex flex-col pt-64 items-center px-4">
        <h1
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 600,
          }}
          className=" relative text-6xl font-bold text-blue-600 dark:text-white text-center "
        >
          QUICKDROP
        </h1>

        <TypeAnimation
          sequence={[
            // Same substring at the start will only be typed once, initially
            "Send files instantly — no login needed",
            1500,
            "Send files instantly — to anyone, anywhere",
            1500,
            "Send files instantly — in just seconds",
            1500,
            "Lightning fast uploads and downloads!",
            1500,
            "No compression — 100% lossless quality",
            1500,
            "Share files with a simple key or QR Code",
            1500,
            "Files expire after 5 minutes",
            1500,
            "Supports files up to 50MB",
            1500,
          ]}
          speed={80}
          repeat={Infinity}
          className="relative text-blue-500 dark:text-neutral-300 text-lg lg:text-2xl mb-11 mt-4"
        />

        <div className="flex flex-col items-center justify-center md:flex-row gap-6 font-medium text-xl">
          {/* Upload Button: Outlined */}
          <button
            onClick={() => navigate("/upload")}
            className="glass-card flex items-center justify-around dark:rounded-4xl  px-8 py-3 dark:py-4 w-60 text-center border-2 border-blue-500 text-blue-500 bg-white rounded-lg shadow-md 
             hover:bg-blue-500 hover:text-white hover:shadow-lg/30 hover:scale-105 cursor-pointer relative
             transition !duration-300"
          >
            <span className="w-40">Upload File</span>
            <LuUpload className="w-5 h-5" strokeWidth={2.5} />
          </button>

          {/* Download Button: Filled */}
          <button
            onClick={() => navigate("/download")}
            className="flex items-center justify-around px-8 py-3 dark:py-4 gap-2 dark:rounded-4xl w-60 text-center  bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-800 text-white rounded-lg shadow-md 
             hover:bg-blue-600 hover:shadow-lg/30 hover:scale-105 cursor-pointer relative
             transition !duration-300"
          >
            <span className="w-40">Download File</span>
            <LuDownload className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
