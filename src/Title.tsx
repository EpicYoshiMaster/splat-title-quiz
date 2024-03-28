import React, { memo, useCallback } from "react";
import { NamedTitle, CurrentSelection, HintTitleProps, RevealTitleProps } from "./types";
import { useLongPress } from "use-long-press";
import styled from "styled-components";
import { FREE_CHARACTERS } from "./types";

interface TitleProps {
    title: NamedTitle;
    index: number;
    selected: boolean;
    setCurrentSelection: React.Dispatch<React.SetStateAction<CurrentSelection>>;
    previousFoundTitle: NamedTitle | undefined;
    nextFoundTitle: NamedTitle | undefined;
    hintTitle: HintTitleProps;
    revealTitle: RevealTitleProps;
}

export const Title: React.FC<TitleProps> = memo(function Title({title, index, selected, setCurrentSelection, previousFoundTitle, nextFoundTitle, hintTitle, revealTitle}) {
    const callback = useCallback(() => {
        
        if(title.found) {
            setCurrentSelection({ index, transitionTime: 2 });
            return;
        }

        revealTitle(title, index);
    }, [title, index, revealTitle, setCurrentSelection]);

    const doLongPress = useLongPress(callback, {
		onCancel: (event, meta) => {
            if(meta.reason && meta.reason === "cancelled-outside-element") return;

            if(title.found) {
                setCurrentSelection({ index, transitionTime: 2 });
                return;
            }

            hintTitle(title, index, previousFoundTitle, nextFoundTitle);
        },
		cancelOutsideElement: true
	});

    const getDisplayTitle = () => {
        if(title.found) return title.title;

        if(title.hinted) {
            let hintedTitle = "";

            for(let i = 0; i < title.title.length; i++) {
                if(i <= title.lastHintedIndex) {
                    hintedTitle += title.title[i];
                }
                else {
                    if(FREE_CHARACTERS.includes(title.title[i])) {
                        hintedTitle += title.title[i];
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
    };

    return (
        <TitleEntry
			$selected={selected}
			{...doLongPress()}
            >
				{getDisplayTitle()}
		</TitleEntry>
    )
});

const TitleEntry = styled.div<{ $selected: boolean}>`
	cursor: pointer;
	height: 2em;

	color: ${props => props.$selected ? '#ffffff' : '#afb1b0'};

	transition: color 0.1s linear;
`;