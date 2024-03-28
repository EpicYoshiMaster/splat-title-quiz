export interface NamedTitle {
	title: string;
	found: boolean;
	hinted: boolean;
	lastHintedIndex: number;
	revealed: boolean;
}

export interface CurrentSelection {
	index: number;
	transitionTime: number;
}

export type DoHintProps = (hintedTitle: NamedTitle, titleIndex: number, previousFoundTitle: NamedTitle | undefined, nextFoundTitle: NamedTitle | undefined, isLeftSide: boolean) => void;

export type DoRevealProps = (
    hintedTitle: NamedTitle,
	titleIndex: number,
    isLeftSide: boolean) => void;

export type HintTitleProps = (title: NamedTitle, index: number, prevFoundTitle: NamedTitle | undefined, nextFoundTitle: NamedTitle | undefined) => void;
export type RevealTitleProps = (title: NamedTitle, index: number) => void;

export const FREE_CHARACTERS = [" ", "-", "\u2013", "'"];