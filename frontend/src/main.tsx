import { StrictMode } from"react";
import { createRoot } from"react-dom/client";
import"./index.css";
import App from"./App.tsx";
import"./i18n/i18n"; // Import i18n configuration
import * as serviceWorkerRegistration from"./services/serviceWorkerRegistration";

createRoot(document.getElementById("root")!).render(
 <StrictMode>
  <App />
 </StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
