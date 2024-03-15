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