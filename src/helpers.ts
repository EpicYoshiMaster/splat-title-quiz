import { NamedTitle } from "./types";
import { FREE_CHARACTERS } from "./types";

/**
 * Sorts titles a and b, returns -1 if a is earlier, 1 if a is later, and 0 if they are the same.
 */
export const sortNoCase = (a: string, b: string) => {
	const nameA = a.toLowerCase();
	const nameB = b.toLowerCase();

	if (nameA < nameB) {
		return -1;
	}

	if (nameA > nameB) {
		return 1;
	}

	// names must be equal
	return 0;
}

/**
 * Normalizes a title to compare it
 */
export const titleNormalize = (title: string) => {
    title = title.toLowerCase();
    title = title.replace("\u2013", "-");
    title = title.replace("\u03c9", "w");

	//Ensure mobile devices entering quote symbols are normalized
	title = title.replace("\u2018", "'");
	title = title.replace("\u2019", "'");
	title = title.replace("`", "'");

    return title;
}

/**
 * Determines if two titles "match"
 */
export const titleMatch = (a: string, b: string) => {
    const titleA = titleNormalize(a);
    const titleB = titleNormalize(b);

    return titleA === titleB;
}

/**
 * Determines the next hint state to set for a title, based on its previous and next found titles
 */
export const getNextHintState = (hintedTitle: NamedTitle, prev?: NamedTitle, next?: NamedTitle) => {
	hintedTitle.hinted = true;

	let i = hintedTitle.lastHintedIndex + 1;

	while(i < hintedTitle.title.length) {
		//if the character is trivial (by surrounding titles), increment the hint amount for free
		//if the character is a space, increment the hint amount for free
		//if the character is neither, this is the last new hint, leave

		let isTrivial = true;

		if(!prev || !next) {
			isTrivial = false;
		}

		if(prev && (i >= prev.title.length || prev.title[i] !== hintedTitle.title[i])) {
			isTrivial = false;
		}

		if(next && (i >= next.title.length || next.title[i] !== hintedTitle.title[i])) {
			isTrivial = false;
		}

		if(isTrivial || FREE_CHARACTERS.includes(hintedTitle.title[i])) {
			i += 1;
			continue;
		}
			
		break;
	}

	hintedTitle.lastHintedIndex = i;

	if(hintedTitle.lastHintedIndex >= hintedTitle.title.length) {
		hintedTitle.found = true;
	}

	return hintedTitle;
}

/**
 * Finds the prior and next found titles from this one, if they exist
 */
export const getSurroundingTitles = (index: number, titles: NamedTitle[], predicate: (value: NamedTitle, index: number, obj: NamedTitle[]) => unknown) => {
	const prev = titles.slice(0, index).reverse().find(predicate);
	const next = titles.slice(index + 1).find(predicate);

	return { prev, next };
};

/**
 * Finds a random title that meets the specified predicate
 */
export const getRandomTitle = (
	predicate: (value: NamedTitle, index: number, array: NamedTitle[]) => unknown,
	titles: NamedTitle[]
) => {

	const randomTitles = titles.filter(predicate);

	if(randomTitles.length <= 0) return undefined;

	const title = randomTitles[randRange(0, randomTitles.length - 1)];
	const index = titles.indexOf(title);

	return { title, index };
}

/**
 * Formats a time in seconds to HH:MM:SS
 */
export const formatTime = (time: number) => {
    time = Math.floor(time / 1000);
    const hours = Math.floor(time / 3600);
    time %= 3600;
    const minutes = Math.floor(time / 60);
    time %= 60;
    const seconds = time;

    return `${hours}:${minutes < 10 ? `0` + minutes : minutes}:${seconds < 10 ? `0` + seconds : seconds}`;
}

/**
 * Random Integer between min and max (inclusive)
 */
export const randRange = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculates the clamp values for given pixel locks
 */
export const calcClampPx = (min: number, max: number, minSize: number, maxSize: number, unit?: string, flexunit?: string) => {
	const slope = (max - min) / (maxSize - minSize);
	const intercept = (-1 * minSize) * slope + min;

	if(!unit) {
		unit = "px";
	}

	if(!flexunit) {
		flexunit = "vw";
	}

	return `clamp(${min}${unit}, ${intercept.toFixed(4)}${unit} + ${(slope * 100).toFixed(4)}${flexunit}, ${max}${unit})`;
}

/**
 * Calculates the clamp values for given pixel locks (in rem)
 */
export const calcClampRem = (min: number, max: number, minSize: number, maxSize: number, rem: number, flexunit?: string) => {
	return calcClampPx(min, max, minSize / rem, maxSize / rem, "rem", flexunit);
}