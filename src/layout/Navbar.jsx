import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-neutral-900">
      <div
        className="text-blue-500 font-bold text-6xl "
        style={{
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 700,
          fontStyle: "italic",
        }}
      >
        <Link
          to="/"
          className="hover:text-blue-600 transition duration-200 ease-in-out "
        >
          Q
        </Link>
      </div>
      <div className="flex gap-6 text-neutral-200 font-normal text-xl ">
        <Link
          to="/upload"
          className="hover:text-blue-500 transition duration-300 ease-in-out "
        >
          Upload
        </Link>
        <Link
          to="/download"
          className="hover:text-blue-500 transition duration-300 ease-in-out "
        >
          Download
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
