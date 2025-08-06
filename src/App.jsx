import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import UploadPage from "./components/UploadPage";
import DownloadForm from "./components/DownloadForm";
import "./App.css";
import DownloadFile from "./components/DownloadFile";
import LayoutWrapper from "./layout/LayoutWrapper";
import UsagePage from "./components/UsagePage";
import PrivacyPolicy from "./components/PrivacyPolicy";

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/download" element={<DownloadForm />} />
          <Route path="/download/:fileid" element={<DownloadFile />} />
          <Route path="/usage" element={<UsagePage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
