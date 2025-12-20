import { useState, useEffect } from "react";
import { LuClock } from "react-icons/lu";

const ExpiryTimer = ({ createdAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    // 1. Helper function to find time left by subtracting expiry time with current time.
    const calculateTimeLeft = () => {
      if (!createdAt) {
        return 0;
      }

      // extract time.
      const createdTime = new Date(createdAt).getTime();
      const expiryTime = createdTime + 5 * 60 * 1000; // 5 min in ms. we do ms (i.e. the smallest form) then, use that to find second and minutes afterwards
      const now = new Date().getTime();
      const difference = expiryTime - now;

      return difference > 0 ? difference : 0;
    };

    // 2. start timer.
    // set initial time
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // If already expired on load, notify parent immediately
    if (initialTime <= 0 && onExpire) {
      onExpire();
    }

    // 3. start countdown, this updates time & runs every second
    // update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000); // runs every 1000 ms (i.e. 1 second)

    return () => clearInterval(timer);
  }, [createdAt]);

  if (timeLeft === null) return null;

  // Format time. convert ms into seconds and minutes
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full font-medium text-sm border border-red-100 dark:border-red-800">
        <LuClock className="w-4 h-4" />
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20 px-3 py-1.5 rounded-full font-medium text-sm border border-orange-100 dark:border-orange-800">
      <LuClock className="w-4 h-4 animate-pulse" />
      <span>
        Expires in {minutes}:{formattedSeconds}
      </span>
    </div>
  );
};

export default ExpiryTimer;
