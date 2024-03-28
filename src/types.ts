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

export type DoHintProps = (
    hintedTitle: NamedTitle,
    titleIndex: number,
    values: NamedTitle[], 
    setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
    setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => void;

export type DoRevealProps = (
    hintedTitle: NamedTitle,
	titleIndex: number,
	values: NamedTitle[], 
	setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
	setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => void;

export const FREE_CHARACTERS = [" ", "-", "\u2013", "'"];