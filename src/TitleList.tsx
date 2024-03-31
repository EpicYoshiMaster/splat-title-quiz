import React, { useMemo, memo, useCallback } from 'react'
import styled from 'styled-components';
import { calcClampPx, getSurroundingTitles } from './helpers';
import { NamedTitle, CurrentSelection, DoHintProps, DoRevealProps, HintTitleProps, RevealTitleProps } from './types';
import { Title } from './Title';
import { RowItem } from './Layout';

interface TitleListProps {
    titles: NamedTitle[];
    currentSelection: CurrentSelection;
    setCurrentSelection: React.Dispatch<React.SetStateAction<CurrentSelection>>;
    doHint: DoHintProps;
    doReveal: DoRevealProps;
	showResults: boolean;
    startMessages: string[];
	resultMessages: string[];
    isLeftSide: boolean;
}

export const TitleList: React.FC<TitleListProps> = memo(function TitleList({titles, currentSelection, setCurrentSelection, doHint, doReveal, showResults, startMessages, resultMessages, isLeftSide}) {

    const hasStartedTitles = useMemo(() => {
		return titles.some((item) => { return item.found || item.hinted});
	}, [titles]);

	const listLength = useMemo(() => {
		return (!hasStartedTitles) ? startMessages.length : (showResults ? resultMessages.length : titles.length);
	}, [hasStartedTitles, showResults, titles.length, startMessages.length, resultMessages.length])

    const translateNumItems = useCallback((numItems: number) => {
		const index = Math.max(Math.min(currentSelection.index + numItems, listLength - 1), 0);

		setCurrentSelection({ index: index, transitionTime: 2 });
	}, [currentSelection, setCurrentSelection, listLength]);

	const toPreviousUnfoundTitle = useCallback(() => {
		if(!hasStartedTitles || showResults) {
			setCurrentSelection({ index: 0, transitionTime: 2});
			return;
		}

		const { prev } = getSurroundingTitles(currentSelection.index, titles, (title) => !title.found);

		if(prev) {
			const prevIndex = titles.indexOf(prev);

			setCurrentSelection({ index: prevIndex, transitionTime: 2});
		}
		else {
			setCurrentSelection({ index: 0, transitionTime: 2});
		}
	}, [currentSelection, setCurrentSelection, titles, hasStartedTitles, showResults]);

	const toNextUnfoundTitle = useCallback(() => {
		if(!hasStartedTitles || showResults) {
			setCurrentSelection({ index: listLength - 1, transitionTime: 2});
			return;
		}

		const { next } = getSurroundingTitles(currentSelection.index, titles, (title) => !title.found);

		if(next) {
			const nextIndex = titles.indexOf(next);

			setCurrentSelection({ index: nextIndex, transitionTime: 2});
		}
		else {
			setCurrentSelection({ index: listLength - 1, transitionTime: 2});
		}
	}, [currentSelection, setCurrentSelection, titles, listLength, hasStartedTitles, showResults]);

    const updateKey = useCallback((key: string) => {
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
	}, [translateNumItems]);

    const hintTitle: HintTitleProps = useCallback((title, index) => {
        doHint(title, index, isLeftSide);
    }, [doHint, isLeftSide]);

    const revealTitle: RevealTitleProps = useCallback((title, index) => {
        doReveal(title, index, isLeftSide);
    }, [doReveal, isLeftSide]);

    return (
        <TitlePadding 
            $isLeft={isLeftSide}
			tabIndex={0}
			onKeyDown={(event) => { updateKey(event.key); }} 
			onWheel={(event) => { translateNumItems(event.deltaY > 0 ? 1 : -1);}}>
			<TitleColumn>
				<TitleEntryBackground />
				<TitleContent>
					<ButtonRow $isLeft={isLeftSide}>
						<ButtonRowItem as="button" onClick={() => { toPreviousUnfoundTitle(); }}>⇡ ???</ButtonRowItem>
						<ButtonRowItem as="button" onClick={() => { translateNumItems(-10); }}>⇑</ButtonRowItem>
						<ButtonRowItem as="button" onClick={() => { translateNumItems(-1); }}>⇧</ButtonRowItem>
					</ButtonRow>
					<TitleListWrapper>
						<TitleEntries style={{ top: `${-currentSelection.index * 2}em`}} $isLeft={isLeftSide} $transitionTime={currentSelection.transitionTime}>
						{
							!hasStartedTitles && startMessages.map((item, index) => {
								return <Message key={index} $selected={currentSelection.index === index}>
									{item}
								</Message>;
							})
						}
						{
							hasStartedTitles && showResults && resultMessages.map((item, index) => {
								return <Message key={index} $selected={currentSelection.index === index}>
									{item}
								</Message>;
							})
						}
						{
							hasStartedTitles && !showResults && titles.map((item, index, array) => {

                		        return <Title 
                		            key={index}
                		            title={item} 
                		            index={index}
                		            selected={currentSelection.index === index}
                		            setCurrentSelection={setCurrentSelection}
                		            hintTitle={hintTitle}
                		            revealTitle={revealTitle}
                		            />;
                		    })
						}
						</TitleEntries>
					</TitleListWrapper>
					<ButtonRow $isLeft={isLeftSide}>
						<ButtonRowItem as="button" onClick={() => { toNextUnfoundTitle(); }}>⇣ ???</ButtonRowItem>
						<ButtonRowItem as="button" onClick={() => { translateNumItems(10); }}>⇓</ButtonRowItem>
						<ButtonRowItem as="button" onClick={() => { translateNumItems(1); }}>⇩</ButtonRowItem>
					</ButtonRow>
				</TitleContent>
			</TitleColumn>
		</TitlePadding>
    )
});

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
`;

const TitleContent = styled.div`
	position: relative;
	display: grid;
	width: 100%;
	height: 100%;
	grid-template-rows: min-content 1fr min-content;
`;

const ButtonRow = styled.div<{ $isLeft: boolean}>`
	display: flex;
	flex-direction: ${({$isLeft}) => $isLeft ? 'row' : 'row-reverse'};
	justify-content: flex-end;
	align-items: center;
`;

const ButtonRowItem = styled(RowItem)`
	padding: 5px 15px;
	padding: ${calcClampPx(2, 5, 320, 1000)} ${calcClampPx(8, 15, 320, 1000)};
	background-color: #282828;
`;

const TitleListWrapper = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	
	overflow: hidden;
`;

const TitleEntries = styled.div<{ $isLeft: boolean, $transitionTime: number}>`
	position: relative;
	display: flex;
	flex-direction: column;
    ${({$isLeft}) => $isLeft ?  `padding-right:` : `padding-left:`} ${calcClampPx(1, 20, 500, 1200)};
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

const Message = styled.div<{ $selected: boolean }>`
	height: 2em;

	color: ${props => props.$selected ? '#ffffff' : '#afb1b0'};

	transition: color 0.1s linear;
`;