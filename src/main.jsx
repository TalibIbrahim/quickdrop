import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import React from "react";
import { DarkModeContextProvider } from "./context/DarkModeContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DarkModeContextProvider>
        <>
          <App />
          <Analytics />
        </>
      </DarkModeContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
