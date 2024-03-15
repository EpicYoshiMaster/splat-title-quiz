import React, { useState, useRef, useEffect, useMemo } from 'react';
import Data from './titles.json'
import styled from 'styled-components';
import { sortNoCase, formatTime, randRange } from './helpers';

const FREE_CHARACTERS = [" ", "-", "\u2013", "'"];

interface NamedTitle {
	title: string;
	found: boolean;
	hinted: boolean;
	lastHintedIndex: number;
	revealed: boolean;
}

interface CurrentSelection {
	index: number;
	transitionTime: number;
}

//TODO:
// - Make Start Screen and Results Screen
// - Look into focus-based arrow keys
// - Make proper credits section!
// - Add sounds

const adjectiveList = Data.Adjective.sort(sortNoCase);
const subjectList = Data.Subject.sort(sortNoCase);

function App() {

	const [ adjectives, setAdjectives ] = useState<NamedTitle[]>(adjectiveList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false}}));
	const [ subjects, setSubjects ] = useState<NamedTitle[]>(subjectList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false}}));
	const [ adjectiveInput, setAdjectiveInput] = useState("");
	const [ subjectInput, setSubjectInput] = useState("");

	const [ isRunning, setIsRunning ] = useState(false);
	const [ timeState, setTimer ] = useState({ time: 0, startTime: Date.now()});
	const interval = useRef<number | null>(null);

	const [ currentAdjective, setCurrentAdjective ] = useState<CurrentSelection>({ index: 0, transitionTime: 0});
	const [ currentSubject, setCurrentSubject ] = useState<CurrentSelection>({ index: 0, transitionTime: 0});
	
	const [ numHints, setNumHints ] = useState(0);
	const [ numReveals, setNumReveals ] = useState(0);

	const [ gaveUp, setGaveUp ] = useState(false);
	const [ gameFinished, setGameFinished ] = useState(false);

	const updateTime = () => {
		setTimer(prevState => (
			{
			time: prevState.time + (Date.now() - prevState.startTime),
			startTime: Date.now()
		}));
	}

	const numAdjectives = useMemo(() => {
		return adjectives.filter((item) => item.found).length;
	}, [adjectives])

	const hasStartedAdjectives = useMemo(() => {
		return adjectives.some((item) => { return item.found || item.hinted});
	}, [adjectives]);

	const numSubjects = useMemo(() => {
		return subjects.filter((item) => item.found).length;
	}, [subjects]);

	const hasStartedSubjects = useMemo(() => {
		return subjects.some((item) => { return item.found || item.hinted});
	}, [subjects]);

	useEffect(() => {
		if(isRunning && !interval.current) {
			setTimer(prevState => ({ ...prevState, startTime: Date.now()}));
			interval.current = window.setInterval(updateTime, 100);
		}
		else if(!isRunning && interval.current) {
			clearInterval(interval.current);
			interval.current = null;
		}

		return () => {
			if(!interval.current) return;

			clearInterval(interval.current);
			interval.current = null;
		}

	}, [isRunning]);

	useEffect(() => {
		if(!gameFinished && numAdjectives >= adjectives.length && numSubjects >= subjects.length) {
			setGameFinished(true);
		}
	}, [numAdjectives, numSubjects]);

	const setTitleValue = (
		newValue: NamedTitle,
		titleIndex: number,
		values: NamedTitle[],
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>,
		transitionTime?: number
	) => {
		const newValues = values.map((item, index) => { return (titleIndex === index) ? newValue : item; });

		setValues(newValues);
		setCurrentItem({ index: titleIndex, transitionTime: transitionTime ? transitionTime : 2});
	}

	const onClickTitle = (
		isCtrl: boolean, 
		isShift: boolean, 
		title: NamedTitle, 
		index: number, 
		values: NamedTitle[],
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {

		if(isCtrl) {
			doReveal(title, index, values, setValues, setCurrentItem);
			return;
		}

		if(isShift) {
			return;
		}

		doHint(title, index, values, setValues, setCurrentItem);
	}

	const onPressHint = () => {
		const randomAdjective = getRandomTitle((item) => !item.found, adjectives);

		if(randomAdjective) {
			doHint(randomAdjective.title, randomAdjective.index, adjectives, setAdjectives, setCurrentAdjective);
		}

		const randomSubject = getRandomTitle((item) => !item.found, subjects);

		if(randomSubject) {
			doHint(randomSubject.title, randomSubject.index, subjects, setSubjects, setCurrentSubject);
		}
	}

	const onPressReveal = () => {
		const randomAdjective = getRandomTitle((item) => !item.found, adjectives);

		if(randomAdjective) {
			doReveal(randomAdjective.title, randomAdjective.index, adjectives, setAdjectives, setCurrentAdjective);
		}

		const randomSubject = getRandomTitle((item) => !item.found, subjects);

		if(randomSubject) {
			doReveal(randomSubject.title, randomSubject.index, subjects, setSubjects, setCurrentSubject);
		}
	}

	//Get a random title which meets a specified predicate
	const getRandomTitle = (
		predicate: (value: NamedTitle, index: number, array: NamedTitle[]) => unknown,
		values: NamedTitle[]
	) => {

		const unfoundTitles = values.filter(predicate);

		if(unfoundTitles.length <= 0) return undefined;
	
		const title = unfoundTitles[randRange(0, unfoundTitles.length - 1)];
		const index = values.indexOf(title);

		return { title, index };
	}

	const doHint = (
		hintedTitle: NamedTitle,
		titleIndex: number,
		values: NamedTitle[], 
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {

		if(hintedTitle.found) return;

		//get previous and next found titles if the exist
		const previousFoundTitle = values.slice(0, titleIndex).reverse().find((item: NamedTitle) => item.found);
		const nextFoundTitle = values.slice(titleIndex + 1).find((item: NamedTitle) => item.found);

		hintedTitle.hinted = true;

		let i = hintedTitle.lastHintedIndex + 1;

		while(i < hintedTitle.title.length) {
			//if the character is trivial (by surrounding titles), increment the hint amount for free
			//if the character is a space, increment the hint amount for free
			//if the character is neither, this is the last new hint, leave

			let isTrivial = true;

			if(!previousFoundTitle || !nextFoundTitle) {
				isTrivial = false;
			}

			if(previousFoundTitle && (i >= previousFoundTitle.title.length || previousFoundTitle.title[i] !== hintedTitle.title[i])) {
				isTrivial = false;
			}

			if(nextFoundTitle && (i >= nextFoundTitle.title.length || nextFoundTitle.title[i] !== hintedTitle.title[i])) {
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

		setNumHints(numHints + 1);
		setTitleValue(hintedTitle, titleIndex, values, setValues, setCurrentItem);
	}

	const doReveal = (
		hintedTitle: NamedTitle,
		titleIndex: number,
		values: NamedTitle[], 
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {

		if(hintedTitle.found) return;

		hintedTitle.found = true;

		setNumReveals(numReveals + 1);
		setTitleValue(hintedTitle, titleIndex, values, setValues, setCurrentItem);
	}

	const onPressReset = () => {
		setAdjectives(adjectiveList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false}}));
		setSubjects(subjectList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false}}));

		setCurrentAdjective({ index: 0, transitionTime: 0});
		setCurrentSubject({ index: 0, transitionTime: 0});
		setIsRunning(false);
		setGameFinished(false);
		setGaveUp(false);
		setTimer(prevState => ({ time: 0, startTime: Date.now()}));
	}

	const onPressGiveUp = () => {
		setAdjectives(adjectives.map((item) => { return { ...item, found: true}}));
		setSubjects(subjects.map((item) => { return {...item, found: true}}));

		setGaveUp(true);
	}

	const titleNormalize = (title: string) => {
		title = title.toLowerCase();
		title = title.replace("\u2013", "-");
		title = title.replace("\u03c9", "w");

		return title;
	}

	const titleMatch = (a: string, b: string) => {
		const titleA = titleNormalize(a);
		const titleB = titleNormalize(b);

		return titleA === titleB;
	}

	const translateNumItems = (numItems: number, currentValue: CurrentSelection, values: NamedTitle[], setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {
		setCurrentItem({ index: Math.max(Math.min(currentValue.index + numItems, values.length - 1), 0), transitionTime: 0.1 });
	};

	const updateKey = (key: string, currentValue: CurrentSelection, values: NamedTitle[], setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {
		switch(key) {
			case "ArrowUp":
				translateNumItems(-1, currentValue, values, setCurrentItem);
				break;
			case "ArrowRight":
				translateNumItems(10, currentValue, values, setCurrentItem);
				break;
			case "ArrowDown":
				translateNumItems(1, currentValue, values, setCurrentItem);
				break;
			case "ArrowLeft":
				translateNumItems(-10, currentValue, values, setCurrentItem);
				break;
		}
	}

	const checkInput = (
		text: string, 
		values: NamedTitle[], 
		currentValue: CurrentSelection,
		setTextInput: React.Dispatch<React.SetStateAction<string>>, 
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {
			
		setTextInput(text);

		const match = values.find((item) => { return titleMatch(item.title, text) });

		if(!match || match.found) return;

		const matchIndex = values.indexOf(match);

		setTextInput("");
		setIsRunning(true);
		setTitleValue({ ...match, found: true }, matchIndex, values, setValues, setCurrentItem);
	}

	const renderTitle = (
		item: NamedTitle, 
		index: number, 
		values: NamedTitle[], 
		currentValue: CurrentSelection,
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>) => {
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
			$selected={index === currentValue.index}
			key={index} 
			onClick={(event) => { onClickTitle(event.ctrlKey, event.shiftKey, item, index, values, setValues, setCurrentItem); }}>
				{getDisplayTitle(item)}
			</TitleEntry>
		)
	};

  return (
	<Background>
		<Content>
			<TopRow>
				<TopRowItem as="button" onClick={() => { onPressHint(); }}>Random Hint</TopRowItem>
				<TopRowItem as="button" onClick={() => { onPressReveal(); }}>Random Reveal</TopRowItem>
				<TopRowItem as="button" onClick={() => { onPressReset(); }}>Reset</TopRowItem>
				<TopRowItem as="button" onClick={() => { onPressGiveUp(); }}>Give Up</TopRowItem>
				<TimeDisplay>
					Time: {formatTime(timeState.time)}
				</TimeDisplay>
			</TopRow>
			<TextBox>
				<AdjectiveText>Adjectives ({`${numAdjectives}/${adjectives.length}`})</AdjectiveText>
				<TitleInput type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, adjectives, currentAdjective, setAdjectiveInput, setAdjectives, setCurrentAdjective); }} />
				<TitleInput type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, subjects, currentSubject, setSubjectInput, setSubjects, setCurrentSubject); }} />
				<SubjectText>Subjects ({`${numSubjects}/${subjects.length}`})</SubjectText>
			</TextBox>
			<Container>
				<TitleList 
					tabIndex={0}
					onKeyDown={(event) => { if(numAdjectives <= 0) return; updateKey(event.key, currentAdjective, adjectives, setCurrentAdjective) }} 
					onWheel={(event) => { if(numAdjectives <= 0) return; translateNumItems(event.deltaY > 0 ? 1 : -1, currentAdjective, adjectives, setCurrentAdjective)}}>

					<ReelBackground />
					<Reel style={{ top: `${-currentAdjective.index * 2}em`}} $transitionTime={currentAdjective.transitionTime}>
						
					{
						!hasStartedAdjectives && (
							<div>Enter your first adjective above!</div>
						)
					}
					{
						hasStartedAdjectives && adjectives.map((item, index, array) => { return renderTitle(item, index, array, currentAdjective, setAdjectives, setCurrentAdjective); })
					}
						
					</Reel>
				</TitleList>
				<CenterBar>
					<CenterBarReel />
				</CenterBar>
				<TitleListRight 
					tabIndex={0}
					onKeyDown={(event) => { if(numSubjects <= 0) return; updateKey(event.key, currentSubject, subjects, setCurrentSubject) }} 
					onWheel={(event) => { if(numSubjects <= 0) return; translateNumItems(event.deltaY > 0 ? 1 : -1, currentSubject, subjects, setCurrentSubject)}}>

					<ReelBackground />
					<ReelRight style={{ top: `${-currentSubject.index * 2}em`}} $transitionTime={currentSubject.transitionTime}>
					{
						!hasStartedSubjects && (
							<div>Enter your first subject above!</div>
						)
					}
					{
						hasStartedSubjects && subjects.map((item, index, array) => { return renderTitle(item, index, array, currentSubject, setSubjects, setCurrentSubject); })
					}
					</ReelRight>
				</TitleListRight>
			</Container>
			<div>
				Click a title to get a hint, or Ctrl + Click a title to reveal it.
			</div>
			<div>You can navigate using the scroll wheel or arrow keys, press left or right to move in increments of 10 titles.</div>
			<div>
				Created by EpicYoshiMaster
			</div>
		</Content>
	</Background>
	
  );
}

