import { Text } from "./Common";
import { NHMenuWindow, NHTextWindow } from "./nethack";
import { useOnInput } from "./useNethack";

export const TextWindow = ({
	window_,
}: {
	window_: NHTextWindow | NHMenuWindow;
}) => {
	const onInput = useOnInput();
	return (
		<div
			className={"text" + (window_.blocking ? " blocking" : "")}
			onClick={() => {
				onInput(" ");
			}}
		>
			{window_.text.map(({ str, attr }, i) => (
				<div key={i} className="line">
					<Text attrs={[attr]}>{str}</Text>
				</div>
			))}
		</div>
	);
};
