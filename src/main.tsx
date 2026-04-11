import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/calendar.css";
import "./styles/insights.css";
import "./styles/glassmorphism.css";
import "./styles/darkmode.css";
import "./styles/risk.css";
import "./styles/advisor.css";
import "./styles/dashboard.css";
import "./styles/grades.css";
import "./styles/mobile.css";

createRoot(document.getElementById("root")!).render(<App />);
