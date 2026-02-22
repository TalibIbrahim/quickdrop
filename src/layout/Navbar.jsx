import { Link } from "react-router-dom";
import logo from "../assets/logoALT.png";
import iconLogo from "../assets/logo.png";
import { useDarkMode } from "../context/DarkModeContext";

const Navbar = () => {
  return (
    <nav className="glass-card flex dark:absolute dark:top-10 dark:left-1/2 dark:-translate-x-1/2 dark:w-9/10 dark:z-40 dark:rounded-full lg:dark:px-12 dark:px-4  justify-between items-center px-8 py-6 bg-neutral-900">
      <div
        className="text-blue-500 font-bold text-6xl "
        style={{
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 700,
          fontStyle: "italic",
        }}
      >
        <Link to="/" className="transition duration-200 ease-in-out ">
          <img
            src={logo}
            alt="app logo full"
            className="hidden sm:block lg:h-12 h-8"
          />
          <img
            src={iconLogo}
            alt="app icon logo"
            className="block sm:hidden h-11 pl-5"
          />
        </Link>
      </div>
      <div className="flex gap-6 text-neutral-200 font-normal text-xl ">
        <Link
          to="/p2p-share"
          className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out "
        >
          P2P Share
        </Link>
        <Link
          to="/upload"
          className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out "
        >
          Upload
        </Link>
        <Link
          to="/download"
          className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out "
        >
          Download
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
