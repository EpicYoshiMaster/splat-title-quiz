import React, { useState, useRef, useEffect, useMemo } from 'react';
import Data from './titles.json'
import styled from 'styled-components';
import { sortNoCase, formatTime, randRange, calcClampPx, calcClampRem } from './helpers';
import { GithubLogo } from '@phosphor-icons/react'

type EasterEggGradient = {
	title: string;
	gradient: string[];
	useVideo?: boolean;
}

const EASTER_EGGS: EasterEggGradient[] = [
	{title: "If You Want To Go Back To The Default Gradient Maybe You Should Just Reload Instead", gradient: ['#1B1B1B']},
	{title: "Trans Rights", gradient: ['#55cdfd', '#f6aab7', '#ffffff', '#f6aab7', '#55cefd']},
	{title: "Yellow Square", gradient: ['#bfce3e']},
	{title: "Pearlina", gradient: ['#d52800', '#fd9954', '#ffffff', '#d261a3', '#a30061']},
	{title: "Open Season", gradient: ['#66472a', '#442e19', '#66472a', '#472f19', '#46301c', '#66472a', '#944cf8', '#1e1ea5','#1e1ea5', '#944cf8', '#66472a', '#493421', '#66472a']},
	{title: "Trapinch Certified", gradient: ['#f29e77', '#f29e77', '#f29e77', '#f29e77', '#e8ecf2', '#f29e77']},
	{title: "Cheese", gradient: ['#006efd'], useVideo: true}];

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
// - Mobile friendly / final layout design

const adjectiveList = Data.Adjective.sort(sortNoCase);
const subjectList = Data.Subject.sort(sortNoCase);

function App() {

	console.log(calcClampRem(0.6, 2, 320, 1000, 16));

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

	const [ easterEggState, setEasterEggState ] = useState(0);

	const currentGradient = useMemo(() => {

		let gradient = "";

		if(EASTER_EGGS[easterEggState].gradient.length === 1) {
			return EASTER_EGGS[easterEggState].gradient[0] + ", " + EASTER_EGGS[easterEggState].gradient[0];
		}

		for(let i = 0; i < EASTER_EGGS[easterEggState].gradient.length; i++) {
			gradient += EASTER_EGGS[easterEggState].gradient[i];

			if(i < EASTER_EGGS[easterEggState].gradient.length - 1) {
				gradient += ", ";
			}
		}

		return gradient;
	}, [easterEggState]);

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
		if(!gameFinished && numAdjectives >= adjectiveList.length && numSubjects >= subjectList.length) {
			setGameFinished(true);
		}
	}, [numAdjectives, numSubjects, gameFinished]);

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

		// :)
		const eggMatch = EASTER_EGGS.find((item) => { return titleMatch(item.title, text)});

		if(eggMatch) {
			const eggIndex = EASTER_EGGS.indexOf(eggMatch);

			setEasterEggState(eggIndex);

			setTextInput("");
			return;
		}

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
	<>
		<BackBackground $gradient={currentGradient}>
			<SecretVideo autoPlay muted loop $active={EASTER_EGGS[easterEggState].useVideo}>
				<source src="29quintillioncheese.mp4" type="video/mp4" />
			</SecretVideo>
			<Background />
		</BackBackground>
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
			<TitleEntryArea>
				<TitleTextEntryPair>
					<AdjectiveText>Adjectives ({`${numAdjectives}/${adjectives.length}`})</AdjectiveText>
					<TitleInput type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, adjectives, currentAdjective, setAdjectiveInput, setAdjectives, setCurrentAdjective); }} />
				</TitleTextEntryPair>
				<TitleTextEntryPairRight>
					<TitleInput type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, subjects, currentSubject, setSubjectInput, setSubjects, setCurrentSubject); }} />
					<SubjectText>Subjects ({`${numSubjects}/${subjects.length}`})</SubjectText>
				</TitleTextEntryPairRight>
			</TitleEntryArea>
			<Collection>
				<TitlePadding 
					tabIndex={0}
					onKeyDown={(event) => { if(numAdjectives <= 0) return; updateKey(event.key, currentAdjective, adjectives, setCurrentAdjective) }} 
					onWheel={(event) => { if(numAdjectives <= 0) return; translateNumItems(event.deltaY > 0 ? 1 : -1, currentAdjective, adjectives, setCurrentAdjective)}}>
					<TitleColumn>
						<TitleEntryBackground />
						<TitleEntries style={{ top: `${-currentAdjective.index * 2}em`}} $transitionTime={currentAdjective.transitionTime}>
							{
								!hasStartedAdjectives && (
									<div>Enter your first adjective above!</div>
								)
							}
							{
								hasStartedAdjectives && adjectives.map((item, index, array) => { return renderTitle(item, index, array, currentAdjective, setAdjectives, setCurrentAdjective); })
							}
						</TitleEntries>
					</TitleColumn>
				</TitlePadding>
				<CenterBar>
					<CenterBarReel />
				</CenterBar>
				<TitlePaddingRight 
					tabIndex={0}
					onKeyDown={(event) => { if(numSubjects <= 0) return; updateKey(event.key, currentSubject, subjects, setCurrentSubject) }} 
					onWheel={(event) => { if(numSubjects <= 0) return; translateNumItems(event.deltaY > 0 ? 1 : -1, currentSubject, subjects, setCurrentSubject)}}>

					<TitleColumnRight>
						<TitleEntryBackground />
						<TitleEntriesRight style={{ top: `${-currentSubject.index * 2}em`}} $transitionTime={currentSubject.transitionTime}>
						{
							!hasStartedSubjects && (
								<div>Enter your first subject above!</div>
							)
						}
						{
							hasStartedSubjects && subjects.map((item, index, array) => { return renderTitle(item, index, array, currentSubject, setSubjects, setCurrentSubject); })
						}
						</TitleEntriesRight>
					</TitleColumnRight>
				</TitlePaddingRight>
			</Collection>
			<Credits>
				<div>Click or press a title for a hint.</div>
				<div>Ctrl + Click or long press a title to reveal it.</div>
				<div>Created by EpicYoshiMaster!</div>
				<div><a href='https://github.com/EpicYoshiMaster/splat-title-quiz'>View the source here! </a><GithubLogo /></div>
			</Credits>
		</Content>
	</>
  );
}

