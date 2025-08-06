import Navbar from "./Navbar";
import Footer from "./Footer";

const LayoutWrapper = (props) => {
  return (
    <>
      <Navbar />
      <main>{props.children}</main>
      <Footer />
    </>
  );
};

export default LayoutWrapper;
