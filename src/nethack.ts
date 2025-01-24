import { produce } from "immer";
import {
	Attr,
	NetHackInterface,
	startNethack,
	iflags,
	How,
	StatusField,
	WinType,
	GlyphInfo,
	Itemflags,
	Color,
	getExtCmdIndex,
	Condition,
} from "../lib/nethackInterface";

import nethackrcContents from "./nethackrc.txt?raw";

export type NHMenuEntry = {
	glyphInfo: GlyphInfo;
	identifier: unknown;
	accelerator: string | null;
	customAccelerator: string | null;
	groupacc: string | null;
	attr: Attr;
	clr: Color;
	str: string;
	itemflags: Itemflags;

	selectedCount: number;
};

export const ESC = "\x1b";
const ENTER = "\n";
const BACKSPACE = "\x08";

export class NHMenuWindow {
	constructor(public id: number) {}
	type = "NHW_MENU" as const;
	displayed = false;
	blocking = false;
	text: { str: string; attr: Attr }[] = [];
	menuEntries: NHMenuEntry[] = [];
	prompt = "";
	customAcceleratorIndex = 0;
	customAccelerators = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	startMenu() {
		this.menuEntries = [];
		this.customAcceleratorIndex = 0;
	}
	endMenu(prompt: string) {
		this.prompt = prompt;
	}
	addMenu(
		glyphInfo: GlyphInfo,
		identifier: unknown,
		accelerator: string | null,
		groupacc: string | null,
		attr: Attr,
		clr: Color,
		str: string,
		itemflags: Itemflags,
	) {
		let customAccelerator: string | null = null;
		if (identifier !== 0 && !accelerator) {
			customAccelerator =
				this.customAccelerators[this.customAcceleratorIndex];
			this.customAcceleratorIndex++;
		}
		this.menuEntries.push({
			glyphInfo,
			identifier,
			accelerator,
			customAccelerator,
			groupacc,
			attr,
			clr,
			str,
			itemflags,

			selectedCount: 0,
		});
	}

	async getCharWithCount(getChar: () => Promise<string>) {
		let count = -1;
		while (true) {
			const char = await getChar();
			if (char >= "0" && char <= "9") {
				count = Math.max(0, count);
				count = count * 10 + parseInt(char);
			} else {
				return { char, count };
			}
		}
	}

	async selectMenu(how: How, getChar: () => Promise<string>) {
		switch (how) {
			case "PICK_NONE": {
				await getChar();
				this.displayed = false;
				return [];
			}
			case "PICK_ONE": {
				const { char, count } = await this.getCharWithCount(getChar);
				if (char == ESC || char == " ") {
					this.displayed = false;
					return [];
				}
				const item = this.menuEntries.find(
					(entry) =>
						entry.accelerator == char ||
						entry.groupacc == char ||
						entry.customAccelerator == char,
				)?.identifier;
				this.displayed = false;
				return item === undefined ? [] : [{ item, count }];
			}
			case "PICK_ANY": {
				let exited = false;
				while (!exited) {
					const { char, count } =
						await this.getCharWithCount(getChar);
					if (char == ESC || char == " ") {
						exited = true;
					} else if (char == ",") {
						for (const entry of this.menuEntries) {
							if (entry.identifier) {
								entry.selectedCount = -1;
							}
						}
					} else if (char == "-") {
						for (const entry of this.menuEntries) {
							if (entry.identifier) {
								entry.selectedCount = 0;
							}
						}
					} else {
						const entries = this.menuEntries.filter(
							(entry) =>
								entry.accelerator == char ||
								entry.groupacc == char ||
								entry.customAccelerator == char,
						);
						for (const entry of entries) {
							if (entry.selectedCount == 0) {
								entry.selectedCount = count;
							} else if (count == -1) {
								entry.selectedCount = 0;
							}
						}
					}
				}
				this.displayed = false;
				return this.menuEntries
					.filter((entry) => entry.selectedCount != 0)
					.map((entry) => ({
						item: entry.identifier,
						count: entry.selectedCount,
					}));
			}
		}
	}
	clear() {
		this.text = [];
		this.menuEntries = [];
	}
	putStr(str: string, attr: Attr) {
		this.text.push({ str, attr });
	}
	async display(getChar: () => Promise<string>) {
		this.displayed = true;
		this.blocking = true;
		await getChar();
		this.blocking = false;
	}
}

