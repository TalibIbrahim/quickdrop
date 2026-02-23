import { Link } from "react-router-dom";
import logo from "../assets/logoALT.png";
import iconLogo from "../assets/logo.png";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling when the mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <nav className="glass-card flex relative dark:absolute dark:top-10 dark:left-1/2 dark:-translate-x-1/2 dark:w-9/10 dark:z-40 dark:rounded-full lg:dark:px-12 dark:px-4 justify-between items-center px-8 py-6 bg-neutral-900">
        {/* LOGO section */}
        <div
          className="text-blue-500 font-bold text-6xl"
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 700,
            fontStyle: "italic",
          }}
        >
          <Link to="/" className="transition duration-200 ease-in-out">
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

        {/* HAMBURGER MENU BUTTON */}
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden text-neutral-200 focus:outline-none z-50 hover:text-blue-500 transition-colors"
          aria-label="Open Menu"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex md:static md:flex-row md:w-auto md:mt-0 md:p-0 md:bg-transparent md:shadow-none gap-6 text-neutral-200 font-normal text-xl z-40 items-center">
          <Link
            to="/p2p-share"
            className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out"
          >
            P2P Share
          </Link>
          <Link
            to="/upload"
            className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out"
          >
            Upload
          </Link>
          <Link
            to="/download"
            className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out"
          >
            Download
          </Link>
        </div>
      </nav>

      {/* MOBILE OVERLAY BACKGROUND (Decoupled from sidebar) */}
      <div
        className={`fixed inset-0 z-[60] md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* MOBILE SIDEBAR (Forced to the right using inline styles) */}
      <div
        className={`fixed top-0 bottom-0 w-64 bg-neutral-900 glass-card shadow-2xl flex flex-col px-8 py-6 z-[70] md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ right: 0, left: "auto" }} // This guarantees it stays on the right in Dark Mode
      >
        {/* CLOSE BUTTON */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-200 focus:outline-none hover:text-blue-500 transition-colors"
            aria-label="Close Menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* MOBILE MENU LINKS */}
        <div className="flex flex-col gap-6 text-neutral-200 font-normal text-xl">
          <Link
            to="/p2p-share"
            onClick={() => setIsOpen(false)}
            className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out"
          >
            P2P Share
          </Link>
          <Link
            to="/upload"
            onClick={() => setIsOpen(false)}
            className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out"
          >
            Upload
          </Link>
          <Link
            to="/download"
            onClick={() => setIsOpen(false)}
            className="hover:text-blue-500 dark:hover:text-blue-600 transition duration-300 ease-in-out"
          >
            Download
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
