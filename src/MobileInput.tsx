import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useOnInput } from "./useNethack";
import { ESC } from "./nethack";
import type { CustomButton, Settings } from "./settings";

type ModState = "idle" | "armed" | "locked";

const useModState = () => {
	const [state, setState] = useState<ModState>("idle");
	const lastTap = useRef(0);
	const tap = () => {
		const now = Date.now();
		setState((prev) => {
			if (prev === "idle") {
				lastTap.current = now;
				return "armed";
			}
			if (prev === "armed") {
				if (now - lastTap.current < 350) return "locked";
				return "idle";
			}
			return "idle";
		});
	};
	const consume = () => {
		setState((prev) => (prev === "armed" ? "idle" : prev));
	};
	return { state, tap, consume };
};

const applyModifiers = (
	ch: string,
	shift: boolean,
	meta: boolean,
	ctrl: boolean,
): string => {
	let c = ch;
	if (ctrl) {
		const code = c.toLowerCase().charCodeAt(0);
		if (code >= 0x60 && code <= 0x7f) {
			c = String.fromCharCode(code & 0x1f);
		}
	} else if (shift) {
		c = c.toUpperCase();
	}
	if (meta) {
		c = String.fromCharCode(c.charCodeAt(0) | 0x80);
	}
	return c;
};

type Input = string | { input: string; label: string };

const getLabel = (input: Input) =>
	typeof input === "string" ? input : input.label;
const getInput = (input: Input) =>
	typeof input === "string" ? input : input.input;

export type ResolvedAction =
	| { kind: "input"; input: Input }
	| { kind: "extcmd"; cmd: string };

export type ResolvedButton = {
	label: string;
	action: ResolvedAction;
};

const control = (input: string) => ({
	label: `^${input.toUpperCase()}`,
	input: String.fromCharCode(
		input.toLowerCase().charCodeAt(0) - "a".charCodeAt(0) + 1,
	),
});

const meta = (input: string) => ({
	label: `M-${input}`,
	input: String.fromCharCode(input.charCodeAt(0) | 0x80),
});

export type ButtonDef = {
	id: string;
	input: Input;
	label: string;
};

export const INPUT_CATALOG: ButtonDef[] = [
	{ id: "look", input: ":", label: "Look (:)" },
	{ id: "cast", input: "Z", label: "Cast (Z)" },
	{ id: "fire", input: "f", label: "Fire (f)" },
	{ id: "run", input: "G", label: "Run (G)" },
	{ id: "drop-type", input: "D", label: "Drop type (D)" },
	{ id: "inven", input: "i", label: "Inventory (i)" },
	{ id: "rush", input: "g", label: "Rush (g)" },
	{ id: "drop", input: "d", label: "Drop (d)" },
	{ id: "kick", input: control("D"), label: "Kick (^D)" },
	{ id: "travel", input: "_", label: "Travel (_)" },
	{ id: "loot", input: meta("l"), label: "Loot (M-l)" },

	{ id: "extcmd", input: "#", label: "# Extended" },
	{ id: "save", input: "S", label: "Save (S)" },
	{ id: "close", input: "c", label: "Close (c)" },
	{ id: "eat", input: "e", label: "Eat (e)" },
	{ id: "apply", input: "a", label: "Apply (a)" },
	{ id: "zap", input: "z", label: "Zap (z)" },
	{ id: "quaff", input: "q", label: "Quaff (q)" },
	{ id: "read", input: "r", label: "Read (r)" },
	{ id: "throw", input: "t", label: "Throw (t)" },
	{ id: "move", input: "m", label: "Move (m)" },
	{ id: "fight", input: "F", label: "Fight (F)" },
	{ id: "wield", input: "w", label: "Wield (w)" },
	{ id: "wear", input: "W", label: "Wear (W)" },
	{ id: "swap", input: "x", label: "Swap (x)" },
	{ id: "two-weapon", input: "X", label: "Two-weapon (X)" },
	{ id: "quiver", input: "Q", label: "Quiver (Q)" },
	{ id: "put-on", input: "P", label: "Put on (P)" },
	{ id: "takeoff", input: "T", label: "Take off (T)" },
	{ id: "remove", input: "R", label: "Remove (R)" },
	{ id: "open", input: "o", label: "Open (o)" },
	{ id: "inven-type", input: "I", label: "Inv. by type (I)" },
	{ id: "help", input: "?", label: "Help (?)" },
	{ id: "see-all", input: "*", label: "See all (*)" },
	{ id: "discoveries", input: "\\", label: "Discoveries (\\)" },
	{ id: "options", input: "O", label: "Options (O)" },
	{ id: "attributes", input: control("X"), label: "Attributes (^X)" },
	{ id: "esc", input: { label: "Esc", input: ESC }, label: "Escape" },
];

