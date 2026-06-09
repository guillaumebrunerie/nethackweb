import {
	createContext,
	useCallback,
	useContext,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Input, NetHack, restartNetHack, startNetHack } from "./nethack";

export type OnInput = (input: Input | Input[]) => void;

const clone = <T>(x: T) => JSON.parse(JSON.stringify(x)) as T;
export const useNethack = () => {
	const [onInput, setOnInput] = useState<OnInput>(() => () => {});
	// applyRef indirection breaks the closure-before-declaration cycle:
	// startNetHack needs an apply callback during useState's lazy init,
	// before setState exists. The actual implementation is wired in via
	// useLayoutEffect once the setters are bound.
	const applyRef = useRef<(nethack: NetHack) => void>(() => {});
	const apply = useCallback((nethack: NetHack) => applyRef.current(nethack), []);
	// startNetHack only stores apply for async invocation by the wasm runtime,
	// well after the layout effect below populates applyRef.current. The lint
	// rule can't model that and warns about reading a ref during render.
	// eslint-disable-next-line react-hooks/refs
	const [state, setState] = useState<NetHack>(() => startNetHack(apply));
	useLayoutEffect(() => {
		applyRef.current = (nethack: NetHack) => {
			const cloned = clone(nethack);
			// Unclone the map for performance
			cloned.mapWindow = nethack.mapWindow;
			setState(cloned);
			setOnInput(() => (input: Input | Input[]) => nethack.onInput(input));
		};
	}, []);
	const restart = useCallback(() => setState(restartNetHack(apply)), [apply]);
	return [state, onInput, restart] as const;
};

export const OnInputContext = createContext<OnInput | null>(null);

export const useOnInput = (): OnInput => {
	const onInput = useContext(OnInputContext);
	if (onInput === null) {
		throw new Error("useOnInput must be used within a OnInputProvider");
	}
	return onInput;
};
