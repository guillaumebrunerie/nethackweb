import { useOnInput } from "./useNethack";
import { ESC } from "./nethack";

const getLabel = (input: Input) =>
	typeof input === "string" ? input : input.label;
const getInput = (input: Input) =>
	typeof input === "string" ? input : input.input;

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
}: {
	triggerOnPointerDown: boolean;
}) => {
	const onInput = useOnInput();
	const inputs = "kulnjbhy".split("");
	return (
		<div className="direction_input">
			<div className="corner top left" onClick={() => onInput("<")}>
				{"<"}
			</div>
			<div className="corner bottom left" onClick={() => onInput(">")}>
				{">"}
			</div>
			<div className="corner top right" onClick={() => onInput("s")}>
				{"s"}
			</div>
			<div className="corner bottom right" onClick={() => onInput(",")}>
				{","}
			</div>
			<svg
				version="1.1"
				width={200}
				height={200}
				viewBox="-200 -200 400 400"
			>
				{inputs.map((input, i) => (
					<SectorSVG
						key={i}
						start={i * 45 - 22.5}
						end={(i + 1) * 45 - 22.5}
						handleActivate={() => onInput(input)}
						triggerOnPointerDown={triggerOnPointerDown}
					/>
				))}
			</svg>
			<div
				className="center"
				style={{ touchAction: "none" }}
				onClick={() => onInput(".")}
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
					{input}
				</div>
			))}
		</div>
	);
};

type Input = string | { input: string; label: string };

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

const shortcutInputs: Input[] = [
	":",
	"Z",
	"f",

	"G",
	"D",
	"i",

	"g",
	"d",
	control("D"),

	"_",
	meta("l"),
];

const numberInputs: Input[] = [
	"7",
	"8",
	"9",
	"4",
	"5",
	"6",
	"1",
	"2",
	"3",

	";",
	"0",
];

const allInputs: Input[] = [
	"#",
	"S",
	"c",
	"e",
	"a",
	"z",
	"q",
	"r",

	"t",
	"m",
	"F",
	"w",
	"W",
	"x",
	"X",
	"Q",
	"P",
	"T",
	"R",

	"o",
	"I",
	"?",
	"*",
	"\\",
	"O",
	control("X"),
	{ label: "Esc", input: ESC },
];

export const MobileInputs = ({
	triggerOnPointerDown,
	isNumLock,
	setIsNumLock,
}: {
	triggerOnPointerDown: boolean;
	isNumLock: boolean;
	setIsNumLock: (isNumLock: boolean) => void;
}) => {
	const onInput = useOnInput();
	return (
		<>
			<div className="main-inputs">
				<div className="shortcut-inputs">
					{(isNumLock ? numberInputs : shortcutInputs).map(
						(input, i) => (
							<div
								key={i}
								className="simple_input"
								onClick={() => onInput(getInput(input))}
							>
								{getLabel(input)}
							</div>
						),
					)}
					<div
						className={
							"simple_input numlock" +
							(isNumLock ? " active" : "")
						}
						onClick={() => {
							setIsNumLock(!isNumLock);
						}}
					>
						{isNumLock ? "123" : "123"}
					</div>
				</div>
				<MobileDirInput triggerOnPointerDown={triggerOnPointerDown} />
			</div>
			<div className="simple_inputs">
				{allInputs.map((input, i) => (
					<div
						key={i}
						className={"simple_input" + (i === 0 ? " toggle" : "")}
						onClick={() => onInput(getInput(input))}
					>
						{getLabel(input)}
					</div>
				))}
			</div>
		</>
	);
};
