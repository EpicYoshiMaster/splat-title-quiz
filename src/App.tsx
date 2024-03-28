import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Data from './titles.json'
import styled from 'styled-components';
import { sortNoCase, formatTime, randRange, calcClampPx, calcClampRem, titleMatch, getSurroundingTitles } from './helpers';
import { GithubLogo } from '@phosphor-icons/react'
import { TitleList } from './TitleList';
import { NamedTitle, CurrentSelection, FREE_CHARACTERS, DoHintProps, DoRevealProps } from './types';

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

//TODO:
// - Make Start Screen and Results Screen
// - Look into focus-based arrow keys
// - Make proper credits section!

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

	const numSubjects = useMemo(() => {
		return subjects.filter((item) => item.found).length;
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
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>,
		transitionTime?: number
	) => {
		setValues((values) => {
			return values.map((item, index) => { return (titleIndex === index) ? newValue : item; });
		});
		setCurrentItem({ index: titleIndex, transitionTime: transitionTime ? transitionTime : 2});
	}

	const onPressHint = () => {
		const randomAdjective = getRandomTitle((item) => !item.found, adjectives);

		if(randomAdjective) {
			const { prev, next } = getSurroundingTitles(randomAdjective.title, randomAdjective.index, adjectives);
			doHint(randomAdjective.title, randomAdjective.index, prev, next, true);
		}

		const randomSubject = getRandomTitle((item) => !item.found, subjects);

		if(randomSubject) {
			const { prev, next } = getSurroundingTitles(randomSubject.title, randomSubject.index, adjectives);
			doHint(randomSubject.title, randomSubject.index, prev, next, false);
		}
	}

	const onPressReveal = () => {
		const randomAdjective = getRandomTitle((item) => !item.found, adjectives);

		if(randomAdjective) {
			doReveal(randomAdjective.title, randomAdjective.index, true);
		}

		const randomSubject = getRandomTitle((item) => !item.found, subjects);

		if(randomSubject) {
			doReveal(randomSubject.title, randomSubject.index, false);
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

	const getTitleListSide = useCallback((isLeftSide: boolean) => {
		if(isLeftSide) {
			return { setTitles: setAdjectives, setCurrentSelection: setCurrentAdjective };
		}
		else {
			return { setTitles: setSubjects, setCurrentSelection: setCurrentSubject };
		}
	}, [setAdjectives, setCurrentAdjective, setSubjects, setCurrentSubject]);

	const doHint: DoHintProps = useCallback((hintedTitle, titleIndex, previousFoundTitle, nextFoundTitle, isLeftSide) => {

		const { setTitles, setCurrentSelection } = getTitleListSide(isLeftSide);

		if(hintedTitle.found) return;

		//get previous and next found titles if they exist
		//const previousFoundTitle = titles.slice(0, titleIndex).reverse().find((item: NamedTitle) => item.found);
		//const nextFoundTitle = titles.slice(titleIndex + 1).find((item: NamedTitle) => item.found);

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

		setNumHints(numHints => numHints + 1);
		setTitleValue(hintedTitle, titleIndex, setTitles, setCurrentSelection);
	}, [getTitleListSide]);

	const doReveal: DoRevealProps = useCallback((hintedTitle, titleIndex, isLeftSide) => {
		const { setTitles, setCurrentSelection } = getTitleListSide(isLeftSide);

		if(hintedTitle.found) return;

		hintedTitle.found = true;
		hintedTitle.revealed = true;

		setNumReveals(numReveals => numReveals + 1);
		setTitleValue(hintedTitle, titleIndex, setTitles, setCurrentSelection);
	}, [getTitleListSide]);

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
		setTitleValue({ ...match, found: true }, matchIndex, setValues, setCurrentItem);
	}

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
				<TitleList 
					titles={adjectives} 
					setTitles={setAdjectives}
					currentSelection={currentAdjective}
					setCurrentSelection={setCurrentAdjective}
					doHint={doHint}
					doReveal={doReveal}
					noTitlesMessage='Enter your first adjective above!'
					isLeftSide={true}/>
				<CenterBar>
					<CenterBarReel />
				</CenterBar>
				<TitleList 
					titles={subjects} 
					setTitles={setSubjects}
					currentSelection={currentSubject}
					setCurrentSelection={setCurrentSubject}
					doHint={doHint}
					doReveal={doReveal}
					noTitlesMessage='Enter your first subject above!'
					isLeftSide={false}/>
			</Collection>
			<Credits>
				<div>Click or Press a title for a hint.</div>
				<div>Click or Press and Hold a title to reveal it.</div>
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
	transition: opacity 0.1s linear;
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