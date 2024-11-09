import { readString } from "./common";

const parseConditionMask = (n: number) => nethackGlobal.constants.BL_MASK[n];

type Condition = {
	ranking: number;
	mask: string;
	text: [string, string, string];
};

const parseCondition = (ptr: number): Condition => {
	return {
		ranking: getValue(ptr, "i32"),
		mask: parseConditionMask(getValue(ptr + 4, "i32")),
		text: [
			readString(ptr + 12) || "-",
			readString(ptr + 16) || "-",
			readString(ptr + 20) || "-",
		],
	};
};

export const parseConditions = (ptr: number): Condition[] => {
	const conditions = [];
	const count = nethackGlobal.constants.blconditions.CONDITION_COUNT;
	for (let i = 0; i < count; i++) {
		conditions.push(parseCondition(ptr + i * 24));
	}
	return conditions;
};
