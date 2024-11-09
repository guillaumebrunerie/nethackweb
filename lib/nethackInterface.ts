// This file converts the raw NetHack API to a TypeScript API but which still
// stays as close as possible to the original API.

import { parseConditions } from "./conditions";
import { runNethackWasm } from "./wasmBindings";
import { readRaces, readRoles, readGenders, readAligns } from "./player";
import { parseBitMask, readString } from "./common";

type NHEnum<T extends string> = { [key in T]: number } & {
	[key: number]: T;
};

declare global {
	const nethackGlobal: {
		globals: {
			svp: {
				plname: string;
			};
			iflags: {
				window_inited: boolean;
				wc2_hitpointbar: boolean;
				wc_hilite_pet: boolean;
				hilite_pile: boolean;
			};
			flags: {
				initrole: number;
				initrace: number;
				initgend: number;
				initalign: number;
				showexp: boolean;
				time: boolean;
			};
			WIN_MAP: number;
			WIN_MESSAGE: number;
		};
		pointers: {
			extcmdlist: number;
			conditions: number;
			condtests: number;
			roles: number;
			races: number;
			genders: number;
			aligns: number;
		};
		constants: {
			COPYRIGHT: {
				COPYRIGHT_BANNER_A: string;
				COPYRIGHT_BANNER_B: string;
				COPYRIGHT_BANNER_C: string;
				COPYRIGHT_BANNER_D: string;
			};
			ROLE_RACEMASK: string[];
			ROLE_GENDMASK: string[];
			ROLE_ALIGNMASK: string[];
			WIN_TYPE: NHEnum<WinType>;
			ATTR: NHEnum<Attr>;
			HL: NHEnum<Hl>;
			MENU_SELECT: NHEnum<How>;
			COLORS: NHEnum<Color>;
			STATUS_FIELD: NHEnum<StatusField>;
			MG: NHEnum<Mg>;
			BL_MASK: NHEnum<BlMask>;
			COLOR_ATTR: NHEnum<ColorAttr>;
			blconditions: {
				CONDITION_COUNT: number;
			};
		};
	};
}

const decodeCharMaybe = (code: number): string | null =>
	code ? String.fromCharCode(code) : null;

/** Window types */

export type WinType =
	| "NHW_MESSAGE"
	| "NHW_STATUS"
	| "NHW_MAP"
	| "NHW_MENU"
	| "NHW_TEXT";

const decodeWinType = (type: number): WinType =>
	nethackGlobal.constants.WIN_TYPE[type];

/** Attributes */

export type Attr =
	| "ATR_NONE"
	| "ATR_BOLD"
	| "ATR_DIM"
	| "ATR_ITALIC"
	| "ATR_ULINE"
	| "ATR_BLINK"
	| "ATR_INVERSE";

const decodeAttr = (attr: number) => nethackGlobal.constants.ATTR[attr];

type Hl =
	| "HL_UNDEF"
	| "HL_NONE"
	| "HL_BOLD"
	| "HL_DIM"
	| "HL_ITALIC"
	| "HL_ULINE"
	| "HL_BLINK"
	| "HL_INVERSE";

const decodeHlAttr = (attr: number) => nethackGlobal.constants.HL[attr];

/** How */

export type How = "PICK_NONE" | "PICK_ONE" | "PICK_ANY";

const decodeHow = (how: number): How =>
	nethackGlobal.constants.MENU_SELECT[how];

/** Colors */

export type Color =
	| "CLR_BLACK"
	| "CLR_RED"
	| "CLR_GREEN"
	| "CLR_BROWN"
	| "CLR_BLUE"
	| "CLR_MAGENTA"
	| "CLR_CYAN"
	| "CLR_GRAY"
	| "NO_COLOR"
	| "CLR_ORANGE"
	| "CLR_BRIGHT_GREEN"
	| "CLR_YELLOW"
	| "CLR_BRIGHT_BLUE"
	| "CLR_BRIGHT_MAGENTA"
	| "CLR_BRIGHT_CYAN"
	| "CLR_WHITE";

