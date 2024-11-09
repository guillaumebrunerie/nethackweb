import { Text } from "./Common";
import { NHMessageWindow } from "./nethack";

export const MessageWindow = ({ window_ }: { window_?: NHMessageWindow }) => {
	return (
		<div className={"message" + (window_?.blocking ? " blocking" : "")}>
			{window_?.blocking && (
				<div className="title">
					<Text attrs={["ATR_INVERSE"]}>--More--</Text>
				</div>
			)}
			{window_?.text.toReversed().map(({ str, attr }, i) => (
				<div key={i} className="line">
					<Text attrs={[attr]}>{str}</Text>
				</div>
			))}
			{window_?.oldText.toReversed().map(({ str, attr }, i) => (
				<div key={i} className="oldline">
					<Text attrs={[attr]}>{str}</Text>
				</div>
			))}
		</div>
	);
};
