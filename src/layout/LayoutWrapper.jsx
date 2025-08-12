import Navbar from "./Navbar";
import Footer from "./Footer";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useDarkMode } from "../context/DarkModeContext";

const LayoutWrapper = (props) => {
  const { darkMode, setDarkMode } = useDarkMode();

  const darkModeToggleHandler = () => {
    setDarkMode(!darkMode);
  };

  return (
    <>
      <Navbar />
      <main>{props.children}</main>
      <Footer />
      <button
        onClick={darkModeToggleHandler}
        className="fixed bottom-20 right-4 z-50 bg-neutral-900 dark:bg-neutral-50 shadow-md/60 text-white dark:text-black text-3xl w-16 h-16 rounded-full cursor-pointer flex items-center justify-center"
      >
        {darkMode ? <MdDarkMode /> : <MdLightMode />}
      </button>
    </>
  );
};

export default LayoutWrapper;
