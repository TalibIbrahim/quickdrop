import { useState, useEffect, useRef } from "react";
import DarkVeil from "./DarkVeil";

const AnimatedDarkVeil = (props) => {
  const [hueShift, setHueShift] = useState(0);
  const requestRef = useRef();

  const animate = (time) => {
    // time is in milliseconds, convert to seconds for speed control
    const speed = 2; // adjust speed here: how fast hueShift changes (degrees per frame)
    setHueShift((prev) => (prev + speed) % 360);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return <DarkVeil {...props} hueShift={hueShift} />;
};

export default AnimatedDarkVeil;
