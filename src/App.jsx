import { Routes, Route } from "react-router-dom";
import MDOnlineSimulator from "./md-online-simulator.jsx";
import HelpPage from "./HelpPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MDOnlineSimulator />} />
      <Route path="/help" element={<HelpPage />} />
    </Routes>
  );
}
