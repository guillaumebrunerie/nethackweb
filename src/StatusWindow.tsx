import { Status } from "./nethack";
import {
	Attr,
	Color,
	Condition as ConditionT,
	flags,
	iflags,
} from "../lib/nethackInterface";
import { Text, TextCA } from "./Common";
import { useState } from "react";

const convertAttr = (attr: string): Attr => {
	switch (attr) {
		case "HL_ATTCLR_DIM":
			return "ATR_DIM";
		case "HL_ATTCLR_BOLD":
			return "ATR_BOLD";
		case "HL_ATTCLR_BLINK":
			return "ATR_BLINK";
		case "HL_ATTCLR_ULINE":
			return "ATR_ULINE";
		case "HL_ATTCLR_INVERSE":
			return "ATR_INVERSE";
		case "HL_ATTCLR_ITALIC":
			return "ATR_ITALIC";
	}
	throw new Error(`Unknown attribute: ${attr}`);
};

const Condition = ({
	condition: { color, attrs, text },
}: {
	condition: ConditionT;
}) => {
	return (
		<Text color={color} attrs={attrs.map(convertAttr)}>
			{text[0]}
		</Text>
	);
};

const Conditions = ({ conditions }: { conditions: ConditionT[] }) => {
	return (
		<>
			{conditions
				.toSorted((a, b) => a.ranking - b.ranking)
				.map((condition, i) => (
					<Condition key={i} condition={condition} />
				))}
		</>
	);
};

const Title = ({ 
	status,
	onClick 
}: { 
	status: Status,
	onClick: () => void
}) => {
	const title = status.values.BL_TITLE?.value;
	if (!title) {
		return null;
	}
	if (!iflags().wc2_hitpointbar) {
		return <Text>[{title}]</Text>;
	}

	const color = status.values.BL_HP?.color;
	if (!color) {
		return null;
	}
	const percentage =
		Number(status.values.BL_HP?.value) /
		Number(status.values.BL_HPMAX?.value);
	const len = Math.floor(percentage * title.length);
	return (
		<span onClick={onClick}>
			<Text>[</Text>
			<Text color={color} attrs={["ATR_INVERSE", "ATR_BOLD"]}>
				{title.slice(0, len)}
			</Text>
			<Text>{title.slice(len)}</Text>
			<Text>]</Text>
		</span>
	);
};

const HP = ({ status }: { status: Status }) => {
	const current = status.values.BL_HP;
	const total = status.values.BL_HPMAX;
	if (!current || !total) {
		return null;
	}
	return (
		<b>
			<TextCA colorAttr={current}>HP:{current.value}</TextCA>
			<TextCA colorAttr={total}>({total.value})</TextCA>
		</b>
	);
};

const Gold = ({ status }: { status: Status }) => {
	const gold = status.values.BL_GOLD?.value;
	if (!gold) {
		return null;
	}
	return <span>$:{gold.slice(11)}</span>;
};

const Pw = ({ status }: { status: Status }) => {
	const current = status.values.BL_ENE;
	const total = status.values.BL_ENEMAX;
	if (!current || !total) {
		return null;
	}
	return (
		<b>
			<TextCA colorAttr={current}>Pw:{current.value}</TextCA>
			<TextCA colorAttr={total}>({total.value})</TextCA>
		</b>
	);
};

const Xp = ({ status }: { status: Status }) => {
	const xpValue = status.values["BL_XP"];
	const expValue = flags().showexp ? status.values["BL_EXP"] : null;
	if (!xpValue) {
		return null;
	}

	return (
		<span>
			Xp:
			<TextCA colorAttr={xpValue}>{xpValue.value}</TextCA>
			{expValue && "/"}
			{expValue && <TextCA colorAttr={expValue}>{expValue.value}</TextCA>}
		</span>
	);
};

const Stat = ({
	name = "",
	value,
}: {
	name?: string;
	value: { value: string; color: Color; attr: string } | undefined;
}) => {
	if (!value || !value.value.trim()) {
		return null;
	}
	return (
		<span>
			{name}
			<TextCA colorAttr={value}>{value.value.trim()}</TextCA>
		</span>
	);
};

const TitleText = ({}: {}) => {
	return (
	<div className="prompt blocking">
		<div className="line">
			<input
				className="chname extcmd"
				type="text"
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="none"
				spellCheck="false"
				autoFocus
				defaultValue={(typeof localStorage !== 'undefined' ? localStorage["NetHack_Name"] : "")}
				onKeyDown={(e) => {
					e.stopPropagation();
				}}
				/>
		</div>
	</div>
	);
};

export const StatusWindow = ({ status }: { status: Status }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const expandOpt = (): void => {
		setIsExpanded(!isExpanded);
		if (isExpanded && (typeof localStorage !== 'undefined')) {
			const newNameEl = document.querySelector('.chname') as HTMLInputElement;
			localStorage["NetHack_Name"]= newNameEl.value;
		}
	};
	
	return (
		<div className="status">
			{status.displayed && (
				<>
					{isExpanded && <TitleText/>}
					<Title onClick={expandOpt} status={status} />
					<Stat name="St:" value={status.values["BL_STR"]} />
					<Stat name="Dx:" value={status.values["BL_DX"]} />
					<Stat name="Co:" value={status.values["BL_CO"]} />
					<Stat name="In:" value={status.values["BL_IN"]} />
					<Stat name="Wi:" value={status.values["BL_WI"]} />
					<Stat name="Ch:" value={status.values["BL_CH"]} />
					<Stat value={status.values["BL_ALIGN"]} />
					<Stat value={status.values["BL_LEVELDESC"]} />
					<Gold status={status} />
					<HP status={status} />
					<Pw status={status} />
					<Stat name="AC:" value={status.values["BL_AC"]} />
					<Xp status={status} />
					{flags().time && (
						<Stat name="T:" value={status.values["BL_TIME"]} />
					)}
					<Stat value={status.values["BL_HUNGER"]} />
					<Stat value={status.values["BL_CAP"]} />
					<Conditions conditions={status.conditions} />
				</>
			)}
		</div>
	);
};
