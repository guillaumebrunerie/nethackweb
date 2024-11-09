import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { Footer } from "./Footer.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
		<Footer />
	</StrictMode>,
);