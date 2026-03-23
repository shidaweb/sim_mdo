import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MDOnlineSimulator from "./md-online-simulator.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MDOnlineSimulator />
  </StrictMode>
);
