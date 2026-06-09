import { Dispatch, SetStateAction, useState } from "react";
import nethackrcContents from "./nethackrc.txt?raw";
import { Modal } from "./Modal";
import {
	CustomButton,
	loadSettings,
	newCustomButtonId,
	Settings,
} from "./settings";
import {
	allButtonIds,
	buttonFullLabel,
	buttonShortLabel,
} from "./MobileInput";

type SubModal = null | "rc" | "reset-rc" | "reset-all";

export const SettingsDialog = ({
	settings,
	updateSettings,
	setSettings,
	onClose,
}: {
	settings: Settings;
	updateSettings: (patch: Partial<Settings>) => void;
	setSettings: Dispatch<SetStateAction<Settings>>;
	onClose: () => void;
}) => {
	const [sub, setSub] = useState<SubModal>(null);

	const idOrder = allButtonIds(settings.customButtons);
	const scrollAvailable = idOrder.filter(
		(id) => !settings.scrollButtons.includes(id),
	);

	const removeScroll = (id: string) =>
		updateSettings({
			scrollButtons: settings.scrollButtons.filter((b) => b !== id),
		});

	const addScroll = (id: string) =>
		updateSettings({ scrollButtons: [...settings.scrollButtons, id] });

	const moveScroll = (id: string, dir: -1 | 1) => {
		const list = [...settings.scrollButtons];
		const i = list.indexOf(id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= list.length) return;
		[list[i], list[j]] = [list[j], list[i]];
		updateSettings({ scrollButtons: list });
	};

	const updateCustom = (id: string, patch: Partial<CustomButton>) => {
		updateSettings({
			customButtons: settings.customButtons.map((c) =>
				c.id === id ? { ...c, ...patch } : c,
			),
		});
	};

	const addCustom = () => {
		updateSettings({
			customButtons: [
				...settings.customButtons,
				{ id: newCustomButtonId(), extcmd: "", label: "" },
			],
		});
	};

	const deleteCustom = (id: string) => {
		updateSettings({
			customButtons: settings.customButtons.filter((c) => c.id !== id),
			gridButtons: settings.gridButtons.map((b) => (b === id ? "look" : b)),
			scrollButtons: settings.scrollButtons.filter((b) => b !== id),
		});
	};

	return (
		<Modal title="Settings" onClose={onClose}>
			<div className="settings-row">
				<label className="settings-label" htmlFor="settings-playername">
					Default player name
				</label>
				<input
					id="settings-playername"
					type="text"
					value={settings.playerName}
					onChange={(e) => updateSettings({ playerName: e.target.value })}
				/>
				<div className="settings-note">
					Used for new games. Existing saves keep their original name.
				</div>
			</div>

			<div className="settings-row">
				<label>
					<input
						type="checkbox"
						checked={settings.compactStatus}
						onChange={(e) =>
							updateSettings({ compactStatus: e.target.checked })
						}
					/>{" "}
					Compact status bar
				</label>
			</div>

			<div className="settings-row">
				<label>
					<input
						type="checkbox"
						checked={settings.saveOnHide}
						onChange={(e) =>
							updateSettings({ saveOnHide: e.target.checked })
						}
					/>{" "}
					Save and exit when app loses focus
				</label>
				<div className="settings-note">
					When you switch tabs or hide the window, the game saves and
					quits. Returning to the tab reloads and continues from the
					save.
				</div>
			</div>

			<div className="settings-row">
				<label>
					<input
						type="checkbox"
						checked={settings.modifierMode === "on"}
						onChange={(e) =>
							updateSettings({
								modifierMode: e.target.checked ? "on" : "off",
							})
						}
					/>{" "}
					Show modifier buttons
				</label>
				<div className="settings-note">
					Adds on-screen Shift, Meta, and Ctrl toggles. Tap once to
					arm for one keystroke; double-tap to lock; tap again to
					release. Hardware modifiers on a keyboard always work
					regardless.
				</div>
			</div>

			<div className="settings-row">
				<div className="settings-label">Grid buttons</div>
				<div className="settings-grid-slots">
					{settings.gridButtons.map((id, i) => (
						<select
							key={i}
							className="settings-grid-slot"
							value={id}
							onChange={(e) => {
								const updated = [...settings.gridButtons];
								updated[i] = e.target.value;
								updateSettings({ gridButtons: updated });
							}}
						>
							{idOrder.map((cid) => (
								<option key={cid} value={cid}>
									{buttonShortLabel(cid, settings.customButtons)}
								</option>
							))}
						</select>
					))}
				</div>
			</div>

			<div className="settings-row">
				<div className="settings-label">Scroll buttons</div>
				<div className="settings-note">
					Reorder with the arrows, remove with ×. Add buttons from the
					available list below.
				</div>
				<div className="settings-scroll-active">
					{settings.scrollButtons.map((id, i) => (
						<div key={id} className="settings-scroll-row">
							<button
								onClick={() => moveScroll(id, -1)}
								disabled={i === 0}
								aria-label="Move up"
							>
								↑
							</button>
							<button
								onClick={() => moveScroll(id, 1)}
								disabled={i === settings.scrollButtons.length - 1}
								aria-label="Move down"
							>
								↓
							</button>
							<button
								onClick={() => removeScroll(id)}
								aria-label="Remove"
							>
								×
							</button>
							<span>
								{buttonFullLabel(id, settings.customButtons)}
							</span>
						</div>
					))}
				</div>
				{scrollAvailable.length > 0 && (
					<>
						<div className="settings-note">Available:</div>
						<div className="settings-scroll-available">
							{scrollAvailable.map((id) => (
								<button
									key={id}
									onClick={() => addScroll(id)}
								>
									+ {buttonFullLabel(id, settings.customButtons)}
								</button>
							))}
						</div>
					</>
				)}
			</div>

			<div className="settings-row">
				<div className="settings-label">Custom extended commands</div>
				<div className="settings-note">
					Each row adds a toolbar button. The left field is the button
					label shown in the toolbar; the right field is the extended
					command name to send (no leading #), e.g. <code>pray</code>.
				</div>
				<div className="settings-custom-list">
					{settings.customButtons.length > 0 && (
						<div className="settings-custom-row settings-custom-header">
							<div>Label</div>
							<div>Extended command</div>
							<div />
						</div>
					)}
					{settings.customButtons.map((c) => (
						<div key={c.id} className="settings-custom-row">
							<input
								type="text"
								placeholder="label"
								value={c.label}
								onChange={(e) =>
									updateCustom(c.id, { label: e.target.value })
								}
							/>
							<input
								type="text"
								placeholder="extcmd"
								value={c.extcmd}
								onChange={(e) =>
									updateCustom(c.id, {
										extcmd: e.target.value
											.toLowerCase()
											.replace(/[^a-z]/g, ""),
									})
								}
							/>
							<button onClick={() => deleteCustom(c.id)}>
								Delete
							</button>
						</div>
					))}
					<button onClick={addCustom}>Add custom command</button>
				</div>
			</div>

			<div className="settings-row">
				<button onClick={() => setSub("rc")}>Edit nethackrc</button>{" "}
				<button onClick={() => setSub("reset-rc")}>
					Reset rc to default
				</button>{" "}
				<button onClick={() => setSub("reset-all")}>
					Reset all settings
				</button>
			</div>

			{sub === "rc" && (
				<Modal title="Edit nethackrc" onClose={() => setSub(null)}>
					<textarea
						className="settings-rc-textarea"
						value={settings.nethackrc}
						onChange={(e) =>
							updateSettings({ nethackrc: e.target.value })
						}
					/>
					<div className="settings-note">
						Changes apply on the next game start.
					</div>
				</Modal>
			)}

			{sub === "reset-rc" && (
				<Modal title="Reset rc to default?" onClose={() => setSub(null)}>
					<p>
						This replaces your nethackrc with the bundled default.
						Other settings are not affected.
					</p>
					<button
						onClick={() => {
							updateSettings({ nethackrc: nethackrcContents });
							setSub(null);
						}}
					>
						Reset
					</button>{" "}
					<button onClick={() => setSub(null)}>Cancel</button>
				</Modal>
			)}

			{sub === "reset-all" && (
				<Modal
					title="Reset all settings?"
					onClose={() => setSub(null)}
				>
					<p>
						This replaces every setting with defaults. Saves in
						browser storage are not affected.
					</p>
					<button
						onClick={() => {
							localStorage.removeItem("nethackweb");
							setSettings(loadSettings());
							setSub(null);
						}}
					>
						Reset
					</button>{" "}
					<button onClick={() => setSub(null)}>Cancel</button>
				</Modal>
			)}
		</Modal>
	);
};