const historyLines = 50;
export class NHMessageWindow {
	constructor(public id: number) {}
	type = "NHW_MESSAGE" as const;
	displayed = false;
	blocking = false;
	oldText: { str: string; attr: Attr }[] = [];
	text: { str: string; attr: Attr }[] = [];
	clear() {
		this.oldText.push(...this.text);
		if (this.oldText.length > historyLines) {
			this.oldText = this.oldText.slice(-historyLines);
		}
		this.text = [];
	}
	async display() {
		this.displayed = true;
	}
	putStr(str: string, attr: Attr) {
		if (this.text.length == 0 && this.oldText.at(-1)?.str == str) {
			this.oldText.pop();
		}
		this.text.push({ str, attr });
	}
	popOldestMessage() {
		// this.clear();
		if (this.oldText.length == 0) {
			return null;
		}
		return this.oldText.shift()?.str;
	}
	restoreMessage(msg: string) {
		this.oldText.push({ str: msg, attr: "ATR_NONE" });
	}
}

export class NHTextWindow {
	constructor(public id: number) {}
	type = "NHW_TEXT" as const;
	displayed = false;
	blocking = false;
	text: { str: string; attr: Attr }[] = [];
	clear() {
		this.text = [];
	}
	async display(getChar: () => Promise<string>) {
		this.displayed = true;
		this.blocking = true;
		await getChar();
		this.blocking = false;
	}
	putStr(str: string, attr: Attr) {
		this.text.push({ str, attr });
	}
}

export type Glyph =
	| {
			isChar: true;
			char: string;
			attr: Attr;
	  }
	| {
			isChar: false;
			glyphinfo: GlyphInfo;
			bkglyphinfo: GlyphInfo;
	  };

export class NHMapWindow {
	constructor(public id: number) {}
	type = "NHW_MAP" as const;
	displayed = false;
	blocking = false;
	cursor = { x: 0, y: 0 };
	center = { x: 0, y: 0 };
	map: Glyph[][] = Array(24)
		.fill(null)
		.map(() => Array(80).fill({ isChar: true, char: "" }));
	clear() {
		this.map = Array(24)
			.fill(null)
			.map(() => Array(80).fill({ isChar: true, char: "" }));
		this.displayed = false;
	}
	printGlyph(
		x: number,
		y: number,
		glyphinfo: GlyphInfo,
		bkglyphinfo: GlyphInfo,
	) {
		this.displayed = true;
		this.map = produce(this.map, (draft) => {
			draft[y][x] = { isChar: false, glyphinfo, bkglyphinfo };
		});
	}
	curs(x: number, y: number) {
		this.cursor = produce(this.cursor, (draft) => {
			draft.x = x;
			draft.y = y;
		});
	}
	putStr(str: string, attr: Attr) {
		for (const char of str) {
			const { x, y } = this.cursor;
			if (char == "\n") {
				this.cursor = { x: 0, y: y + 1 };
			} else {
				this.map[y][x] = { isChar: true, char, attr };
				this.cursor = { x: x + 1, y };
			}
		}
	}
	async display(getChar: () => Promise<string>, blocking: boolean) {
		// this.displayed = true;
		if (blocking) {
			this.blocking = true;
			await getChar();
			this.blocking = false;
		}
	}
}

export type NHWindow =
	| NHMessageWindow
	| NHMapWindow
	| NHMenuWindow
	| NHTextWindow;

