import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Data from './titles.json'
import styled from 'styled-components';
import { sortNoCase, formatTime, calcClampPx, calcClampRem, titleMatch, getSurroundingTitles, getRandomTitle, getNextHintState } from './helpers';
import { GithubLogo } from '@phosphor-icons/react'
import { TitleList } from './TitleList';
import { RowItem } from './Layout';
import { NamedTitle, CurrentSelection, DoHintProps, DoRevealProps, TimeState } from './types';
import cheese from './assets/29quintillioncheese.mp4'
import camo from './assets/camo-foreground-black.png'
import greyStripedBackground from './assets/grey-striped-background.png'
import { useLocalStorage } from './hooks';

type EasterEggGradient = {
	title: string;
	gradient: string[];
	useVideo?: boolean;
}

type TitlePair = {
	adjective: string;
	subject: string;
}

const EASTER_EGGS: EasterEggGradient[] = [
	{title: "If You Want To Go Back To The Default Gradient Maybe You Should Just Reload Instead", gradient: ['#1B1B1B']},
	{title: "Trans Rights", gradient: ['#55cdfd', '#f6aab7', '#ffffff', '#f6aab7', '#55cefd']},
	{title: "Yellow Square", gradient: ['#bfce3e']},
	{title: "Pearlina", gradient: ['#d52800', '#fd9954', '#ffffff', '#d261a3', '#a30061']},
	{title: "Open Season", gradient: ['#66472a', '#442e19', '#66472a', '#472f19', '#46301c', '#66472a', '#944cf8', '#1e1ea5','#1e1ea5', '#944cf8', '#66472a', '#493421', '#66472a']},
	{title: "Trapinch Certified", gradient: ['#f29e77', '#f29e77', '#f29e77', '#f29e77', '#e8ecf2', '#f29e77']},
	{title: "Cheese", gradient: ['#006efd'], useVideo: true}];


const LEFT_MESSAGES = ['(Hello and welcome to', 'Friendly-Welcoming', 'Title-Awaiting', 'Well-Wishing', '(Enter any title'];
const RIGHT_MESSAGES = ['the Splatoon 3 Title Quiz!)', 'Splatoon 3 Title Quizzer', 'Textbox Above User', 'Good Luck Haver', 'above to begin!)'];

const LEFT_DEFAULT_INDEX = 2;
const RIGHT_DEFAULT_INDEX = 2;

const adjectiveList = Data.Adjective.sort(sortNoCase);
const subjectList = Data.Subject.sort(sortNoCase);