const decodeColor = (color: number): Color =>
	nethackGlobal.constants.COLORS[color];

type ColorAttr =
	| "HL_ATTCLR_BOLD"
	| "HL_ATTCLR_DIM"
	| "HL_ATTCLR_ITALIC"
	| "HL_ATTCLR_ULINE"
	| "HL_ATTCLR_BLINK"
	| "HL_ATTCLR_INVERSE"
	| "BL_ATTCLR_MAX";

/** Status fields */

export type StatusField =
	| "BL_TITLE"
	| "BL_STR"
	| "BL_DX"
	| "BL_CO"
	| "BL_IN"
	| "BL_WI"
	| "BL_CH"
	| "BL_ALIGN"
	| "BL_SCORE"
	| "BL_CAP"
	| "BL_GOLD"
	| "BL_ENE"
	| "BL_ENEMAX"
	| "BL_XP"
	| "BL_AC"
	| "BL_HD"
	| "BL_TIME"
	| "BL_HUNGER"
	| "BL_HP"
	| "BL_HPMAX"
	| "BL_LEVELDESC"
	| "BL_EXP"
	| "BL_CONDITION"
	| "BL_FLUSH"
	| "BL_RESET";

type BlMask =
	| "BL_MASK_BAREH"
	| "BL_MASK_BLIND"
	| "BL_MASK_BUSY"
	| "BL_MASK_CONF"
	| "BL_MASK_DEAF"
	| "BL_MASK_ELF_IRON"
	| "BL_MASK_FLY"
	| "BL_MASK_FOODPOIS"
	| "BL_MASK_GLOWHANDS"
	| "BL_MASK_GRAB"
	| "BL_MASK_HALLU"
	| "BL_MASK_HELD"
	| "BL_MASK_ICY"
	| "BL_MASK_INLAVA"
	| "BL_MASK_LEV"
	| "BL_MASK_PARLYZ"
	| "BL_MASK_RIDE"
	| "BL_MASK_SLEEPING"
	| "BL_MASK_SLIME"
	| "BL_MASK_SLIPPERY"
	| "BL_MASK_STONE"
	| "BL_MASK_STRNGL"
	| "BL_MASK_STUN"
	| "BL_MASK_SUBMERGED"
	| "BL_MASK_TERMILL"
	| "BL_MASK_TETHERED"
	| "BL_MASK_TRAPPED"
	| "BL_MASK_UNCONSC"
	| "BL_MASK_WOUNDEDL"
	| "BL_MASK_HOLDING";

const decodeStatusField = (field: number): StatusField =>
	nethackGlobal.constants.STATUS_FIELD[field];

/** Item flags */

export type Itemflags = unknown;

const decodeItemFlags = (itemflags: number): Itemflags => itemflags;

/** Glyph info */

type Mg =
	| "MG_HERO"
	| "MG_CORPSE"
	| "MG_INVIS"
	| "MG_DETECT"
	| "MG_PET"
	| "MG_RIDDEN"
	| "MG_STATUE"
	| "MG_OBJPILE"
	| "MG_BW_LAVA"
	| "MG_BW_ICE"
	| "MG_BW_SINK"
	| "MG_BW_ENGR"
	| "MG_NOTHING"
	| "MG_UNEXPL"
	| "MG_MALE"
	| "MG_FEMALE";

export type GlyphInfo = {
	glyph: number;
	ttychar: string;
	framecolor: unknown;
	gm: {
		glyphflags: string[];
		sym: {
			color: Color;
			symidx: unknown;
		};
		customcolor: Color;
		color256idx: unknown;
		tileidx: unknown;
		// Not sure how those work
		// u: {
		// 	utf32ch: string;
		// 	utf8str: string;
		// };
	};
};

