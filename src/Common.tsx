import { Attr, Color } from "../lib/nethackInterface";
import { decodeColor } from "./colors";
import { useEffect, useState } from "react";

const useBlink = (isBlinking: boolean, delay: number) => {
	const [isOn, setIsOn] = useState(true);
	useEffect(() => {
		if (!isBlinking) {
			return;
		}
		setIsOn(true);
		const timeout = setInterval(() => setIsOn((x) => !x), delay);
		return () => clearTimeout(timeout);
	}, [delay, isBlinking]);
	return isBlinking && isOn;
};

export const Text = ({
	className,
	color,
	attrs,
	children,
	onClick,
	ref_,
}: {
	className?: string;
	color?: Color;
	attrs?: Attr[];
	children: React.ReactNode;
	onClick?: (event: React.MouseEvent) => void;
	ref_?: React.RefObject<HTMLSpanElement>;
}) => {
	const isBlinkOn = useBlink(!!attrs?.includes("ATR_BLINK"), 600);
	const isInverse = attrs?.includes("ATR_INVERSE") || isBlinkOn;
	const fg = color ? decodeColor(color) : "var(--fg)";
	const bg = "var(--bg)";
	const style = {
		fontWeight: attrs?.includes("ATR_BOLD") ? "bold" : undefined,
		fontStyle: attrs?.includes("ATR_ITALIC") ? "italic" : undefined,
		textDecoration: attrs?.includes("ATR_ULINE") ? "underline" : undefined,
		opacity: attrs?.includes("ATR_DIM") ? 0.5 : undefined,
		color: isInverse ? bg : fg,
		backgroundColor: isInverse ? fg : bg,
	};
	return (
		<span className={className} style={style} onClick={onClick} ref={ref_}>
			{children}
		</span>
	);
};

export const TextCA = ({
	className,
	colorAttr,
	children,
}: {
	className?: string;
	colorAttr?: { color: Color; attr: string };
	children: React.ReactNode;
}) => {
	const attr = (
		{
			HL_BOLD: "ATR_BOLD",
			HL_DIM: "ATR_DIM",
			HL_ITALIC: "ATR_ITALIC",
			HL_ULINE: "ATR_ULINE",
			HL_BLINK: "ATR_BLINK",
			HL_INVERSE: "ATR_INVERSE",
		} as const
	)[colorAttr?.attr as string];
	return (
		<Text
			className={className}
			color={colorAttr?.color}
			attrs={attr ? [attr] : []}
		>
			{children}
		</Text>
	);
};