const newWindow = (type: WinType, id: number): NHWindow => {
	switch (type) {
		case "NHW_MESSAGE":
			return new NHMessageWindow(id);
		case "NHW_MAP":
			return new NHMapWindow(id);
		case "NHW_MENU":
			return new NHMenuWindow(id);
		case "NHW_TEXT":
			return new NHTextWindow(id);
	}
	throw new Error("Unknown window type");
};

export class Status {
	displayed = false;
	values: {
		[K in StatusField]?: { value: string; color: Color; attr: string };
	} = {};
	conditions: Condition[] = [];
	update(field: StatusField, value: string, color: Color, attr: string) {
		if (field == "BL_FLUSH" || field == "BL_RESET") {
			this.displayed = true;
		} else {
			this.values[field] = { value, color, attr };
		}
	}
	updateConditions(value: Condition[]) {
		this.conditions = value;
	}
}

export type Input =
	| string
	| { submit: true }
	| { x: number; y: number; mod: number };

type NHPosKeyPrompt = {
	type: "poskey";
};

export type YNPrompt = {
	type: "yn";
	question: string;
	choices: string;
	def: string | null;
};

export type ExtCmdPrompt = {
	type: "extcmd";
	cmd: string;
};

export type GetlinPrompt = {
	type: "getlin";
	prompt: string;
	answer: string;
};

export type Prompt = NHPosKeyPrompt | YNPrompt | ExtCmdPrompt | GetlinPrompt;

function getNethackRc() {
	if (typeof localStorage !== 'undefined'){
		if (!localStorage["NetHack_Options"]) {
			localStorage["NetHack_Options"] = nethackrcContents;
		}
		return localStorage["NetHack_Options"];
	}else{
		return nethackrcContents;
	}
}

export class NetHack implements NetHackInterface {
	start(playerName: string) {
		startNethack(this, {
			LOG_PROCESSED_CALLS: true,
			commandLineArguments: ["-u", playerName],
		});
	}
	constructor(public onChange: () => void) {
		this.start("Fractal");
	}
	isLoading = true;
	nethackrc = getNethackRc();
	currentWindowId = 0;
	center = { x: 0, y: 0 };
	messageWindow?: NHMessageWindow;
	mapWindow?: NHMapWindow;
	windows: { [windowId: number]: NHWindow } = {};
	status = new Status();
	prompt: Prompt | null = null;

	// Input

	resolveInput: (input: Input) => void = () => {};

	onInput(input: Input) {
		this.resolveInput(input);
	}

	async getInput(): Promise<Input> {
		this.onChange();
		return new Promise<Input>((resolve_) => {
			this.resolveInput = (input: Input) => {
				window.removeEventListener("keydown", callback);
				resolve_(input);
				this.resolveInput = () => {};
			};
			const callback = (e: KeyboardEvent) => {
				const resolve = (input: Input) => {
					e.preventDefault();
					window.removeEventListener("keydown", callback);
					resolve_(input);
					this.resolveInput = () => {};
				};
				if (e.key.length == 1) {
					if (e.ctrlKey) {
						resolve(
							String.fromCharCode(
								e.key.toUpperCase().charCodeAt(0) -
									"A".charCodeAt(0) +
									1,
							),
						);
					} else if (e.altKey) {
						resolve(String.fromCharCode(e.key.charCodeAt(0) + 128));
					} else {
						resolve(e.key);
					}
				}
				if (e.key == "Escape") {
					resolve(ESC);
				}
				if (e.key == "Enter") {
					resolve(ENTER);
				}
				if (e.key == "Backspace") {
					resolve(BACKSPACE);
				}
			};
			window.addEventListener("keydown", callback);
		});
	}

	async getChar(): Promise<string> {
		const r = await this.getInput();
		if (typeof r == "string") {
			return r;
		} else {
			return await this.getChar();
		}
	}

	async getStr() {
		const r = await this.getInput();
		if (typeof r == "string" || "submit" in r) {
			return r;
		} else {
			return await this.getChar();
		}
	}