const readGlyphinfo = (ptr: number): GlyphInfo => {
	return {
		glyph: getValue(ptr, "i32"),
		ttychar: String.fromCharCode(getValue(ptr + 4, "i32")),
		framecolor: getValue(ptr + 8, "i32"),
		gm: {
			glyphflags: parseBitMask(
				getValue(ptr + 12, "i32"),
				nethackGlobal.constants.MG,
			),
			sym: {
				color: decodeColor(getValue(ptr + 16, "i32")),
				symidx: getValue(ptr + 20, "i32"),
			},
			customcolor: decodeColor(getValue(ptr + 24, "i32")),
			color256idx: getValue(ptr + 28, "i16"),
			tileidx: getValue(ptr + 30, "i16"),
			// Not sure how those work
			// u: {
			//     utf32ch: getValue(ptr + 32, "i32"),
			//     utf8str: UTF8ToString(ptr + 36),
			// },
		},
	};
};
/* Menu item */

type MenuItem = {
	item: unknown;
	count: number;
	itemflags?: Itemflags;
};

/**
 * The main interface that you need to implement
 */

export type NetHackInterface = {
	nethackrc: string;

	// A. Low-level routines
	rawPrint: (str: string) => void;
	rawPrintBold: (str: string) => void;
	curs: (windowId: number, x: number, y: number) => void;
	putstr: (windowId: number, attr: Attr, str: string) => void;
	putmixed: (windowId: number, attr: Attr, str: string) => void;
	getNhEvent: () => void;
	nhgetch: () => Promise<string>;
	nhPosKey: () => Promise<string | { x: number; y: number; mod: number }>;

	// B. High-level routines
	printGlyph: (
		windowId: number,
		x: number,
		y: number,
		glyph: GlyphInfo,
		bkglyph: GlyphInfo,
	) => void;
	ynFunction: (
		ques: string,
		choices: string,
		def: string | null,
	) => Promise<string>;
	getlin: (ques: string) => Promise<string>;
	getExtCmd: () => Promise<number>;
	playerSelection: () => Promise<{
		name: string;
		role: string;
		race: string;
		gender: string;
		align: string;
	} | null>;
	displayFile: (fileContents: string, complain: boolean) => Promise<void>;
	updateInventory: (arg: number) => Promise<void>;
	doprevMessage: () => number;
	updatePositionbar: (features: string) => void;

	// C. Window Utility Routines
	initNhwindows: () => void | Promise<void>;
	exitNhwindows: (str: string) => void;
	createNhwindow: (type: WinType) => number;
	clearNhwindow: (windowId: number) => void;
	displayNhwindow: (windowId: number, blocking: boolean) => void;
	destroyNhwindow: (windowId: number) => void;
	startMenu: (windowId: number, behavior: number) => void;
	addMenu: (
		windowId: number,
		glyphInfo: GlyphInfo,
		identifier: unknown,
		accelerator: string | null,
		groupacc: string | null,
		attr: Attr,
		clr: Color,
		str: string,
		itemflags: Itemflags,
	) => void;
	endMenu: (windowId: number, prompt: string) => void;
	selectMenu: (windowId: number, how: How) => Promise<MenuItem[] | null>;
	messageMenu: (let_: string, how: How, mesg: string) => Promise<string>;

	// D. Status Display Routines
	statusInit: () => void;
	statusEnablefield: (
		fldindex: StatusField,
		fldname: string,
		fieldfmt: string,
		enable: boolean,
	) => void;
	statusUpdate: (
		field: StatusField,
		value: string,
		chg: number,
		percentage: number,
		color: Color,
		attribute: string,
	) => void;
	statusUpdateConditions: (
		conditions: Condition[],
		chg: number,
		percentage: number,
	) => void;
	statusFinish: () => void;

	// E. Misc. Routines
	nhbell: () => void;
	markSynch: () => void;
	waitSynch: () => Promise<void>;
	delayOutput: () => Promise<void>;
	askname: () => Promise<string>;
	cliparound: (x: number, y: number) => void;
	numberPad: (state: number) => void;
	suspendNhwindows: (str: string) => void;
	resumeNhwindows: () => void;
	canSuspend: () => void;
	startScreen: () => void;
	endScreen: () => void;
	outrip: (windowId: number, int: number, time: unknown) => void;
	preferenceUpdate: (pref: unknown) => void;
	getmsghistory: (init: boolean) => string;
	putmsghistory: (msg: string, restoring: boolean) => void;
};

