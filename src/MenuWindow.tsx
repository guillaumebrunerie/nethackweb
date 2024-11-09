import { Text } from "./Common";
import { NHMenuEntry, NHMenuWindow } from "./nethack";
import { TextWindow } from "./TextWindow";
import { useOnInput } from "./useNethack";

const selectedSeparator = (count: number) => {
	if (count == 0) {
		return "-";
	} else if (count == -1) {
		return "+";
	} else {
		return "#";
	}
};

const MenuEntry = ({ menuEntry }: { menuEntry: NHMenuEntry }) => {
	const onInput = useOnInput();
	const accelerator = menuEntry.accelerator || menuEntry.customAccelerator;
	return (
		<div
			className={
				"line" +
				(menuEntry.selectedCount != 0 ? " selected" : "") +
				(accelerator ? " menu_entry" : "")
			}
			onClick={accelerator ? () => onInput(accelerator) : undefined}
		>
			{accelerator && (
				<>
					<kbd>{accelerator}</kbd>{" "}
					{selectedSeparator(menuEntry.selectedCount)}{" "}
				</>
			)}
			<Text color={menuEntry.clr} attrs={[menuEntry.attr]}>
				{menuEntry.str}
			</Text>
		</div>
	);
};

export const MenuWindow = ({ window_ }: { window_: NHMenuWindow }) => {
	const onInput = useOnInput();
	if (window_.text.length > 0) {
		return <TextWindow window_={window_} />;
	}
	if (!window_.prompt && !window_.menuEntries.length) {
		return null;
	}
	return (
		<div className={"menu blocking"}>
			{window_.prompt && <div className="line">{window_.prompt}</div>}
			{window_.prompt && <div className="line"></div>}
			{window_.menuEntries.map((menuEntry, i) => (
				<MenuEntry key={i} menuEntry={menuEntry} />
			))}
			<div className={"line"}></div>
			<div className={"line menu_entry"} onClick={() => onInput(" ")}>
				<Text attrs={["ATR_INVERSE"]}> Ok </Text>
			</div>
		</div>
	);
};