	async getCharOrPos(): Promise<
		string | { x: number; y: number; mod: number }
	> {
		const r = await this.getInput();
		if (typeof r == "object" && "submit" in r) {
			return await this.getCharOrPos();
		} else {
			return r;
		}
	}

	// A. Low-level routines
	rawPrint(str: string) {
		console.log("RAW_PRINT:", str);
	}
	rawPrintBold(str: string) {
		console.log("RAW_PRINT_BOLD:", str);
	}
	curs(windowId: number, x: number, y: number) {
		const win = this.windows[windowId] as NHMapWindow;
		win.curs(x, y);
	}
	putstr(windowId: number, attr: Attr, str: string) {
		const win = this.windows[windowId];
		win.putStr(str, attr);
	}
	putmixed() {
		console.error("Not implemented (putmixed)");
	}
	getNhEvent() {}
	async nhgetch() {
		console.error("Not implemented (nhgetch)");
		return "";
	}
	async nhPosKey() {
		this.prompt = { type: "poskey" };
		const result = await this.getCharOrPos();
		this.prompt = null;
		return result;
	}

	// B. High-level routines
	printGlyph(
		windowId: number,
		x: number,
		y: number,
		glyphinfo: GlyphInfo,
		bkglyphinfo: GlyphInfo,
	) {
		const win = this.windows[windowId] as NHMapWindow;
		win.printGlyph(x, y, glyphinfo, bkglyphinfo);
	}
	async ynFunction(ques: string, choices: string, def: string | null) {
		while (true) {
			this.prompt = { type: "yn", question: ques, choices, def };
			const result = await this.getChar();
			this.prompt = null;
			switch (result) {
				case ESC:
					if (choices.includes("q")) return "q";
					if (choices.includes("n")) return "n";
					return def || ESC;
				case " ":
				case ENTER:
					return def || result;
			}
			if (!choices || choices.includes(result)) return result;
		}
	}
	async getlin(prompt: string) {
		this.prompt = { type: "getlin", prompt, answer: "" };
		while (true) {
			const str = await this.getStr();
			if (typeof str == "object" && "submit" in str) {
				const result = this.prompt.answer;
				this.prompt = null;
				return result;
			} else if (str == ESC) {
				this.prompt = null;
				return ESC;
			} else {
				this.prompt.answer = str;
			}
		}
	}
	async getExtCmd() {
		this.prompt = { type: "extcmd", cmd: "" };
		while (true) {
			const str = await this.getStr();
			if (typeof str == "object" && "submit" in str) {
				const i = getExtCmdIndex(this.prompt.cmd);
				this.prompt = null;
				return i;
			} else if (str == ESC) {
				this.prompt = null;
				return -1;
			} else {
				this.prompt.cmd = str;
			}
		}
	}
	async playerSelection() {
		return null;
		// return {
		// 	name: "John Doe",
		// 	role: "Ranger",
		// 	race: "gnome",
		// 	gender: "male",
		// 	align: "neutral",
		// };
	}
	async displayFile(fileContents: string) {
		const windowId = this.createNhwindow("NHW_TEXT");
		const win = this.windows[windowId] as NHTextWindow;
		for (const line of fileContents.split("\n")) {
			win.putStr(line, "ATR_NONE");
		}
		console.log("DISPLAY");
		await win.display(() => this.getChar());
		console.log("DONE");
		this.destroyNhwindow(windowId);
	}
	async updateInventory() {
		console.error("Not implemented (updateInventory)");
	}
	doprevMessage() {
		return 0;
	}
	updatePositionbar() {
		console.error("Not implemented (updatePositionbar)");
	}

