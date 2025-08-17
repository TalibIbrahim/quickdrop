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
      <main className="bg-gradient-to-b from-white to-neutral-50  dark:bg-none dark:bg-neutral-950 transition-colors duration-300 ease-in-out">
        {props.children}
      </main>
      <Footer />
      <button
        onClick={darkModeToggleHandler}
        className="fixed lg:bottom-12 lg:right-8 bottom-4 right-4  z-50 bg-neutral-900 dark:bg-neutral-50 shadow-md/60 text-white dark:text-black text-3xl w-16 h-16 rounded-full cursor-pointer flex items-center justify-center"
      >
        {darkMode ? <MdDarkMode /> : <MdLightMode />}
      </button>
    </>
  );
};

export default LayoutWrapper;