export const getRoleData = () => readRoles(nethackGlobal.pointers.roles);
export const getRaceData = () => readRaces(nethackGlobal.pointers.races);
export const getGenderData = () => readGenders(nethackGlobal.pointers.genders);
export const getAlignData = () => readAligns(nethackGlobal.pointers.aligns);

export type Condition = {
	condition: string;
	color: Color;
	attrs: ColorAttr[];
	ranking: number;
	text: [string, string, string];
};

/**
 * Convert the arguments from high-level to low-level
 */

const convertMethods = (i: NetHackInterface, syncFs: () => Promise<void>) => ({
	// A. Low-level routines
	rawPrint: (str: string) => i.rawPrint(str),
	rawPrintBold: (str: string) => i.rawPrintBold(str),
	curs: (windowId: number, x: number, y: number) => i.curs(windowId, x, y),
	putstr: (windowId: number, attr: number, str: string) =>
		i.putstr(windowId, decodeAttr(attr), str),
	putmixed: (windowId: number, attr: number, str: string) =>
		i.putmixed(windowId, decodeAttr(attr), str),
	getNhEvent: () => i.getNhEvent(),
	nhgetch: async (): Promise<number> => (await i.nhgetch()).charCodeAt(0),
	nhPoskey: async (
		xPtr: number,
		yPtr: number,
		modPtr: number,
	): Promise<number> => {
		await syncFs();
		const result = await i.nhPosKey();
		if (typeof result == "string") {
			return result.charCodeAt(0);
		} else {
			setValue(xPtr, result.x, "i16");
			setValue(yPtr, result.y, "i16");
			setValue(modPtr, result.mod, "i32");
			return 0;
		}
	},

	// B. High-level routines
	printGlyph: (
		windowId: number,
		x: number,
		y: number,
		glyphinfo: number,
		bkglyphinfo: number,
	) =>
		i.printGlyph(
			windowId,
			x,
			y,
			readGlyphinfo(glyphinfo),
			readGlyphinfo(bkglyphinfo),
		),
	ynFunction: async (ques: string, choices: string, def: number) =>
		(await i.ynFunction(ques, choices, decodeCharMaybe(def))).charCodeAt(0),
	getlin: async (ques: string, output: number) => {
		const result = await i.getlin(ques);
		stringToUTF8(result, output, 1024);
	},
	getExtCmd: async () => await i.getExtCmd(),
	playerSelectionOrTty: async () => {
		const { svp, flags } = nethackGlobal.globals;
		const result = await i.playerSelection();
		if (!result) {
			return true;
		} else {
			const { name, role, race, gender, align } = result;
			svp.plname = name;
			flags.initrole = getRoleData().findIndex((r) => r.name == role);
			flags.initrace = getRaceData().findIndex((r) => r.name == race);
			flags.initgend = getGenderData().findIndex((r) => r.name == gender);
			flags.initalign = getAlignData().findIndex((r) => r.name == align);
			return false;
		}
	},
	displayFile: async (filename: string, complain: number) => {
		if (filename == "license") {
			await i.displayFile(
				FS.readFile("/license", { encoding: "utf8" }),
				!!complain,
			);
			return;
		}
		const file = FS.readFile("/nhdat", { encoding: "utf8" });
		const fileSplit = file.split("\n");
		const ix = fileSplit.findIndex((l) => l.startsWith("n" + filename));
		const from = Number(fileSplit[ix].split(" ").at(-1));
		const to = Number(fileSplit[ix + 1].split(" ").at(-1));
		const fileContents = file.slice(from, to);
		await i.displayFile(fileContents, !!complain);
	},
	updateInventory: async (arg: number) => await i.updateInventory(arg),
	doprevMessage: (): number => i.doprevMessage(),
	updatePositionbar: (features: string) => i.updatePositionbar(features),

	// C. Window Utility Routines
	initNhwindows: (/* argc, argv */) => i.initNhwindows(),
	exitNhwindows: async (str: string) => {
		await syncFs();
		i.exitNhwindows(str);
	},
	createNhwindow: (type: number): number =>
		i.createNhwindow(decodeWinType(type)),
	clearNhwindow: (windowId: number) => i.clearNhwindow(windowId),
	displayNhwindow: (windowId: number, blocking: number) =>
		i.displayNhwindow(windowId, !!blocking),
	destroyNhwindow: (windowId: number) => i.destroyNhwindow(windowId),
	startMenu: (windowId: number, behavior: number) => {
		i.startMenu(windowId, behavior);
	},
	addMenu: (
		windowId: number,
		glyphinfo: number,
		identifier: unknown,
		accelerator: number,
		groupacc: number,
		attr: number,
		clr: number,
		str: string,
		itemflags: number,
	) =>
		i.addMenu(
			windowId,
			readGlyphinfo(glyphinfo),
			identifier,
			decodeCharMaybe(accelerator),
			decodeCharMaybe(groupacc),
			decodeAttr(attr),
			decodeColor(clr),
			str,
			decodeItemFlags(itemflags),
		),
	endMenu: (windowId: number, prompt: string) => i.endMenu(windowId, prompt),
	selectMenu: async (
		windowId: number,
		how: number,
		menuList: number,
	): Promise<number> => {
		const menuItems = await i.selectMenu(windowId, decodeHow(how));
		if (!menuItems) {
			return 0;
		}
		const size = 12;
		const p = malloc(size * menuItems.length);
		setValue(menuList, p, "*");
		menuItems.forEach((menuItem, i) => {
			const { item, count, itemflags } = menuItem;
			setValue(
				p + i * size,
				typeof item == "string" ? item.charCodeAt(0) : item,
				"*",
			);
			setValue(p + i * size + 4, count, "i32");
			setValue(p + i * size + 8, itemflags || 0, "i32");
		});
		return menuItems.length;
	},
	messageMenu: async (
		let_: string,
		how: number,
		mesg: string,
	): Promise<string> => await i.messageMenu(let_, decodeHow(how), mesg),

	// D. Status Display Routines
	statusInit: () => i.statusInit(),
	statusEnablefield: (
		fldindex: number,
		fldname: string,
		fieldfmt: string,
		enable: number,
	) =>
		i.statusEnablefield(
			decodeStatusField(fldindex),
			fldname,
			fieldfmt,
			!!enable,
		),
	statusUpdate: (
		field: number,
		value: number,
		chg: number,
		percentage: number,
		color: number,
		colormasks: number,
	) => {
		const decodedField = decodeStatusField(field);
		if (decodedField == "BL_CONDITION") {
			const parsedConditions = parseConditions(
				nethackGlobal.pointers.conditions,
			);
			const conditions: Condition[] = parseBitMask(
				getValue(value, "i32"),
				nethackGlobal.constants.BL_MASK,
			).map((c) => {
				const cM = nethackGlobal.constants.BL_MASK[c];
				let color: Color = "NO_COLOR";
				for (let i = 0; i < 16; i++) {
					const n = getValue(colormasks + i * 4, "i32");
					if (n & cM) {
						color = nethackGlobal.constants.COLORS[i];
						break;
					}
				}
				const attrs: ColorAttr[] = [];
				for (let i = 18; i < 24; i++) {
					const n = getValue(colormasks + i * 4, "i32");
					if (n & cM) {
						attrs.push(nethackGlobal.constants.COLOR_ATTR[i]);
					}
				}
				const data = parsedConditions.find((p) => p.mask == c);
				if (!data) {
					throw new Error(`Unknown condition ${c}`);
				}
				return { condition: c, color, attrs, ...data };
			});
			i.statusUpdateConditions(conditions, chg, percentage);
		} else {
			i.statusUpdate(
				decodedField,
				UTF8ToString(value),
				chg,
				percentage,
				decodeColor(color & 0xff),
				decodeHlAttr(color >> 8),
			);
		}
	},
	statusFinish: () => i.statusFinish(),

	// E. Misc. Routines
	nhbell: () => i.nhbell(),
	markSynch: () => i.markSynch(),
	waitSynch: async () => await i.waitSynch(),
	delayOutput: async () => await i.delayOutput(),
	askname: async () => await i.askname(),
	cliparound: (x: number, y: number) => i.cliparound(x, y),
	numberPad: (state: number) => i.numberPad(state),
	suspendNhwindows: (str: string) => i.suspendNhwindows(str),
	resumeNhwindows: () => i.resumeNhwindows(),
	canSuspend: () => i.canSuspend(),
	startScreen: () => i.startScreen(),
	endScreen: () => i.endScreen(),
	outrip: (windowId: number, int: number, time: unknown) =>
		i.outrip(windowId, int, time),
	preferenceUpdate: (pref: unknown) => i.preferenceUpdate(pref),
	getmsghistory: (init: number): string => i.getmsghistory(!!init),
	putmsghistory: (msg: string, restoring: number) =>
		i.putmsghistory(msg, !!restoring),
});

