import { TypeAnimation } from "react-type-animation";
import { useNavigate } from "react-router-dom";
import { LuUpload, LuDownload, LuArrowLeftRight } from "react-icons/lu";
import Threads from "../animations/Threads";
import DarkVeil from "../animations/DarkVeil";
import { useDarkMode } from "../context/DarkModeContext";
import lightModeLogo from "../assets/lightmode logo.png";
import darkModeLogo from "../assets/darkmode logo.png";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  return (
    <>
      <div
        style={{
          width: "100%",
          height: darkMode ? "100%" : "500px",
          position: "absolute",
          top: darkMode ? "0" : "",
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
      <div className="min-h-[calc(100vh-150px)] flex flex-col pt-28 relative justify-center items-center px-4 z-10">
        <h1
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 600,
          }}
          className=" relative text-6xl font-bold text-blue-600 dark:text-white text-center "
        >
          <motion.img
            src={darkMode ? darkModeLogo : lightModeLogo}
            alt="main logo"
            className="lg:h-28 h-24 mb-2"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
          />
        </h1>

        <TypeAnimation
          sequence={[
            "Now with P2P File Sharing! - Send files directly",
            1500,
            "You can send files directly by using P2P share",
            1500,
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
            "Supports files up to 150MB",
            1500,
          ]}
          speed={80}
          repeat={Infinity}
          className="relative text-blue-500 dark:text-neutral-300 text-lg lg:text-2xl mb-11 mt-4 text-center px-2"
        />

        <motion.div
          className="flex flex-col items-center justify-center sm:flex-row flex-wrap gap-4 sm:gap-5 font-medium text-xl w-full max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            delay: 0.4,
          }}
        >
          {/* Upload Button */}
          <button
            onClick={() => navigate("/upload")}
            className="glass-card interactive flex items-center gap-3 dark:rounded-full px-7 py-3 dark:py-3.5 whitespace-nowrap border-2 border-blue-500 text-blue-500 bg-white rounded-xl shadow-md
             hover:bg-blue-500 hover:text-white hover:shadow-lg/30 hover:scale-105 cursor-pointer relative
             transition !duration-300"
          >
            <LuUpload className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            <span>Upload File</span>
          </button>

          {/* Download Button */}
          <button
            onClick={() => navigate("/download")}
            className="flex items-center gap-3 px-7 py-3 dark:py-3.5 dark:rounded-full whitespace-nowrap bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-800 text-white rounded-xl shadow-md
             hover:bg-blue-600 hover:shadow-lg/30 hover:scale-105 cursor-pointer relative
             transition !duration-300"
          >
            <LuDownload className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            <span>Download File</span>
          </button>

          {/* P2P Share Button */}
          <button
            onClick={() => navigate("/p2p-share")}
            className="p2p-btn flex items-center gap-3 px-7 py-3 dark:py-3.5 dark:rounded-full whitespace-nowrap rounded-xl shadow-md
             hover:scale-105 cursor-pointer relative transition !duration-300"
          >
            <LuArrowLeftRight className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            <span>P2P Share</span>
          </button>
        </motion.div>

        {/* P2P feature hint */}
        <motion.p
          className="mt-5 text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          ✦ P2P Share sends files directly — no server, no wait
        </motion.p>
      </div>
    </>
  );
};

export default Home;
