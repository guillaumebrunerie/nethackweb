import { useEffect, useState } from "react";
import "@fontsource/dejavu-mono";

import "./App.css";
import { OnInputContext, useNethack, useOnInput } from "./useNethack";
import { ESC, type NetHack, type NHWindow } from "./nethack";
import { MessageWindow } from "./MessageWindow";
import { Prompt } from "./Prompt";
import { MapWindow } from "./MapWindow";
import { MenuWindow } from "./MenuWindow";
import { TextWindow } from "./TextWindow";
import { StatusWindow } from "./StatusWindow";
import { MobileInputs } from "./MobileInput";
import { CopyrightWindow } from "./CopyrightWindow";

const Window = ({ window_ }: { window_: NHWindow }) => {
	if (!window_.displayed) {
		return null;
	}
	switch (window_.type) {
		case "NHW_MENU":
			return <MenuWindow window_={window_} />;
		case "NHW_TEXT":
			return <TextWindow window_={window_} />;
		default:
			console.error("Unknown window type:", window_.type);
	}
};

const TemporaryWindows = ({ state }: { state: NetHack }) => {
	const onInput = useOnInput();
	const hasTemporaryWindow =
		// state.isLoading ||
		Object.values(state.windows).some(
			(window_) =>
				window_.id !== state.messageWindow?.id &&
				window_.id !== state.mapWindow?.id &&
				window_.displayed,
		);
	useEffect(() => {
		if (hasTemporaryWindow) {
			history.pushState(null, "");
			const callback = () => {
				onInput(ESC);
			};
			window.addEventListener("popstate", callback);
			return () => {
				window.removeEventListener("popstate", callback);
			};
		}
	}, [hasTemporaryWindow, onInput]);
	return (
		<div
			className={
				"temporary-windows" + (hasTemporaryWindow ? " backdrop" : "")
			}
			onClick={() => onInput(ESC)}
		>
			{Object.entries(state.windows).map(([windowId, window_]) =>
				(
					window_.id === state.messageWindow?.id ||
					window_.id === state.mapWindow?.id
				) ?
					null
				:	<Window key={windowId} window_={window_} />,
			)}
		</div>
	);
};

const MainGame = () => {
	useEffect(() => {
		history.pushState(null, "");
		const callback = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};
		window.addEventListener("beforeunload", callback);
		return () => {
			window.removeEventListener("beforeunload", callback);
		};
	}, []);

	const [state, onInput] = useNethack();
	const [isNumLock, setIsNumLock] = useState(false);
	return (
		<OnInputContext.Provider value={onInput}>
			<main>
				<MessageWindow window_={state.messageWindow} />
				<div className="map-container">
					<MapWindow
						window_={state.mapWindow}
						isNumLock={isNumLock}
					/>
					{!state.mapWindow?.displayed && <CopyrightWindow />}
				</div>
				{state.prompt && <Prompt prompt={state.prompt} />}
				<TemporaryWindows state={state} />
				<StatusWindow status={state.status} />
				<MobileInputs
					triggerOnPointerDown={state.prompt?.type == "poskey"}
					isNumLock={isNumLock}
					setIsNumLock={setIsNumLock}
				/>
			</main>
		</OnInputContext.Provider>
	);
};

export const App = () => {
	const [startGame, setStartGame] = useState(false);

	return (
	<>
	{startGame
	?	<MainGame/>
	:	<main>
			<div className="prompt blocking">
				<div className="line">
					{"Enter player name: "}<input
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
								setStartGame(true);
							}
						}}
						/>
				</div>
			</div>
		</main>
	}
	</>
	);
};