const catalogMap = new Map(INPUT_CATALOG.map((b) => [b.id, b]));

const customLabel = (custom: CustomButton) =>
	custom.label || `#${custom.extcmd}`;

export const buttonShortLabel = (
	id: string,
	customButtons: CustomButton[],
) => {
	const entry = catalogMap.get(id);
	if (entry) return getLabel(entry.input);
	const custom = customButtons.find((c) => c.id === id);
	if (custom) return customLabel(custom);
	return "?";
};

export const buttonFullLabel = (
	id: string,
	customButtons: CustomButton[],
) => {
	const entry = catalogMap.get(id);
	if (entry) return INPUT_CATALOG.find((b) => b.id === id)?.label ?? id;
	const custom = customButtons.find((c) => c.id === id);
	if (custom) return `${customLabel(custom)} (#${custom.extcmd})`;
	return id;
};

export const resolveButtons = (
	ids: string[],
	customButtons: CustomButton[],
): ResolvedButton[] =>
	ids.flatMap((id) => {
		const entry = catalogMap.get(id);
		if (entry) {
			return [
				{
					label: getLabel(entry.input),
					action: { kind: "input", input: entry.input } as ResolvedAction,
				},
			];
		}
		const custom = customButtons.find((c) => c.id === id);
		if (custom) {
			return [
				{
					label: customLabel(custom),
					action: { kind: "extcmd", cmd: custom.extcmd } as ResolvedAction,
				},
			];
		}
		return [];
	});

export const INPUT_CATALOG_IDS = INPUT_CATALOG.map((b) => b.id);

export const allButtonIds = (customButtons: CustomButton[]) => [
	...INPUT_CATALOG_IDS,
	...customButtons.map((c) => c.id),
];

const SectorSVG = ({
	start,
	end,
	handleActivate,
	triggerOnPointerDown,
}: {
	start: number;
	end: number;
	handleActivate: () => void;
	triggerOnPointerDown: boolean;
}) => {
	const angle1 = (start / 180) * Math.PI;
	const angle2 = (end / 180) * Math.PI;
	const polar = (angle: number, radius: number) =>
		`${(Math.sin(angle) * radius).toFixed(2)} ${(-Math.cos(angle) * radius).toFixed(2)}`;
	const d = `
		M ${polar(angle1, 60)}
		L ${polar(angle1, 180)}
		A 180 180 0 0 1 ${polar(angle2, 180)}
		L ${polar(angle2, 60)}
		A 60 60 0 0 0 ${polar(angle1, 60)}`;
	const props = {
		[triggerOnPointerDown ? "onPointerDown" : "onClick"]: handleActivate,
	};
	return <path d={d} {...props} />;
};

const MobileDirInput = ({
	triggerOnPointerDown,
	dispatchDir,
	shiftActive,
}: {
	triggerOnPointerDown: boolean;
	dispatchDir: (input: string) => void;
	shiftActive: boolean;
}) => {
	const inputs = "kulnjbhy".split("");
	const showLetter = (c: string) => (shiftActive ? c.toUpperCase() : c);
	return (
		<div className="direction_input">
			<div className="corner top left" onClick={() => dispatchDir("<")}>
				{"<"}
			</div>
			<div className="corner bottom left" onClick={() => dispatchDir(">")}>
				{">"}
			</div>
			<div className="corner top right" onClick={() => dispatchDir("s")}>
				{"s"}
			</div>
			<div className="corner bottom right" onClick={() => dispatchDir(",")}>
				{","}
			</div>
			<svg
				version="1.1"
				width="100%"
				height="100%"
				viewBox="-200 -200 400 400"
			>
				{inputs.map((input, i) => (
					<SectorSVG
						key={i}
						start={i * 45 - 22.5}
						end={(i + 1) * 45 - 22.5}
						handleActivate={() => dispatchDir(input)}
						triggerOnPointerDown={triggerOnPointerDown}
					/>
				))}
			</svg>
			<div
				className="center"
				style={{ touchAction: "none" }}
				onClick={() => dispatchDir(".")}
			>
				·
			</div>
			{inputs.map((input, i) => (
				<div
					key={i}
					className="label"
					style={{
						"--angle": `${i * 45}deg`,
					}}
				>
					{showLetter(input)}
				</div>
			))}
		</div>
	);
};

