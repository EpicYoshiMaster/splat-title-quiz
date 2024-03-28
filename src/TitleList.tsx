import React, { useMemo, memo, useCallback } from 'react'
import styled from 'styled-components';
import { calcClampPx, getSurroundingTitles} from './helpers';
import { NamedTitle, CurrentSelection, DoHintProps, DoRevealProps, HintTitleProps, RevealTitleProps } from './types';
import { Title } from './Title';

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

export const TitleList: React.FC<TitleListProps> = memo(function TitleList({titles, setTitles, currentSelection, setCurrentSelection, doHint, doReveal, noTitlesMessage, isLeftSide}) {

    const hasStartedTitles = useMemo(() => {
		return titles.some((item) => { return item.found || item.hinted});
	}, [titles]);

    const translateNumItems = useCallback((numItems: number) => {
		setCurrentSelection({ index: Math.max(Math.min(currentSelection.index + numItems, titles.length - 1), 0), transitionTime: 0.1 });
	}, [currentSelection, setCurrentSelection, titles.length]);

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

    const hintTitle: HintTitleProps = useCallback((title, index, prevFoundTitle, nextFoundTitle) => {
        doHint(title, index, prevFoundTitle, nextFoundTitle, isLeftSide);
    }, [doHint, isLeftSide]);

    const revealTitle: RevealTitleProps = useCallback((title, index) => {
        doReveal(title, index, isLeftSide);
    }, [doReveal, isLeftSide]);

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
						hasStartedTitles && titles.map((item, index, array) => {

							const { prev, next } = getSurroundingTitles(item, index, array);

                            return <Title 
                                key={index}
                                title={item} 
                                index={index}
                                selected={currentSelection.index === index}
                                setCurrentSelection={setCurrentSelection}
                                hintTitle={hintTitle}
                                revealTitle={revealTitle}
								previousFoundTitle={prev}
								nextFoundTitle={next}
                                />;
                        })
					}
				</TitleEntries>
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