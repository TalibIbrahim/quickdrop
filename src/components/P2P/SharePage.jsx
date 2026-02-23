import { useState } from "react";
import Sender from "./Sender";
import Receiver from "./Receiver";

import { LuLogIn, LuArrowLeft } from "react-icons/lu";
import { GoHome } from "react-icons/go";
import LocalRadar from "./LocalRadar";

const SharePage = () => {
  const [mode, setMode] = useState(null);

  return (
    <div className="min-h-[95vh] flex flex-col items-center relative bottom-10 dark:top-12 justify-center px-4 text-white">
      <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-12">
        Direct Share (P2P)
      </h2>

      {!mode && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setMode("send")}
            className="glass-card interactive dark:rounded-4xl dark:py-3.5 cursor-pointer w-64 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-md font-semibold hover:bg-blue-500 hover:shadow-md/50 hover:text-white transition duration-200 flex items-center justify-center gap-3"
          >
            <span>Create Room</span>
            <GoHome className="w-5 h-5" strokeWidth={0.75} />
          </button>

          <button
            onClick={() => setMode("receive")}
            className="glass-card interactive dark:rounded-4xl dark:py-3.5 cursor-pointer w-64 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-md font-semibold hover:bg-blue-500 hover:shadow-md/50 hover:text-white transition duration-200 flex items-center justify-center gap-3"
          >
            <span>Join Room</span>
            <LuLogIn className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setMode("radar")}
            className="glass-card interactive dark:rounded-4xl dark:py-3.5 cursor-pointer w-64 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-md font-semibold hover:bg-blue-500 hover:shadow-md/50 hover:text-white transition duration-200 flex items-center justify-center gap-3"
          >
            <span>Local Radar</span>
            {/* You can import a radar icon from react-icons/md like MdRadar */}
          </button>
        </div>
      )}

      {/* Renders the selected component */}
      {mode === "send" && <Sender onBack={() => setMode(null)} />}
      {mode === "receive" && <Receiver onBack={() => setMode(null)} />}
      {mode === "radar" && <LocalRadar onBack={() => setMode(null)} />}

      {mode && (
        <button
          onClick={() => setMode(null)}
          className="mt-8 text-blue-500 hover:text-blue-600 flex flex-row items-center justify-between gap-2"
        >
          <LuArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          <span>Back to selection</span>
        </button>
      )}
    </div>
  );
};

export default SharePage;
