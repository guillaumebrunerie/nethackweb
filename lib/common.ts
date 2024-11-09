export const parseBitMask = <T extends string>(
	value: number,
	mask: { [key: number]: T },
) => {
	const result: T[] = [];
	for (const [key, name] of Object.entries(mask)) {
		if (isNaN(Number(key))) {
			continue;
		}
		if (value & Number(key)) {
			result.push(name);
		}
	}
	return result;
};

export const readString = (ptr: number): string | undefined => {
	const ptrValue = getValue(ptr, "*");
	if (ptrValue === 0) {
		return;
	} else {
		return UTF8ToString(ptrValue);
	}
};
