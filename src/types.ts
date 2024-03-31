export interface NamedTitle {
	title: string;
	found: boolean;
	hinted: boolean;
	lastHintedIndex: number;
	revealed: boolean;
	gaveUp: boolean;
}

export interface CurrentSelection {
	index: number;
	transitionTime: number;
}

export interface TimeState {
	time: number;
	startTime: number;
}

export type DoHintProps = (hintedTitle: NamedTitle, titleIndex: number, isLeftSide: boolean) => void;

export type DoRevealProps = (
    hintedTitle: NamedTitle,
	titleIndex: number,
    isLeftSide: boolean) => void;

export type HintTitleProps = (title: NamedTitle, index: number) => void;
export type RevealTitleProps = (title: NamedTitle, index: number) => void;

export const FREE_CHARACTERS = [" ", "-", "\u2013", "'", "\u2018", "\u2019"];