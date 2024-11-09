// This file loads the WASM module and exports a function to start NetHack.
// It is the most raw form of the API.

// @ts-nocheck
import createModule from "../build/nethack.js";

// starts nethack
export const runNethackWasm = async (cb, Module = {}) => {
	globalThis.nethackCallback = cb;

	Module.onRuntimeInitialized = () => {
		Module.ccall(
			"shim_graphics_set_callback",
			null,
			["string"],
			["nethackCallback"],
			{ async: true },
		);
	};

	await createModule(Module);

	window.getValue = Module.getValue;
	window.setValue = Module.setValue;
	window.malloc = Module._malloc;
	window.FS = Module.FS;
	window.IDBFS = Module.IDBFS;
	window.UTF8ToString = Module.UTF8ToString;
	window.stringToUTF8 = Module.stringToUTF8;
};

declare global {
	const malloc: (size: number) => number;
}
