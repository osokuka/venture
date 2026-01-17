import { createRoot } from "react-dom/client";
import App from "./AppWithRouter.tsx";
import "./index.css";

// Error suppression removed for debugging
// We need to see the actual errors to diagnose the 500 error issue

createRoot(document.getElementById("root")!).render(<App />);
  