type ExtCmd = {
	key: string;
	name: string;
	description: string;
	flags: {
		autocomplete: boolean;
	};
};

const parseExtcmdlist = (extcmdlist: number) => {
	const extCmdList: ExtCmd[] = [];
	for (let i = 0; i < 100; i++) {
		const key = String.fromCharCode(getValue(extcmdlist, "i8"));
		const name = readString(extcmdlist + 4);
		if (!name) {
			break;
		}
		const description = readString(extcmdlist + 8) || "unknown description";
		const flagsI = getValue(extcmdlist + 16, "i32");
		const flags = {
			autocomplete: !!(flagsI & 2),
		};
		extCmdList.push({ key, name, description, flags });
		extcmdlist += 24;
	}
	return extCmdList;
};

export const getExtCmdsWithPrefix = (prefix: string) => {
	const extcmdlist = nethackGlobal.pointers.extcmdlist;
	const extCmdList = parseExtcmdlist(extcmdlist);
	return extCmdList.filter((extCmd) => extCmd.name.startsWith(prefix));
};

export const getUniqueExtCmdAutocomplete = (prefix: string) => {
	const extcmdlist = nethackGlobal.pointers.extcmdlist;
	const extCmdList = parseExtcmdlist(extcmdlist);
	const cmds = extCmdList.filter(
		(extCmd) => extCmd.name.startsWith(prefix) && extCmd.flags.autocomplete,
	);
	if (cmds.length == 1) {
		return cmds[0];
	}

	const cmds2 = extCmdList.filter((extCmd) => extCmd.name == prefix);
	if (cmds2.length == 1) {
		return cmds2[0];
	}

	return null;
};

