import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { FinanceProvider } from "./context/FinanceContext";
import { ProfileProvider } from "./context/ProfileContext";

import "./index.css";

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <ProfileProvider>
      <FinanceProvider>
        <App />
      </FinanceProvider>
    </ProfileProvider>
  </StrictMode>
);