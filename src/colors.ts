import { Color } from "../lib/nethackInterface";

export const decodeColor = (color: Color) => {
	return colorTable[color];
};

const colorTable = {
	CLR_BLACK: "#555", // Very dark gray-black
	CLR_GRAY: "#ffffff", // Pure white

	CLR_RED: "#ff4c4c", // Bright red
	CLR_ORANGE: "#f39c12", // Bright orange

	CLR_GREEN: "#26a269",
	CLR_BRIGHT_GREEN: "#33da7a",

	CLR_BROWN: "#8b5a2b", // Warm brown
	CLR_YELLOW: "#f1c40f", // Bold yellow

	CLR_BLUE: "#357edd", // Medium royal blue
	CLR_BRIGHT_BLUE: "#5dade2", // Lighter blue

	CLR_MAGENTA: "#a347ba", // Bold magenta
	CLR_BRIGHT_MAGENTA: "#c061cb", // Bright pinkish magenta

	CLR_CYAN: "#17a2b8", // Teal cyan
	CLR_BRIGHT_CYAN: "#00d2d3", // Bright cyan

	NO_COLOR: "var(--fg)",
	CLR_WHITE: "#d0cfcc",
};
