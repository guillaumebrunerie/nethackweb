// This file loads the WASM module and exports a function to start NetHack.
// It is the most raw form of the API.

// @ts-expect-error: build/nethack.js is emscripten-generated and untyped
import createModuleRaw from "../build/nethack.js";

type NethackCallback = (name: string, ...args: unknown[]) => Promise<unknown>;
type NethackModule = Partial<EmscriptenModule> & {
	ccall: typeof ccall;
	getValue: typeof getValue;
	setValue: typeof setValue;
	UTF8ToString: typeof UTF8ToString;
	stringToUTF8: typeof stringToUTF8;
	FS: typeof FS;
	IDBFS: typeof IDBFS;
	_malloc: (size: number) => number;
	onRuntimeInitialized: () => void;
};

const createModule = createModuleRaw as (
	moduleOverrides?: Partial<NethackModule>,
) => Promise<NethackModule>;

declare global {
	const malloc: (size: number) => number;
	interface Window {
		nethackCallback: NethackCallback;
		getValue: typeof getValue;
		setValue: typeof setValue;
		malloc: (size: number) => number;
		FS: typeof FS;
		IDBFS: typeof IDBFS;
		UTF8ToString: typeof UTF8ToString;
		stringToUTF8: typeof stringToUTF8;
	}
}

export const runNethackWasm = async (
	cb: NethackCallback,
	Module: Partial<NethackModule> = {},
) => {
	window.nethackCallback = cb;

	Module.onRuntimeInitialized = () => {
		// Swallow ExitStatus rejection: when NetHack exits (death/quit/save-on-hide),
		// emscripten throws ExitStatus through the asyncified call frame, rejecting
		// this promise. Without the catch it surfaces as an unhandled rejection.
		(
			Module.ccall!(
				"shim_graphics_set_callback",
				null,
				["string"],
				["nethackCallback"],
				{ async: true },
			) as unknown as Promise<unknown>
		).catch(() => {});
	};

	const M = await createModule(Module);

	window.getValue = M.getValue;
	window.setValue = M.setValue;
	window.malloc = M._malloc;
	window.FS = M.FS;
	window.IDBFS = M.IDBFS;
	window.UTF8ToString = M.UTF8ToString;
	window.stringToUTF8 = M.stringToUTF8;
};
