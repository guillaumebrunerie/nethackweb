import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const buildMonth = new Date().toLocaleString("en-US", {
	month: "long",
	year: "numeric",
});

// https://vite.dev/config/
export default defineConfig({
	base: "",
	define: {
		__BUILD_MONTH__: JSON.stringify(buildMonth),
	},
	plugins: [
		react({
			babel: {
				// plugins: ["./tools/babel-plugin-auto-observe.js"],
			},
		}),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: [
					"**/*.{js,css,html,webp,wasm,woff,woff2}",
				],
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
			},
		}),
	],
});