export default App;

const Background = styled.div`
	position: relative;
	width: 100vw;
	height: 100vh;

	background-color: #000000;
	background-size: 30%;
	background-image: url('./camo-black.png');

	overflow: hidden;
`;

const Content = styled.div`
	position: relative;
	height: 100%;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	
	color: #ffffff;
	font-size: 25px;
`;

const TopRow = styled.div`
	display: flex;
	flex-direction: row;
`

const TopRowItem = styled.div`
	margin: 10px;
	padding: 10px;
	font-family: Splatoon;
	font-size: 25px;
	border-radius: 0.5rem;

	color: #ffffff;
	background-color: #4c4c4c;
`

const TimeDisplay = styled(TopRowItem)`
`;

const AdjectiveText = styled.div`
	margin: 0 20px;
`

const SubjectText = styled(AdjectiveText)`
`

const TitleInput = styled.input`
	font-family: Splatoon;
	font-size: 25px;
	margin: 0 10px;
`;

const TextBox = styled.div`
	margin: 20px;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
`;

const Container = styled.div`
	position: relative;
	//min-height: 0;
	height: 100%;
	display: grid;
	margin: 20px;
	border-radius: 1rem;
	grid-template-columns: 1fr max-content 1fr;

	font-size: 35px;

	//background: linear-gradient(#1b1b1b, #4c4c4c, #1b1b1b);
	background-color: #4c4c4c;

	overflow: hidden;
`;

