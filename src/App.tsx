import { useCallback, useEffect, useRef, useState } from "react";
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
import { SettingsDialog } from "./SettingsDialog";
import { Modal } from "./Modal";
import { Footer } from "./Footer";
import { loadSettings, saveSettings, Settings } from "./settings";

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

export const App = () => {
	const sentEofRef = useRef(false);
	useEffect(() => {
		history.pushState(null, "");
		const callback = (e: BeforeUnloadEvent) => {
			if (sentEofRef.current) return;
			e.preventDefault();
		};
		window.addEventListener("beforeunload", callback);
		return () => {
			window.removeEventListener("beforeunload", callback);
		};
	}, []);

	const [state, onInput, restartNethack] = useNethack();
	// In-place restart: drop the old wasm + NetHack instance, boot a fresh
	// one. Used by both Play again (game-end) and the save-on-hide auto-resume
	// path. The save (if any) is already persisted to IDBFS by the prior run's
	// exitNhwindows shim, so the new wasm's preRun syncfs picks it up.
	const restart = useCallback(() => {
		sentEofRef.current = false;
		restartNethack();
	}, [restartNethack]);
	const [isNumLock, setIsNumLock] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [keyboardOpen, setKeyboardOpen] = useState(false);

	useEffect(() => {
		const root = document.documentElement;
		if (!keyboardOpen) {
			root.style.removeProperty("--bar-top");
			return;
		}
		const vv = window.visualViewport;
		const barEl = () =>
			document.querySelector<HTMLElement>(".kbd-bar");
		const update = () => {
			if (!vv) return;
			const barHeight = barEl()?.offsetHeight ?? 60;
			const top = vv.offsetTop + vv.height - barHeight;
			root.style.setProperty("--bar-top", `${top}px`);
		};
		vv?.addEventListener("resize", update);
		vv?.addEventListener("scroll", update);
		return () => {
			vv?.removeEventListener("resize", update);
			vv?.removeEventListener("scroll", update);
			root.style.removeProperty("--bar-top");
		};
	}, [keyboardOpen]);

	const [settings, setSettings] = useState<Settings>(loadSettings);
	const updateSettings = (patch: Partial<Settings>) => {
		setSettings((prev) => {
			const next = { ...prev, ...patch };
			saveSettings(next);
			return next;
		});
	};
	// Save-on-hide simulates a SIGHUP without exporting any new C symbol.
	// The chain: visibilitychange hidden -> onInput({eof:true}) sets a sticky
	// flag in NetHack -> nh_poskey/nhgetch wrappers return -1 to wasm ->
	// readchar_core hits EOF and calls hangup(0) -> SAFERHANGUP defers, but
	// the moveloop's done_hup check at allmain.c:182 calls end_of_input the
	// next iteration, which runs dosave0 and exit_nhwindows. Our exit_nhwindows
	// shim awaits FS.syncfs to persist /save/ to IDBFS, then sets
	// savedAndExited so the second effect can reload once the user returns.
	useEffect(() => {
		const triggerSave = () => {
			if (settings.saveOnHide && !sentEofRef.current) {
				sentEofRef.current = true;
				onInput({ eof: true });
			}
		};
		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				triggerSave();
			}
		};
		// pagehide is more reliable than visibilitychange when iOS suspends
		// an installed PWA directly rather than backgrounding Safari.
		const onPageHide = () => triggerSave();
		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("pagehide", onPageHide);
		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("pagehide", onPageHide);
		};
	}, [settings.saveOnHide, onInput]);

	// Wait for the save to actually persist before restarting; restarting
	// straight from visibilitychange races the in-flight IDBFS write.
	useEffect(() => {
		if (!sentEofRef.current || !state.savedAndExited) return;
		if (document.visibilityState === "visible") {
			restart();
			return;
		}
		const handler = () => {
			if (document.visibilityState === "visible") {
				restart();
			}
		};
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	}, [state.savedAndExited, restart]);
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
				{!keyboardOpen && (
					<StatusWindow
						status={state.status}
						compactStatus={settings.compactStatus}
					/>
				)}
				<MobileInputs
					triggerOnPointerDown={state.prompt?.type == "poskey"}
					isNumLock={isNumLock}
					setIsNumLock={setIsNumLock}
					gridButtons={settings.gridButtons}
					scrollButtons={settings.scrollButtons}
					customButtons={settings.customButtons}
					modifierMode={settings.modifierMode}
					keyboardOpen={keyboardOpen}
					setKeyboardOpen={setKeyboardOpen}
				/>
				{!keyboardOpen && (
					<>
						<button
							className="gear-button"
							aria-label="Settings"
							onClick={() => setShowSettings(true)}
						>
							⚙
						</button>
						<button
							className="info-button"
							aria-label="About"
							onClick={() => setShowInfo(true)}
						>
							ⓘ
						</button>
					</>
				)}
				{showInfo && (
					<Modal title="About" onClose={() => setShowInfo(false)}>
						<Footer />
					</Modal>
				)}
				{state.gameEnded && (
					<button
						className="play-again-button"
						onClick={restart}
					>
						Play again
					</button>
				)}
				{showSettings && (
					<SettingsDialog
						settings={settings}
						updateSettings={updateSettings}
						setSettings={setSettings}
						onClose={() => setShowSettings(false)}
					/>
				)}
			</main>
		</OnInputContext.Provider>
	);
};
