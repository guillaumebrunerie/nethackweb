import { getUniqueExtCmdAutocomplete } from "../lib/nethackInterface";
import {
	ESC,
	ExtCmdPrompt as ExtCmdPromptType,
	GetlinPrompt as GetlinPromptType,
	Prompt as PromptType,
	YNPrompt,
} from "./nethack";
import { useOnInput } from "./useNethack";

const Kbd = ({
	children,
	className,
}: {
	children: string;
	className?: string;
}) => {
	const onInput = useOnInput();
	return (
		<kbd className={className} onClick={() => onInput(children)}>
			{children}
		</kbd>
	);
};

const YNQuestion = ({ question, choices, def }: YNPrompt) => {
	return (
		<div className="prompt blocking">
			<div className="line">
				{question}
				{choices && (
					<>
						{" ["}
						{choices.split("").map((c, i) => (
							<Kbd key={i} className={c == def ? "def" : ""}>
								{c == "\x1b" ? "ESC" : c}
							</Kbd>
						))}
						{"]"}
					</>
				)}
			</div>
		</div>
	);
};

const ExtCmdPrompt = ({ cmd }: ExtCmdPromptType) => {
	const autocomplete = getUniqueExtCmdAutocomplete(cmd.toLowerCase());
	const onInput = useOnInput();
	const resetPrompt = () => {
		onInput(ESC);
	};
	return (
		<div className="prompt blocking">
			{autocomplete && (
				<div className="autocomplete">
					#{autocomplete.name} ({autocomplete.description})
				</div>
			)}
			<div className="line">
				{"#"}
				<input
					className="extcmd"
					type="text"
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="none"
					spellCheck="false"
					value={cmd.toLowerCase()}
					autoFocus
					onBlur={resetPrompt}
					onChange={(e) => {
						onInput(e.target.value);
					}}
					onKeyDown={(e) => {
						e.stopPropagation();
						if (e.key == "Enter") {
							onInput({ submit: true });
						} else if (e.key == "Escape") {
							resetPrompt();
						}
					}}
				/>
			</div>
		</div>
	);
};

const GetlinPrompt = ({ prompt, answer }: GetlinPromptType) => {
	const onInput = useOnInput();
	const resetPrompt = () => {
		onInput(ESC);
	};
	return (
		<div className="prompt blocking">
			<div className="line">
				{prompt + " "}
				<input
					className="extcmd"
					type="text"
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="none"
					spellCheck="false"
					value={answer}
					autoFocus
					onBlur={resetPrompt}
					onChange={(e) => {
						onInput(e.target.value);
					}}
					onKeyDown={(e) => {
						e.stopPropagation();
						if (e.key == "Enter") {
							onInput({ submit: true });
						} else if (e.key == "Escape") {
							resetPrompt();
						}
					}}
				/>
			</div>
		</div>
	);
};

export const GetNamePrompt = ({onEnter}: {onEnter: () => void}) => {
	return (
		<div className="prompt blocking">
			<div className="line">
				{"Player name: "}
				<input
					className="extcmd"
					type="text"
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="none"
					spellCheck="false"
					defaultValue={(typeof localStorage !== 'undefined' ? localStorage["NetHack_Name"] : "")}
					autoFocus
					onChange={(e) => {
						if (typeof localStorage !== 'undefined')
							localStorage["NetHack_Name"] = e.target.value;
					}}
					onKeyDown={(e) => {
						e.stopPropagation();
						if (e.key == "Enter") {
							onEnter();
						}
					}}
				/>
			</div>
		</div>
	);
};
export const Prompt = ({ prompt }: { prompt: PromptType }) => {
	switch (prompt.type) {
		case "yn":
			return <YNQuestion {...prompt} />;
		case "extcmd":
			return <ExtCmdPrompt {...prompt} />;
		case "getlin":
			return <GetlinPrompt {...prompt} />;
	}
};
