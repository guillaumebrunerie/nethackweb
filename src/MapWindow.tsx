import { decodeCP437 } from "./cp437";
import { Glyph, NHMapWindow } from "./nethack";
import { Text } from "./Common";
import { Attr, iflags } from "../lib/nethackInterface";
import { memo, useLayoutEffect, useRef } from "react";
import { useOnInput } from "./useNethack";

const GlyphC = memo(
	({
		x,
		y,
		glyph,
		isCursor,
		isCliparound,
		isNumLock,
	}: {
		x: number;
		y: number;
		glyph: Glyph;
		isCursor: boolean;
		isCliparound: boolean;
		isNumLock: boolean;
	}) => {
		const ref = useRef<HTMLDivElement>(null);
		useLayoutEffect(() => {
			if (!ref.current || !isCliparound) {
				return;
			}
			ref.current.scrollIntoView({
				behavior: "instant",
				block: "center",
				inline: "center",
			});
		}, [x, y, isCliparound]);

		const onInput = useOnInput();
		const attrs: Attr[] = [];
		if (isCursor) {
			attrs.push("ATR_BLINK");
		}
		if (glyph.isChar) {
			return (
				<Text
					className="cell"
					color="CLR_WHITE"
					attrs={[...attrs, glyph.attr]}
					ref_={ref}
				>
					{glyph.char || "\xa0"}
				</Text>
			);
		} else {
			const glyphflags = glyph.glyphinfo.gm.glyphflags;
			if (iflags().wc_hilite_pet && glyphflags.includes("MG_PET")) {
				attrs.push("ATR_INVERSE");
			}
			if (iflags().hilite_pile && glyphflags.includes("MG_OBJPILE")) {
				attrs.push("ATR_INVERSE");
			}
			return (
				<Text
					className="cell clickable"
					color={glyph.glyphinfo.gm.sym.color}
					attrs={attrs}
					onClick={() => {
						onInput({ x, y, mod: isNumLock ? 2 : 1 });
					}}
					ref_={ref}
				>
					{decodeCP437(glyph.glyphinfo.ttychar)}
				</Text>
			);
		}
	},
);

const Row = memo(
	({
		y,
		row,
		cursorX,
		cliparoundX,
		isNumLock,
	}: {
		y: number;
		row: Glyph[];
		cursorX: number | null;
		cliparoundX: number | null;
		isNumLock: boolean;
	}) => {
		return row.map((glyph, x) => (
			<GlyphC
				key={x}
				x={x}
				y={y}
				glyph={glyph}
				isCursor={cursorX === x}
				isCliparound={cliparoundX === x}
				isNumLock={isNumLock}
			/>
		));
	},
);

export const MapWindow = ({
	window_,
	isNumLock,
}: {
	window_?: NHMapWindow;
	isNumLock: boolean;
}) => {
	return (
		<div className={"map" + (window_?.displayed ? " displayed" : "")}>
			{window_?.map.map((row, y) => (
				<Row
					key={y}
					y={y}
					row={row}
					cursorX={
						window_.displayed && window_.cursor.y == y ?
							window_.cursor.x
						:	null
					}
					cliparoundX={
						window_.center.y == y ? window_.center.x : null
					}
					isNumLock={isNumLock}
				/>
			))}
		</div>
	);
};