export const getExtCmdIndex = (extcmd: string) => {
	const command = getUniqueExtCmdAutocomplete(extcmd.toLowerCase());
	if (!command) {
		return -1;
	}
	return parseExtcmdlist(nethackGlobal.pointers.extcmdlist).findIndex(
		(extCmd) => extCmd.name === command.name,
	);
};

/**
 * Calls the nethackStart function with the given interface
 */

const isPromise = (obj: unknown): obj is Promise<unknown> =>
	!!(typeof obj == "object" && obj && "then" in obj);

export const startNethack = (
	interface_: NetHackInterface,
	{
		commandLineArguments = [] as string[],
		LOG_PROCESSED_CALLS = false,
		LOG_RAW_CALLS = false,
	} = {},
) => {
	const Module = {
		arguments: commandLineArguments,
		preRun: [
			() => {
				// Set up config file
				if (interface_.nethackrc) {
					Module.FS.writeFile("/.nethackrc", interface_.nethackrc);
					Module.ENV.NETHACKOPTIONS = "@/.nethackrc";
				}

				// Set up save directory
				Module.FS.mkdir("/save");
				Module.FS.mount(Module.IDBFS, {}, "/save");

				// Sync filesystem from local storage
				Module.addRunDependency("syncfs");
				Module.FS.syncfs(true, (err) => {
					if (err) {
						throw err;
					}
					Module.removeRunDependency("syncfs");
				});
			},
		],
	} as Partial<EmscriptenModule> & {
		FS: typeof FS;
		IDBFS: typeof IDBFS;
		ENV: { NETHACKOPTIONS: string };
		addRunDependency: typeof addRunDependency;
		removeRunDependency: typeof removeRunDependency;
	};
	const syncToLocalStorage = () =>
		new Promise<void>((resolve, reject) => {
			FS.syncfs(false, (err) => {
				if (err) {
					reject(err);
				}
				resolve();
			});
		});

	// Wrap the interface in a Proxy to log calls to all methods
	if (LOG_PROCESSED_CALLS) {
		interface_ = new Proxy(interface_, {
			get(target, prop, receiver) {
				const value = Reflect.get(target, prop, receiver);
				if (typeof value === "function") {
					return (...args: unknown[]) => {
						console.log(
							`> ${String(prop)}(${args
								.map((a) => JSON.stringify(a))
								.join(", ")})`,
						);
						const result = Reflect.apply(value, target, args);
						const logResult = (result: unknown) => {
							if (isPromise(result)) {
								result.then((returnValue) => {
									logResult(returnValue);
								});
							} else if (result !== undefined) {
								console.log(">>>", result);
							}
						};
						logResult(result);
						return result;
					};
				}
				return value;
			},
		});
	}

	runNethackWasm(async (name: string, ...args: unknown[]) => {
		if (typeof getValue !== "undefined") {
			parseExtcmdlist(nethackGlobal.pointers.extcmdlist);
		}
		const newName = name
			.slice(5) // remove "shim_"
			.split("_") // convert to camelCase
			.map((s, i) => (i === 0 ? s : s[0].toUpperCase() + s.slice(1)))
			.join("");
		if (LOG_RAW_CALLS) {
			console.debug(
				`# ${newName}(${args.map((a) => JSON.stringify(a)).join(", ")})`,
			);
		}
		//@ts-expect-error Typescript magic
		const method = convertMethods(interface_, syncToLocalStorage)[newName];
		if (method) {
			return method(...args);
		} else {
			throw new Error(
				`Unknown method ${newName}(${args.map((a) => JSON.stringify(a)).join(", ")})`,
			);
		}
	}, Module);
};

export const flags = () => nethackGlobal.globals.flags;
export const iflags = () => nethackGlobal.globals.iflags;

export const copyrightMessage = () => {
	if (typeof nethackGlobal == "undefined") {
		return [];
	}
	return [
		nethackGlobal.constants.COPYRIGHT.COPYRIGHT_BANNER_A,
		nethackGlobal.constants.COPYRIGHT.COPYRIGHT_BANNER_B,
		nethackGlobal.constants.COPYRIGHT.COPYRIGHT_BANNER_C,
		nethackGlobal.constants.COPYRIGHT.COPYRIGHT_BANNER_D,
	];
};
