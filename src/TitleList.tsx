import React, { useMemo } from 'react'
import styled from 'styled-components';
import { calcClampPx} from './helpers';
import { NamedTitle, CurrentSelection, FREE_CHARACTERS, DoHintProps, DoRevealProps } from './types';

interface TitleListProps {
    titles: NamedTitle[];
    setTitles: React.Dispatch<React.SetStateAction<NamedTitle[]>>;
    currentSelection: CurrentSelection;
    setCurrentSelection: React.Dispatch<React.SetStateAction<CurrentSelection>>;
    doHint: DoHintProps;
    doReveal: DoRevealProps;
    noTitlesMessage: string;
    isLeftSide: boolean;
}

export const TitleList: React.FC<TitleListProps> = ({titles, setTitles, currentSelection, setCurrentSelection, doHint, doReveal, noTitlesMessage, isLeftSide}) => {
    const hasStartedTitles = useMemo(() => {
		return titles.some((item) => { return item.found || item.hinted});
	}, [titles]);

    const translateNumItems = (numItems: number) => {
		setCurrentSelection({ index: Math.max(Math.min(currentSelection.index + numItems, titles.length - 1), 0), transitionTime: 0.1 });
	};

    const updateKey = (key: string) => {
		switch(key) {
			case "ArrowUp":
				translateNumItems(-1);
				break;
			case "ArrowRight":
				translateNumItems(10);
				break;
			case "ArrowDown":
				translateNumItems(1);
				break;
			case "ArrowLeft":
				translateNumItems(-10);
				break;
		}
	}

    const onClickTitle = (
		isCtrl: boolean, 
		isShift: boolean, 
		title: NamedTitle, 
		index: number) => {

		if(isCtrl) {
			doReveal(title, index, titles, setTitles, setCurrentSelection);
			return;
		}

		if(isShift) {
			return;
		}

		doHint(title, index, titles, setTitles, setCurrentSelection);
	}

    const renderTitle = (
		item: NamedTitle, 
		index: number) => {

		const getDisplayTitle = (item: NamedTitle) => {
			if(item.found) return item.title;
	
			if(item.hinted) {
				let hintedTitle = "";
	
				for(let i = 0; i < item.title.length; i++) {
					if(i <= item.lastHintedIndex) {
						hintedTitle += item.title[i];
					}
					else {
						if(FREE_CHARACTERS.includes(item.title[i])) {
							hintedTitle += item.title[i];
						}
						else {
							hintedTitle += "_";
						}
					}
				}
	
				return hintedTitle;
			}
			else {
				return "???";
			}
		}

		return (
			<TitleEntry
			$selected={index === currentSelection.index}
			key={index}
			//{...doLongPress()}
			onClick={(event) => { onClickTitle(event.ctrlKey, event.shiftKey, item, index); }}>
				{getDisplayTitle(item)}
			</TitleEntry>
		)
	};

    return (
        <TitlePadding 
            $isLeft={isLeftSide}
			tabIndex={0}
			onKeyDown={(event) => { if(!hasStartedTitles) return; updateKey(event.key); }} 
			onWheel={(event) => { if(!hasStartedTitles) return; translateNumItems(event.deltaY > 0 ? 1 : -1);}}>
			<TitleColumn>
				<TitleEntryBackground />
				<TitleEntries style={{ top: `${-currentSelection.index * 2}em`}} $isLeft={isLeftSide} $transitionTime={currentSelection.transitionTime}>
					{
						!hasStartedTitles && (
							<div>{noTitlesMessage}</div>
						)
					}
					{
						hasStartedTitles && titles.map((item, index, array) => { return renderTitle(item, index); })
					}
				</TitleEntries>
			</TitleColumn>
		</TitlePadding>
    )
};


const TitlePadding = styled.div<{ $isLeft: boolean }>`
	position: relative;
	height: 100%;
    ${({$isLeft}) => $isLeft ?  `padding-left:` : `padding-right:`} ${calcClampPx(5, 50, 500, 1200)};
`;

const TitleColumn = styled.div`
	position: relative;
	height: 100%;
	display: flex;
	align-items: center;

	overflow: auto;
`;

const TitleEntries = styled.div<{ $isLeft: boolean, $transitionTime: number}>`
	position: relative;
	display: flex;
	flex-direction: column;
    ${({$isLeft}) => $isLeft ?  `padding-left:` : `padding-right:`} ${calcClampPx(1, 20, 500, 1200)};
	align-items: ${({$isLeft}) => $isLeft ?  `flex-end` : `flex-start`};

	height: 2em;
	width: 100%;

	transition: top ${props => props.$transitionTime}s cubic-bezier(0.87, 0, 0.13, 1);
`;

const TitleEntryBackground = styled.div`
	position: absolute;
	height: 2em;
	width: 100%;
	background-color: #282828;
`;

const TitleEntry = styled.div<{ $selected: boolean}>`
	cursor: pointer;
	height: 2em;

	color: ${props => props.$selected ? '#ffffff' : '#afb1b0'};

	transition: color 0.1s linear;
`;