const TitleList = styled.div`
	position: relative;
	width: 100%;
	///height: 10em;
	padding-left: 50px;
	//overflow: auto;

	display: flex;
	align-items: center;

	font-size: 35px;
`;

const TitleListRight = styled(TitleList)`
	padding-left: 0;
	padding-right: 50px;
`

const Reel = styled.div<{ $transitionTime: number}>`
	position: relative;
	padding: 0 20px 0 100px;
	//padding-right: 20px;
	
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: top;
	font-size: 35px;

	height: 2em;
	width: 100%;

	transition: top ${props => props.$transitionTime}s cubic-bezier(0.87, 0, 0.13, 1);
`;

const ReelBackground = styled.div`
	position: absolute;
	//padding: 0 20px 0 50px;
	//padding-right: 20px;
	height: 2em;
	width: calc(100% - 50px);
	background-color: #282828;
`

const ReelRight = styled(Reel)`
	padding: 0 100px 0 20px;
	align-items: flex-start;
	//padding-right: 0;
	//padding-left: 20px;
`

const CenterBar = styled.div`
	height: 100%;
	width: 20px;

	display: flex;
	align-items: center;

	background-color: #797979;
`;

const CenterBarReel = styled.div`
	height: 2em;
	width: 100%;
	background-color: #282828;
`

const TitleEntry = styled.div<{ $selected: boolean}>`
	cursor: pointer;

	color: ${props => props.$selected ? '#ffffff' : '#afb1b0'};

	transition: color 0.1s linear;
`;