import nethackrcContents from "./nethackrc.txt?raw";

export type CustomButton = {
	id: string;
	extcmd: string;
	label: string;
};

export type Settings = {
	version: 1;
	playerName: string;
	nethackrc: string;
	compactStatus: boolean;
	saveOnHide: boolean;
	gridButtons: string[];
	scrollButtons: string[];
	customButtons: CustomButton[];
	modifierMode: "off" | "on";
};

export const newCustomButtonId = (): string => {
	const rand =
		typeof crypto !== "undefined" && "randomUUID" in crypto ?
			crypto.randomUUID().slice(0, 8)
		:	Math.random().toString(36).slice(2, 10);
	return `custom-${rand}`;
};

const STORAGE_KEY = "nethackweb";

// Avoid names in NetHack 5.0's sysconf `genericusers` list (default: play,
// player, game, games, nethack, nethacker, ec2-user). NetHack zeroes those
// out and forces askname, which loops without a working prompt.
const defaults = (): Settings => ({
	version: 1,
	playerName: "Adventurer",
	nethackrc: nethackrcContents,
	compactStatus: window.matchMedia("(max-width: 600px)").matches,
	saveOnHide: true,
	gridButtons: [
		"look", "cast", "fire",
		"run", "drop-type", "inven",
		"rush", "drop", "kick",
		"travel", "loot",
	],
	scrollButtons: [
		"extcmd", "save", "close", "eat", "apply", "zap", "quaff", "read",
		"throw", "move", "fight", "wield", "wear", "swap", "two-weapon",
		"quiver", "put-on", "takeoff", "remove", "open", "inven-type",
		"help", "see-all", "discoveries", "options", "attributes", "esc",
	],
	customButtons: [],
	modifierMode:
		window.matchMedia("(pointer: coarse)").matches ? "on" : "off",
});

export const loadSettings = (): Settings => {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return defaults();
	try {
		const stored = JSON.parse(raw) as Partial<Settings> & {
			shiftMode?: string;
			modifierMode?: string;
		};
		const merged = { ...defaults(), ...stored, version: 1 } as Settings;
		const legacy = stored.modifierMode ?? stored.shiftMode;
		if (legacy !== undefined) {
			merged.modifierMode = legacy === "off" ? "off" : "on";
		}
		return merged;
	} catch {
		return defaults();
	}
};

export const saveSettings = (settings: Settings): void => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
