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

export const formatTime = (time: number) => {
    //HH:MM:SS
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