export default App;

const BackBackground = styled.div<{$gradient: string}>`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;

	background-color: #000000;
	background-image: linear-gradient(${props => props.$gradient});
`;

const SecretVideo = styled.video<{$active?: boolean}>`
	position: absolute;
	width: 100%;
	height: 100%;
	object-fit: fill;

	opacity: ${props => props.$active ? 1 : 0};
	transition: opacity 1s linear;
`;

const Background = styled.div`
	position: relative;
	width: 100%;
	height: 100%;

	background-size: 600px;
	background-image: url('./camo-foreground-black.png');

	overflow: hidden;
`;

const Content = styled.div`
	position: relative;

	display: flex;
	flex-direction: column;
	align-items: center;
	
	color: #ffffff;
`;

//
// First Row
//

const TopRow = styled.div`
	display: flex;
	flex-direction: row;
`;

const TopRowItem = styled.div`
	margin: 5px;
	margin: ${calcClampPx(2, 10, 320, 1000)};

	padding: 5px;
	padding: ${calcClampPx(2, 10, 320, 1000)};

	font-family: Splatoon;
	
	font-size: 1.25rem;
	font-size: ${calcClampRem(0.8, 1.75, 320, 1000, 16)};

	border-radius: 0.5rem;

	text-align: center;

	color: #ffffff;
	background-color: #4c4c4c;
`

const TimeDisplay = styled(TopRowItem)`
`;

//
// Second Row
//

const TitleEntryArea = styled.div`
	margin: 5px 0;

	display: grid;
	grid-template-columns: 1fr 1fr;
`;

const TitleTextEntryPair = styled.div`
	margin: 0 auto;
	display: flex;

	align-items: center;
	justify-content: center;
	flex-direction: column;

	@media screen and (min-width: 1200px) {
		flex-direction: row;
	}
`;

const TitleTextEntryPairRight = styled(TitleTextEntryPair)`
	flex-direction: column-reverse;

	@media screen and (min-width: 1200px) {
		flex-direction: row;
	}
`;

const TitleInput = styled.input`
	width: ${calcClampRem(9, 20, 320, 1000, 16)};
	height: ${calcClampRem(1.6, 3, 320, 1000, 16)};

	font-family: Splatoon;
	font-size: 1.25rem;
	font-size: ${calcClampRem(0.8, 1.75, 320, 1000, 16)};

	margin: 0 ${calcClampPx(5, 10, 400, 1100)};
`;

const AdjectiveText = styled.div`
	font-size: ${calcClampRem(0.8, 1.75, 320, 1000, 16)};
`

const SubjectText = styled(AdjectiveText)`
`

//
// Third Row
//

//Describes the area containing all titles
const Collection = styled.div`
	position: relative;
	width: min(95vw, 80rem);
	height: 35rem;
	height: ${calcClampRem(20, 50, 600, 1200, 16, "vh")};

	display: grid;
	grid-template-columns: 1fr max-content 1fr;

	margin: 10px 0;
	border-radius: 1rem;

	font-size: 1rem;
	font-size: ${calcClampRem(0.6, 2, 320, 1100, 16)};

	background-color: #4c4c4c;

	overflow: hidden;
`;

const TitlePadding = styled.div`
	position: relative;
	height: 100%;
	padding-left: ${calcClampPx(5, 50, 500, 1200)};
`;

const TitlePaddingRight = styled(TitlePadding)`
	padding-left: 0;
	padding-right: ${calcClampPx(5, 50, 500, 1200)};
`;

const TitleColumn = styled.div`
	position: relative;
	height: 100%;
	display: flex;
	align-items: center;
`;

const TitleColumnRight = styled(TitleColumn)`
	
`;

const TitleEntries = styled.div<{ $transitionTime: number}>`
	position: relative;
	padding-right: ${calcClampPx(1, 20, 500, 1200)};
	
	display: flex;
	flex-direction: column;
	align-items: flex-end;

	height: 2em;
	width: 100%;

	transition: top ${props => props.$transitionTime}s cubic-bezier(0.87, 0, 0.13, 1);
`;

const TitleEntriesRight = styled(TitleEntries)`
	padding-right: 0;
	padding-left: ${calcClampPx(1, 20, 500, 1200)};
	align-items: flex-start;
	height: 2em;
`

const TitleEntryBackground = styled.div`
	position: absolute;
	height: 2em;
	width: 100%;
	background-color: #282828;
`

const CenterBar = styled.div`
	position: relative;
	height: 100%;
	width: 15px;
	width: ${calcClampPx(10, 20, 400, 1100)};

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
	height: 2em;

	color: ${props => props.$selected ? '#ffffff' : '#afb1b0'};

	transition: color 0.1s linear;
`;

//
// Credits
//
const Credits = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;

	font-size: ${calcClampRem(1.2, 2, 320, 1100, 16)};
`;