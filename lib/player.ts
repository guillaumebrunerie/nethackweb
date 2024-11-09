import { parseBitMask, readString } from "./common";

const readArray = <T>(
	ptr: number,
	reader: (ptr: number) => T | undefined,
	offset: number,
): T[] => {
	const array: T[] = [];
	while (true) {
		const item = reader(ptr);
		if (item === undefined) {
			break;
		}
		array.push(item);
		ptr += offset;
	}
	return array;
};

/** Roles */

type Role = {
	name: string;
	nameFemale?: string;
	allowedRaces: string[];
	allowedGenders: string[];
	allowedAlignments: string[];
};

const readRole = (ptr: number): Role | undefined => {
	const name = readString(ptr);
	if (!name) {
		return;
	}
	const nameFemale = readString(ptr + 4);
	const allowBitMask = getValue(ptr + 122, "i16");

	return {
		name,
		nameFemale,
		allowedRaces: parseBitMask(
			allowBitMask,
			nethackGlobal.constants.ROLE_RACEMASK,
		),
		allowedGenders: parseBitMask(
			allowBitMask,
			nethackGlobal.constants.ROLE_GENDMASK,
		),
		allowedAlignments: parseBitMask(
			allowBitMask,
			nethackGlobal.constants.ROLE_ALIGNMASK,
		),
	};
};

export const readRoles = (ptr: number): Role[] => readArray(ptr, readRole, 204);

/** Races */

type Race = {
	id: string;
	name: string;
	allowedGenders: string[];
	allowedAlignments: string[];
};

const readRace = (ptr: number): Race | undefined => {
	const name = readString(ptr);
	if (!name) {
		return;
	}
	const allowBitMask = getValue(ptr + 30, "i16");
	const selfMask = getValue(ptr + 32, "i16");

	return {
		id: nethackGlobal.constants.ROLE_RACEMASK[selfMask],
		name,
		allowedGenders: parseBitMask(
			allowBitMask,
			nethackGlobal.constants.ROLE_GENDMASK,
		),
		allowedAlignments: parseBitMask(
			allowBitMask,
			nethackGlobal.constants.ROLE_ALIGNMASK,
		),
	};
};

export const readRaces = (ptr: number): Race[] => readArray(ptr, readRace, 88);

/** Genders */

type Gender = {
	id: string;
	name: string;
};

const readGender = (ptr: number): Gender | undefined => {
	const name = readString(ptr);
	if (!name) {
		return;
	}
	const selfMask = getValue(ptr + 20, "i16");
	if (selfMask === 0) {
		return;
	}

	return {
		id: nethackGlobal.constants.ROLE_GENDMASK[selfMask],
		name,
	};
};

export const readGenders = (ptr: number): Gender[] =>
	readArray(ptr, readGender, 24);

/** Alignments */

type Align = {
	id: string;
	name: string;
};

const readAlign = (ptr: number): Align | undefined => {
	const name = readString(ptr + 4);
	if (!name) {
		return;
	}
	const selfMask = getValue(ptr + 12, "i16");
	if (selfMask === 0) {
		return;
	}

	return {
		id: nethackGlobal.constants.ROLE_ALIGNMASK[selfMask],
		name,
	};
};

export const readAligns = (ptr: number): Gender[] =>
	readArray(ptr, readAlign, 16);
