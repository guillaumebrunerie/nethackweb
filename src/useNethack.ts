import { createContext, useContext, useState } from "react";
import { Input, NetHack, startNetHack } from "./nethack";

const clone = <T>(x: T) => JSON.parse(JSON.stringify(x)) as T;
export const useNethack = () => {
	const [onInput, setOnInput] = useState<(input: Input) => void>(
		() => () => {},
	);
	const [gameStarted, setGameStarted] = useState(false);
	const startGame = () => {
		setGameStarted(true);
		setState(startNetHack((nethack) => {
			// This is very much a hack, but it works
			const cloned = clone(nethack);
			// Unclone the map for performance
			cloned.mapWindow = nethack.mapWindow;
			setState(cloned);
			setOnInput(() => (input: Input) => nethack.onInput(input));
		}));
	}
	const [state, setState] = useState<NetHack>({} as NetHack);
	return [gameStarted, startGame, state, onInput] as const;
};

export const OnInputContext = createContext<((input: Input) => void) | null>(
	null,
);

export const useOnInput = (): ((input: Input) => void) => {
	const onInput = useContext(OnInputContext);
	if (onInput === null) {
		throw new Error("useOnInput must be used within a OnInputProvider");
	}
	return onInput;
};