function App() {
	const [ adjectives, setAdjectives ] = useLocalStorage<NamedTitle[]>("adjectives", adjectiveList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false, gaveUp: false}}));
	const [ subjects, setSubjects ] = useLocalStorage<NamedTitle[]>("subjects", subjectList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false, gaveUp: false}}));
	const [ adjectiveInput, setAdjectiveInput] = useState("");
	const [ subjectInput, setSubjectInput] = useState("");

	const [ isRunning, setIsRunning ] = useState(false);
	const [ timeState, setTimer ] = useLocalStorage<TimeState>("time", { time: 0, startTime: Date.now()});
	const interval = useRef<number | null>(null);

	const [ currentAdjective, setCurrentAdjective ] = useLocalStorage<CurrentSelection>("currentAdjective", { index: LEFT_DEFAULT_INDEX, transitionTime: 0});
	const [ currentSubject, setCurrentSubject ] = useLocalStorage<CurrentSelection>("currentSubject", { index: RIGHT_DEFAULT_INDEX, transitionTime: 0});
	
	const [ numHints, setNumHints ] = useLocalStorage<number>("numHints", 0);
	const [ numReveals, setNumReveals ] = useLocalStorage<number>("numReveals", 0);
	const [ firstTitle, setFirstTitle] = useLocalStorage<TitlePair>("firstTitle", { adjective: "", subject: "" });
	const [ leftResults, setLeftResults ] = useState<string[]>([]);
	const [ rightResults, setRightResults ] = useState<string[]>([]);

	const [ showResults, setShowResults ] = useState(false);
	const [ gaveUp, setGaveUp ] = useLocalStorage<boolean>("gaveUp", false);
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

	//
	// Timer
	//

	const updateTime = useCallback(() => {
		setTimer(prevState => (
			{
			time: prevState.time + (Date.now() - prevState.startTime),
			startTime: Date.now()
		}));
	}, [setTimer]);
	
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

	}, [isRunning, setTimer, updateTime]);

	//
	// Results Data
	//

	const numAdjectives = useMemo(() => {
		return adjectives.filter((item) => item.found).length;
	}, [adjectives])

	const numSubjects = useMemo(() => {
		return subjects.filter((item) => item.found).length;
	}, [subjects]);

	const getResults = useCallback((
		time: number, 
		numAdjectives: number,
		numSubjects: number,
		numHints: number,
		numReveals: number,
		firstTitle: TitlePair,
		luckyTitle: TitlePair,
		hasGivenUp: boolean) => {

		let leftResults = [];
		let rightResults = [];

		leftResults.push(hasGivenUp ? `Gave up...` : `${formatTime(time)}`);
		
		leftResults.push(`${numSubjects + numAdjectives}`);
		leftResults.push(`${numHints}`);
		leftResults.push(`${numReveals}`);

		if(firstTitle.adjective && firstTitle.subject) {
			leftResults.push(`First`);
			leftResults.push(`${firstTitle.adjective}`);
		}

		if(luckyTitle) {
			leftResults.push(`Lucky`);
			leftResults.push(`${luckyTitle.adjective}`);
		}

		leftResults.push(`Thank you`);

		rightResults.push(`Final Time`);
		rightResults.push(`Titles Found`);
		rightResults.push(`Hints`);
		rightResults.push(`Reveals`);

		if(firstTitle.adjective && firstTitle.subject) {
			rightResults.push(`Title`);
			rightResults.push(`${firstTitle.subject}`);
		}

		if(luckyTitle) {
			rightResults.push(`Title`);
			rightResults.push(`${luckyTitle.subject}`);
		}
		
		rightResults.push(`for playing!`);
		
		return { leftResults, rightResults };
	}, []);

	useEffect(() => {
		if(!gameFinished && numAdjectives >= adjectiveList.length && numSubjects >= subjectList.length) {
			setGameFinished(true);
			setShowResults(true);
			setIsRunning(false);

			const numAdjectivesFound = adjectives.filter((item) => { return item.found && !item.gaveUp; }).length;
			const numSubjectsFound = subjects.filter((item) => { return item.found && !item.gaveUp; }).length;

			const randomAdjective = getRandomTitle(() => true, adjectives);
			const randomSubject = getRandomTitle(() => true, subjects);

			let luckyTitle: TitlePair = { adjective: "", subject: ""};

			if(randomAdjective && randomSubject) {
				luckyTitle = { adjective: randomAdjective.title.title, subject: randomSubject.title.title };
			}

			const { leftResults, rightResults } = getResults(timeState.time, numAdjectivesFound, numSubjectsFound, numHints, numReveals, firstTitle, luckyTitle, gaveUp);

			setLeftResults(leftResults);
			setRightResults(rightResults);

			setCurrentAdjective({ index: 0, transitionTime: 2});
			setCurrentSubject({ index: 0, transitionTime: 2});
		}
	}, [numAdjectives, numSubjects, gameFinished, currentAdjective, currentSubject, adjectives, subjects, firstTitle, getResults, numHints, numReveals, timeState.time, gaveUp, setCurrentAdjective, setCurrentSubject]);

	//
	// Game Functionality
	//
		
	const setTitleValue = useCallback((
		newValue: NamedTitle,
		titleIndex: number,
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<CurrentSelection>>,
		isLeftSide: boolean
	) => {

		if(newValue.found) {
			if(isLeftSide) {
				setFirstTitle(firstTitle => { 
					if(firstTitle.adjective) return firstTitle;
					return { ...firstTitle, adjective: newValue.title}
				});
			}
			else if(!isLeftSide) {
				setFirstTitle(firstTitle => { 
					if(firstTitle.subject) return firstTitle;
					return { ...firstTitle, subject: newValue.title}
				});
			}
		}

		setIsRunning(true);
		setValues((values) => {
			return values.map((item, index) => { return (titleIndex === index) ? newValue : item; });
		});
		setCurrentItem({ index: titleIndex, transitionTime: 2});
	}, [setFirstTitle]);

	const getTitleListSide = useCallback((isLeftSide: boolean) => {
		if(isLeftSide) {
			return { titles: adjectives, setTitles: setAdjectives, setCurrentSelection: setCurrentAdjective };
		}
		else {
			return { titles: subjects, setTitles: setSubjects, setCurrentSelection: setCurrentSubject };
		}
	}, [adjectives, setAdjectives, setCurrentAdjective, subjects, setSubjects, setCurrentSubject]);

	const doHint: DoHintProps = useCallback((hintedTitle, titleIndex, isLeftSide) => {
		if(hintedTitle.found) return;

		const { titles, setTitles, setCurrentSelection } = getTitleListSide(isLeftSide);
		const { prev, next } = getSurroundingTitles(titleIndex, titles, (title) => title.found);

		hintedTitle = getNextHintState(hintedTitle, prev, next);

		setNumHints(numHints => numHints + 1);
		setTitleValue(hintedTitle, titleIndex, setTitles, setCurrentSelection, isLeftSide);
	}, [getTitleListSide, setTitleValue, setNumHints]);

	const doReveal: DoRevealProps = useCallback((hintedTitle, titleIndex, isLeftSide) => {

		if(hintedTitle.found) return;

		hintedTitle.found = true;
		hintedTitle.revealed = true;

		setNumReveals(numReveals => numReveals + 1);

		const setTitles = isLeftSide ? setAdjectives : setSubjects;
		const setCurrentSelection = isLeftSide ? setCurrentAdjective : setCurrentSubject;

		setTitleValue(hintedTitle, titleIndex, setTitles, setCurrentSelection, isLeftSide);
	}, [setTitleValue, setAdjectives, setSubjects, setCurrentAdjective, setCurrentSubject, setNumReveals]);

	//
	// Buttons
	//

	const onPressHint = () => {
		const randomAdjective = getRandomTitle((item) => !item.found, adjectives);

		if(randomAdjective) {
			doHint(randomAdjective.title, randomAdjective.index, true);
		}

		const randomSubject = getRandomTitle((item) => !item.found, subjects);

		if(randomSubject) {
			doHint(randomSubject.title, randomSubject.index, false);
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
	
	const onPressReset = () => {
		localStorage.clear();
		setAdjectives(adjectiveList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false, gaveUp: false}}));
		setSubjects(subjectList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false, gaveUp: false}}));

		setCurrentAdjective({ index: LEFT_DEFAULT_INDEX, transitionTime: 0});
		setCurrentSubject({ index: RIGHT_DEFAULT_INDEX, transitionTime: 0});
		setIsRunning(false);
		setGameFinished(false);
		setShowResults(false);
		setGaveUp(false);
		setNumHints(0);
		setNumReveals(0);
		setFirstTitle({ adjective: "", subject: ""});
		setTimer(prevState => ({ time: 0, startTime: Date.now()}));
	}
	
	const onPressGameStateButton = () => {
		if(gameFinished) {
			onPressToggleResults();
		}
		else {
			onPressGiveUp();
		}
	}

	const onPressToggleResults = () => {
		if(showResults) {
			setShowResults(false);

			setCurrentAdjective({ index: 0, transitionTime: 2});
			setCurrentSubject({ index: 0, transitionTime: 2});
		}
		else {
			setShowResults(true);

			setCurrentAdjective({ index: 0, transitionTime: 2});
			setCurrentSubject({ index: 0, transitionTime: 2});
		}
	}

	const onPressGiveUp = () => {
		setAdjectives(adjectives.map((item) => { 
			if(item.found) return item;
			return { ...item, found: true, gaveUp: true}
		}));

		setSubjects(subjects.map((item) => { 
			if(item.found) return item;
			return { ...item, found: true, gaveUp: true}
		}));

		setGaveUp(true);
	}

	//
	// Input
	//

	const checkInput = (
		text: string, 
		setTextInput: React.Dispatch<React.SetStateAction<string>>, 
		isLeftSide: boolean) => {

		const {titles, setTitles, setCurrentSelection} = getTitleListSide(isLeftSide);
			
		setTextInput(text);

		// :)
		const eggMatch = EASTER_EGGS.find((item) => { return titleMatch(item.title, text)});

		if(eggMatch) {
			const eggIndex = EASTER_EGGS.indexOf(eggMatch);

			setEasterEggState(eggIndex);

			setTextInput("");
			return;
		}

		const match = titles.find((item) => { return titleMatch(item.title, text) });

		if(!match || match.found) return;

		const matchIndex = titles.indexOf(match);

		setTextInput("");
		setTitleValue({ ...match, found: true }, matchIndex, setTitles, setCurrentSelection, isLeftSide);
	}

  return (
	<>
		<BackBackground $gradient={currentGradient}>
			<SecretVideo autoPlay muted loop $active={EASTER_EGGS[easterEggState].useVideo}>
				<source src={cheese} type="video/mp4" />
			</SecretVideo>
			<Background />
		</BackBackground>
		<Content>
			<TopRow>
				<RowItem as="button" onClick={() => { onPressHint(); }}>Random Hint</RowItem>
				<RowItem as="button" onClick={() => { onPressReveal(); }}>Random Reveal</RowItem>
				<RowItem as="button" onClick={() => { onPressReset(); }}>Reset</RowItem>
				<RowItem as="button" onClick={() => { onPressGameStateButton(); }}>{gameFinished ? (showResults ? `Show Titles` : `Show Results`) : `Give Up`}</RowItem>
				<RowItem>Time: {formatTime(timeState.time)}</RowItem>
  			</TopRow>
			<TitleEntryArea>
				<TitleTextEntryPair>
					<AdjectiveText htmlFor="adjective-input">Adjectives ({`${numAdjectives}/${adjectives.length}`})</AdjectiveText>
					<TitleInput id="adjective-input" type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, setAdjectiveInput, true); }} />
				</TitleTextEntryPair>
				<TitleTextEntryPairRight>
					<TitleInput id="subject-input" type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, setSubjectInput, false); }} />
					<SubjectText htmlFor="subject-input">Subjects ({`${numSubjects}/${subjects.length}`})</SubjectText>
				</TitleTextEntryPairRight>
			</TitleEntryArea>
			<Collection>
				<TitleList 
					titles={adjectives} 
					currentSelection={currentAdjective}
					setCurrentSelection={setCurrentAdjective}
					doHint={doHint}
					doReveal={doReveal}
					showResults={showResults}
					startMessages={LEFT_MESSAGES}
					resultMessages={leftResults}
					isLeftSide={true}/>
				<CenterBar>
					<CenterBarReel />
				</CenterBar>
				<TitleList 
					titles={subjects} 
					currentSelection={currentSubject}
					setCurrentSelection={setCurrentSubject}
					doHint={doHint}
					doReveal={doReveal}
					showResults={showResults}
					startMessages={RIGHT_MESSAGES}
					resultMessages={rightResults}
					isLeftSide={false}/>
			</Collection>
			<Credits>
				<CreditsRow>Hi there! Welcome to the Splatoon 3 Title Quiz!</CreditsRow>
				<CreditsRow>There are a LOT of titles in this game, how many can you name??</CreditsRow>
				<CreditsRow>You can press on a specific title to get a hint.</CreditsRow>
				<CreditsRow>Or, press and hold on a title to reveal it.</CreditsRow>
				<CreditsRow>Created by <a href='https://epicyoshimaster.neocities.org/'>EpicYoshiMaster</a>!</CreditsRow>
				<CreditsRow>Title data taken from  <a href='https://twitter.com/LeanYoshi/'>LeanYoshi</a>'s Splatoon Database!</CreditsRow>
				<CreditsRow>Splatoon and its associated content are property of Nintendo.</CreditsRow>
				<CreditsRow><a href='https://github.com/EpicYoshiMaster/splat-title-quiz'>View the source here! </a><GithubLogo /></CreditsRow>
				<CreditsRow>Updated for Ver. 9.0.0! (You'll need to reset your current game!)</CreditsRow>
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
	background-image: url(${camo});

	overflow: hidden;
`;

const Content = styled.div`
	position: relative;

	display: flex;
	flex-direction: column;
	align-items: center;
	
	color: #ffffff;

	font-size: 0.6rem;

	@media screen and (min-width: 700px) {
		font-size: 1rem;
	}

	@media screen and (min-width: 1100px) {
		font-size: 1.5rem;
	}

	@media screen and (min-width: 1200px) {
		font-size: 1.75rem;
	}

	@media screen and (min-width: 1400px) {
		font-size: 2rem;
	}
`;

//
// First Row
//

const TopRow = styled.div`
	display: flex;
	flex-direction: row;
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

	@media screen and (min-width: 1300px) {
		flex-direction: row;
	}
`;

const TitleTextEntryPairRight = styled(TitleTextEntryPair)`
	flex-direction: column-reverse;

	@media screen and (min-width: 1300px) {
		flex-direction: row;
	}
`;

const TitleInput = styled.input`
	width: ${calcClampRem(9, 20, 320, 1000, 16)};
	//height: ${calcClampRem(1.6, 3, 320, 1000, 16)};
	height: 1.5em;

	font-family: Splatoon;

	font-size: 1rem;
	height: 2em;

	@media screen and (min-width: 700px) {
		font-size: 1.25rem;
		height: 2.25em;
	}

	@media screen and (min-width: 1000px) {
		font-size: 1.5rem;
		height: 2em;
	}

	@media screen and (min-width: 1300px) {
		font-size: 2rem;
		height: 1.5em;
	}

	margin: 0 ${calcClampPx(5, 10, 400, 1100)};
`;

const AdjectiveText = styled.label`
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
	height: ${calcClampRem(15, 45, 600, 2200, 16, "vw")};

	display: grid;
	grid-template-columns: 1fr max-content 1fr;

	margin: 10px 0;
	border-radius: 1rem;

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
	padding: ${calcClampPx(5, 20, 400, 1300)};

	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;

	background-repeat: no-repeat;
	background-size: cover;
	background-image: url(${greyStripedBackground});

	border: solid 5px #3d3e41;
	border-radius: 1rem;
`;

const CreditsRow = styled.div`

	& a {
		color: #a02adb;
	}

	font-size: 0.6rem;

	@media screen and (min-width: 500px) {
		font-size: 0.8rem;
	}

	@media screen and (min-width: 500px) {
		font-size: 1rem;
	}

	@media screen and (min-width: 600px) {
		font-size: 1.25rem;
	}

	@media screen and (min-width: 750px) {
		font-size: 1.5rem;
	}

	@media screen and (min-width: 1000px) {
		font-size: 1.75rem;
	}
`;