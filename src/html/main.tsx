import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StyleProvider } from "@ant-design/cssinjs";
import App from "./layout";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <StyleProvider layer>
        <App />
      </StyleProvider>
  </StrictMode>,
);
