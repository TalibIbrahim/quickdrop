import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-center text-neutral-100 text-sm py-6 px-4">
      <div className="space-x-6 text-lg mb-6 ">
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
      <p>
        Limited to <strong>1 file</strong> under <strong>50MB</strong> and are
        stored for only <strong>5 minutes</strong>.
      </p>
    </footer>
  );
};

export default Footer;