const isTouchDevice = () =>
	typeof window !== "undefined" &&
	window.matchMedia("(pointer: coarse)").matches;

const ModButton = ({
	label,
	state,
	onTap,
	ariaLabel,
	lockedLabel,
}: {
	label: string;
	state: ModState;
	onTap: () => void;
	ariaLabel: string;
	lockedLabel?: string;
}) => {
	const lastTapRef = useRef(0);
	const handleTap = (
		e:
			| React.TouchEvent<HTMLDivElement>
			| React.MouseEvent<HTMLDivElement>,
	) => {
		e.preventDefault();
		const now = Date.now();
		// Dedupe: iOS fires both touchstart and synthetic mousedown for
		// the same physical tap. Ignore the second event.
		if (now - lastTapRef.current < 200) return;
		lastTapRef.current = now;
		onTap();
	};
	return (
		<div
			className={
				"mod-button" +
				(state === "armed" ? " armed" : "") +
				(state === "locked" ? " locked" : "")
			}
			aria-label={ariaLabel}
			aria-pressed={state !== "idle"}
			onTouchStart={handleTap}
			onMouseDown={handleTap}
		>
			{state === "locked" && lockedLabel ? lockedLabel : label}
		</div>
	);
};

export const MobileInputs = ({
	triggerOnPointerDown,
	isNumLock,
	setIsNumLock,
	gridButtons,
	scrollButtons,
	customButtons,
	modifierMode,
	keyboardOpen,
	setKeyboardOpen,
}: {
	triggerOnPointerDown: boolean;
	isNumLock: boolean;
	setIsNumLock: (isNumLock: boolean) => void;
	gridButtons: string[];
	scrollButtons: string[];
	customButtons: CustomButton[];
	modifierMode: Settings["modifierMode"];
	keyboardOpen: boolean;
	setKeyboardOpen: (open: boolean) => void;
}) => {
	const onInput = useOnInput();
	const gridInputs = resolveButtons(gridButtons, customButtons);
	const scrollInputs = resolveButtons(scrollButtons, customButtons);
	const shift = useModState();
	const meta = useModState();
	const ctrl = useModState();
	const shiftActive = shift.state !== "idle";
	const metaActive = meta.state !== "idle";
	const ctrlActive = ctrl.state !== "idle";

	const showModifiers = modifierMode === "on";
	const [touchDevice] = useState(isTouchDevice);

	const captureRef = useRef<HTMLInputElement>(null);

	const consumeArmed = () => {
		shift.consume();
		meta.consume();
		ctrl.consume();
	};

	const dispatchChar = (ch: string) => {
		onInput(applyModifiers(ch, shiftActive, metaActive, ctrlActive));
		consumeArmed();
	};

	const dispatchDir = (input: string) => {
		const isDir = "hjklyubn".includes(input);
		const out = shiftActive && isDir ? input.toUpperCase() : input;
		onInput(out);
		if (isDir) shift.consume();
	};

	const toggleKeyboard = () => {
		const el = captureRef.current;
		if (keyboardOpen) {
			el?.blur();
			setKeyboardOpen(false);
		} else {
			// Pre-position the bar near the top of the layout so it is
			// guaranteed to be inside the visual viewport when iOS
			// evaluates the focus and decides whether to auto-scroll.
			// App.tsx's visualViewport listener moves the bar down to
			// just above the keyboard once iOS reports the real
			// viewport height.
			document.documentElement.style.setProperty(
				"--bar-top",
				"200px",
			);
			flushSync(() => setKeyboardOpen(true));
			el?.focus();
		}
	};

	const modifierPrefix =
		(shiftActive ? "⇧" : "") +
		(ctrlActive ? "^" : "") +
		(metaActive ? "M-" : "");

	const dispatch = (rb: ResolvedButton) => {
		if (rb.action.kind === "input") {
			onInput(getInput(rb.action.input));
		} else {
			onInput(["#", rb.action.cmd, { submit: true }]);
		}
	};

	const numberInputs: ResolvedButton[] = [
		"7", "8", "9",
		"4", "5", "6",
		"1", "2", "3",
		";", "0",
	].map((c) => ({ label: c, action: { kind: "input", input: c } }));

	const scrollRef = useRef<HTMLDivElement>(null);
	const [fadeLeft, setFadeLeft] = useState(false);
	const [fadeRight, setFadeRight] = useState(false);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const update = () => {
			setFadeLeft(el.scrollLeft > 0);
			setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
		};
		update();
		el.addEventListener("scroll", update);
		return () => el.removeEventListener("scroll", update);
	}, [scrollInputs]);

	return (
		<>
			<div
				className="main-inputs"
				style={keyboardOpen ? { display: "none" } : undefined}
			>
				<div className="shortcut-inputs">
					{(isNumLock ? numberInputs : gridInputs).map((rb, i) => (
						<div
							key={i}
							className="simple_input"
							onClick={() => dispatch(rb)}
						>
							{rb.label}
						</div>
					))}
					<div
						className={
							"simple_input numlock" +
							(isNumLock ? " active" : "")
						}
						onClick={() => {
							setIsNumLock(!isNumLock);
						}}
					>
						{"123"}
					</div>
				</div>
				{(showModifiers || touchDevice) && (
					<div className="mod-column">
						{showModifiers && (
							<>
								<ModButton
									label="↑"
									lockedLabel="⇑"
									state={shift.state}
									onTap={shift.tap}
									ariaLabel="Shift"
								/>
								<ModButton
									label="M"
									state={meta.state}
									onTap={meta.tap}
									ariaLabel="Meta"
								/>
								<ModButton
									label="^"
									state={ctrl.state}
									onTap={ctrl.tap}
									ariaLabel="Ctrl"
								/>
							</>
						)}
						{touchDevice && (
							<div
								className={
									"mod-button kbd-button" +
									(keyboardOpen ? " active" : "")
								}
								aria-label="Show keyboard"
								aria-pressed={keyboardOpen}
								onClick={toggleKeyboard}
							>
								{"⌨"}
							</div>
						)}
					</div>
				)}
				<MobileDirInput
					triggerOnPointerDown={triggerOnPointerDown}
					dispatchDir={dispatchDir}
					shiftActive={shiftActive}
				/>
			</div>
			{touchDevice && keyboardOpen && (
				<div className="kbd-bar">
					<ModButton
						label="↑"
						lockedLabel="⇑"
						state={shift.state}
						onTap={shift.tap}
						ariaLabel="Shift"
					/>
					<ModButton
						label="M"
						state={meta.state}
						onTap={meta.tap}
						ariaLabel="Meta"
					/>
					<ModButton
						label="^"
						state={ctrl.state}
						onTap={ctrl.tap}
						ariaLabel="Ctrl"
					/>
					<div className="kbd-bar-field">
						{modifierPrefix && (
							<span className="kbd-bar-prefix">
								{modifierPrefix}
							</span>
						)}
						<input
							ref={captureRef}
							className="kbd-bar-input"
							type="text"
							autoComplete="off"
							autoCorrect="off"
							autoCapitalize="none"
							spellCheck="false"
							placeholder="type to send"
							value=""
							autoFocus
							onBlur={() => setKeyboardOpen(false)}
							onChange={(e) => {
								for (const ch of e.target.value) {
									dispatchChar(ch);
								}
							}}
							onKeyDown={(e) => {
								e.stopPropagation();
								if (e.key === "Enter") {
									e.preventDefault();
									onInput("\r");
									consumeArmed();
								} else if (e.key === "Backspace") {
									e.preventDefault();
									onInput("\b");
									consumeArmed();
								} else if (e.key === "Escape") {
									e.preventDefault();
									onInput(ESC);
									consumeArmed();
									setKeyboardOpen(false);
								}
							}}
						/>
					</div>
					<div
						className="mod-button kbd-dismiss"
						aria-label="Dismiss keyboard"
						onTouchStart={(e) => e.preventDefault()}
						onMouseDown={(e) => {
							e.preventDefault();
							setKeyboardOpen(false);
						}}
						onClick={() => setKeyboardOpen(false)}
					>
						{"×"}
					</div>
				</div>
			)}
			<div
				ref={scrollRef}
				className={
					"simple_inputs" +
					(fadeLeft ? " fade-left" : "") +
					(fadeRight ? " fade-right" : "")
				}
				style={keyboardOpen ? { display: "none" } : undefined}
			>
				{scrollInputs.map((rb, i) => (
					<div
						key={i}
						className={"simple_input" + (i === 0 ? " toggle" : "")}
						onClick={() => dispatch(rb)}
					>
						{rb.label}
					</div>
				))}
			</div>
		</>
	);
};
