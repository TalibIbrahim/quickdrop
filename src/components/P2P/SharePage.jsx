import { useState } from "react";
import Sender from "./Sender";
import Receiver from "./Receiver";

import { LuLogIn, LuArrowLeft, LuGlobe, LuWifi } from "react-icons/lu";
import { MdRadar } from "react-icons/md";
import { GoHome } from "react-icons/go";
import LocalRadar from "./LocalRadar";

const SharePage = () => {
  const [mode, setMode] = useState(null);

  return (
    <div className="min-h-[95vh] flex flex-col items-center dark:mt-16  justify-center px-4 text-neutral-800 dark:text-white transition-colors duration-300">
      {/* Header Section */}
      {!mode && (
        <div className="text-center mb-10 mt-[-5vh]">
          <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-3">
            Transfer Files
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Choose how you want to connect. Share securely across the globe or
            across the room.
          </p>
        </div>
      )}

      {/* Selection Cards */}
      {!mode && (
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center">
          {/* Global P2P Card */}
          <div className="flex-1 glass-card bg-white dark:bg-neutral-900/50 p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500/30 transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                <LuGlobe className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold">Global P2P Transfer</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Connect anywhere using a secure room code.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <button
                onClick={() => setMode("send")}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <GoHome className="w-5 h-5" />
                <span>Create Room</span>
              </button>

              <button
                onClick={() => setMode("receive")}
                className="w-full py-3 bg-transparent border-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LuLogIn className="w-5 h-5" strokeWidth={2.5} />
                <span>Join Room</span>
              </button>
            </div>
          </div>

          {/* Local Radar Card */}
          <div className="flex-1 glass-card bg-white dark:bg-neutral-900/50 p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500/30 transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                <LuWifi className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold">Local Radar</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Instantly discover and share to devices on your current Wi-Fi
                  network.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <button
                onClick={() => setMode("radar")}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MdRadar className="w-5 h-5" />
                <span>Scan Network</span>
              </button>
              <p className="text-xs text-center text-neutral-400 dark:text-neutral-500 mt-2 font-medium">
                Best for high-speed, large file transfers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Render the selected component */}
      <div className="w-full max-w-4xl flex justify-center">
        {mode === "send" && <Sender onBack={() => setMode(null)} />}
        {mode === "receive" && <Receiver onBack={() => setMode(null)} />}
        {mode === "radar" && <LocalRadar onBack={() => setMode(null)} />}
      </div>

      {/* Back Button */}
      {mode && (
        <button
          onClick={() => setMode(null)}
          className="mt-8 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 flex flex-row items-center gap-2 transition-colors cursor-pointer"
        >
          <LuArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          <span className="font-medium">Back to selection</span>
        </button>
      )}
    </div>
  );
};

export default SharePage;
