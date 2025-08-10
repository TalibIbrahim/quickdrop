import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-100 text-sm py-6 px-4">
      <div className="flex justify-center space-x-6 text-lg mb-4">
        <Link
          to="/usage"
          className="hover:text-neutral-500 transition duration-200 ease-in-out"
        >
          Usage
        </Link>
        <Link
          to="/privacy"
          className="hover:text-neutral-500 transition duration-200 ease-in-out"
        >
          Privacy Policy
        </Link>
      </div>

      <div className="flex flex-col px-10 md:flex-row items-center md:justify-between gap-4">
        <div className="flex space-x-4 text-2xl">
          <a
            href="https://www.linkedin.com/in/muhammad-talib-9529201ba/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition duration-200 ease-in-out"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://github.com/TalibIbrahim"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition duration-200 ease-in-out"
          >
            <FaGithub />
          </a>
        </div>

        <div className="text-neutral-400 text-sm text-center md:text-right">
          Developed by Muhammad Talib Ibrahim © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