	// C. Window Utility Routines
	initNhwindows() {
		iflags().window_inited = true;
		this.isLoading = false;
	}
	exitNhwindows(str: string) {
		this.messageWindow?.clear();
		this.messageWindow?.putStr(str, "ATR_NONE");
		this.mapWindow?.clear();
		this.status.displayed = false;
		this.onChange();
	}
	createNhwindow(type: WinType) {
		const windowId = this.currentWindowId++;
		this.windows[windowId] = newWindow(type, windowId);
		return windowId;
	}
	clearNhwindow(windowId: number) {
		const win = this.windows[windowId];
		win.clear();
	}
	async displayNhwindow(windowId: number, blocking: boolean) {
		const win = this.windows[windowId];
		if (windowId == nethackGlobal.globals.WIN_MAP) {
			this.mapWindow = win as NHMapWindow;
		}
		if (windowId == nethackGlobal.globals.WIN_MESSAGE) {
			this.messageWindow = win as NHMessageWindow;
		}
		await win.display(() => this.getChar(), blocking);
	}
	destroyNhwindow(windowId: number) {
		delete this.windows[windowId];
	}
	startMenu(windowId: number) {
		const win = this.windows[windowId] as NHMenuWindow;
		win.startMenu();
	}
	addMenu(
		windowId: number,
		glyphInfo: GlyphInfo,
		identifier: unknown,
		accelerator: string | null,
		groupAcc: string | null,
		attr: Attr,
		clr: Color,
		str: string,
		itemFlags: Itemflags,
	) {
		const win = this.windows[windowId] as NHMenuWindow;
		win.addMenu(
			glyphInfo,
			identifier,
			accelerator,
			groupAcc,
			attr,
			clr,
			str,
			itemFlags,
		);
	}
	endMenu(windowId: number, prompt: string) {
		const win = this.windows[windowId] as NHMenuWindow;
		win.endMenu(prompt);
	}
	async selectMenu(windowId: number, how: How) {
		const win = this.windows[windowId] as NHMenuWindow;
		win.displayed = true;
		return await win.selectMenu(how, this.getChar.bind(this));
	}
	async messageMenu() {
		console.error("Not implemented (messageMenu)");
		return "y";
	}

	// D. Status Display Routines
	statusInit() {}
	statusEnablefield() {
		// _enabled: boolean, // _fmt: string, // _name: string, // _field: StatusField,
		console.error("Not implemented (statusEnablefield)");
	}
	statusUpdate(
		field: StatusField,
		value: string,
		_chg: number,
		_percentage: number,
		color: Color,
		attr: string,
	) {
		this.status.update(field, value, color, attr);
	}
	statusUpdateConditions(value: Condition[]) {
		this.status.updateConditions(value);
	}
	statusFinish() {}

	// E. Misc. Routines
	nhbell() {}
	markSynch() {}
	async waitSynch() {}
	async delayOutput() {
		await new Promise((resolve) => setTimeout(resolve, 50));
		return;
	}
	async askname() {
		console.error("Not implemented (askname)");
		return "wizard";
	}
	cliparound(x: number, y: number) {
		if (this.mapWindow) {
			this.mapWindow.center = { x, y };
		}
	}
	numberPad() {
		console.error("Not implemented (numberPad)");
	}
	suspendNhwindows() {
		console.error("Not implemented (suspendNhwindows)");
	}
	resumeNhwindows() {
		console.error("Not implemented (resumeNhwindows)");
	}
	canSuspend() {}
	startScreen() {}
	endScreen() {}
	outrip() {}
	preferenceUpdate() {}

	// Unclear how those work. It just hangs the game if I do that.
	getmsghistory(/* init: boolean */) {
		// return this.messageWindow?.popOldestMessage() || "";
		return "";
	}
	putmsghistory(/* msg: string */) {
		// return this.messageWindow?.restoreMessage(msg);
	}
}

let nethack: NetHack;
export const startNetHack = (onChange: (nethack: NetHack) => void) => {
	if (nethack) {
		nethack.onChange = () => onChange(nethack);
	} else {
		nethack = new NetHack(() => onChange(nethack));
	}
	return nethack;
};
