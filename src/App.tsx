import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Data from './titles.json'
import styled from 'styled-components';
import { sortNoCase, formatTime, calcClampPx, calcClampRem, titleMatch, getSurroundingTitles, getRandomTitle } from './helpers';
import { GithubLogo } from '@phosphor-icons/react'
import { TitleList } from './TitleList';
import { RowItem } from './Layout';
import { NamedTitle, CurrentSelection, FREE_CHARACTERS, DoHintProps, DoRevealProps } from './types';

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

//TODO:
// - Add site icon / info

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

	const [ currentAdjective, setCurrentAdjective ] = useState<CurrentSelection>({ index: LEFT_DEFAULT_INDEX, transitionTime: 0});
	const [ currentSubject, setCurrentSubject ] = useState<CurrentSelection>({ index: RIGHT_DEFAULT_INDEX, transitionTime: 0});
	
	const [ numHints, setNumHints ] = useState(0);
	const [ numReveals, setNumReveals ] = useState(0);
	const [ firstTitle, setFirstTitle] = useState<TitlePair>({ adjective: "", subject: "" });
	const [ luckyTitle, setLuckyTitle ] = useState<TitlePair>({ adjective: "", subject: "" });

	const [ showResults, setShowResults ] = useState(false);
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

	//
	// Timer
	//

	const updateTime = () => {
		setTimer(prevState => (
			{
			time: prevState.time + (Date.now() - prevState.startTime),
			startTime: Date.now()
		}));
	}
	
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

	//
	// Results Data
	//

	const numAdjectives = useMemo(() => {
		return adjectives.filter((item) => item.found).length;
	}, [adjectives])

	const numSubjects = useMemo(() => {
		return subjects.filter((item) => item.found).length;
	}, [subjects]);
	
	const resultsLeftSide = useMemo(() => {
		let results: string[] = [];

		if(gaveUp) {
			results.push(`Gave up...`);
		}
		else {
			results.push(`${formatTime(timeState.time)}`);
		}
		
		results.push(`${numSubjects + numAdjectives}`);
		results.push(`${numHints}`);
		results.push(`${numReveals}`);

		if(firstTitle) {
			results.push(`First`);
			results.push(`${firstTitle.adjective}`);
		}

		if(luckyTitle) {
			results.push(`Lucky`);
			results.push(`${luckyTitle.adjective}`);
		}

		results.push(`Thank you`);

		return results;
	}, [numHints, numReveals, timeState, gaveUp, numAdjectives, numSubjects, firstTitle, luckyTitle]);

	const resultsRightSide = useMemo(() => {
		let results: string[] = [];

		results.push(`Final Time`);
		results.push(`Titles Found`);
		results.push(`Hints`);
		results.push(`Reveals`);

		if(firstTitle) {
			results.push(`Title`);
			results.push(`${firstTitle.subject}`);
		}

		if(luckyTitle) {
			results.push(`Title`);
			results.push(`${luckyTitle.subject}`);
		}
		
		results.push(`for playing!`);

		return results;
	}, [firstTitle, luckyTitle]);

	useEffect(() => {
		if(!gameFinished && numAdjectives >= adjectiveList.length && numSubjects >= subjectList.length) {
			setGameFinished(true);
			setShowResults(true);
			setIsRunning(false);

			const randomAdjective = getRandomTitle(() => true, adjectives);
			const randomSubject = getRandomTitle(() => true, subjects);
			if(randomAdjective && randomSubject) {
				setLuckyTitle({ adjective: randomAdjective.title.title, subject: randomSubject.title.title});
			}
			else {
				setLuckyTitle({ adjective: "", subject: ""});
			}

			setCurrentAdjective({ index: 0, transitionTime: 2});
			setCurrentSubject({ index: 0, transitionTime: 2});
		}
	}, [numAdjectives, numSubjects, gameFinished, resultsLeftSide.length, resultsRightSide.length, currentAdjective, currentSubject, adjectives, subjects]);

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
			if(isLeftSide && !firstTitle.adjective) {
				setFirstTitle(firstTitle => { return { ...firstTitle, adjective: newValue.title}});
			}
			else if(!isLeftSide && !firstTitle.subject) {
				setFirstTitle(firstTitle => { return { ...firstTitle, subject: newValue.title}});
			}
		}

		setIsRunning(true);
		setValues((values) => {
			return values.map((item, index) => { return (titleIndex === index) ? newValue : item; });
		});
		setCurrentItem({ index: titleIndex, transitionTime: 2});
	}, [firstTitle]);

	const getTitleListSide = useCallback((isLeftSide: boolean) => {
		if(isLeftSide) {
			return { titles: adjectives, setTitles: setAdjectives, setCurrentSelection: setCurrentAdjective };
		}
		else {
			return { titles: subjects, setTitles: setSubjects, setCurrentSelection: setCurrentSubject };
		}
	}, [adjectives, setAdjectives, setCurrentAdjective, subjects, setSubjects, setCurrentSubject]);

	const doHint: DoHintProps = useCallback((hintedTitle, titleIndex, isLeftSide) => {
		const { titles, setTitles, setCurrentSelection } = getTitleListSide(isLeftSide);

		if(hintedTitle.found) return;

		//get previous and next found titles if they exist
		const { prev, next } = getSurroundingTitles(titleIndex, titles, (title) => title.found);

		hintedTitle.hinted = true;

		let i = hintedTitle.lastHintedIndex + 1;

		while(i < hintedTitle.title.length) {
			//if the character is trivial (by surrounding titles), increment the hint amount for free
			//if the character is a space, increment the hint amount for free
			//if the character is neither, this is the last new hint, leave

			let isTrivial = true;

			if(!prev || !next) {
				isTrivial = false;
			}

			if(prev && (i >= prev.title.length || prev.title[i] !== hintedTitle.title[i])) {
				isTrivial = false;
			}

			if(next && (i >= next.title.length || next.title[i] !== hintedTitle.title[i])) {
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
		setTitleValue(hintedTitle, titleIndex, setTitles, setCurrentSelection, isLeftSide);
	}, [getTitleListSide, setTitleValue]);

	const doReveal: DoRevealProps = useCallback((hintedTitle, titleIndex, isLeftSide) => {
		const { setTitles, setCurrentSelection } = getTitleListSide(isLeftSide);

		if(hintedTitle.found) return;

		hintedTitle.found = true;
		hintedTitle.revealed = true;

		setNumReveals(numReveals => numReveals + 1);
		setTitleValue(hintedTitle, titleIndex, setTitles, setCurrentSelection, isLeftSide);
	}, [getTitleListSide, setTitleValue]);

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
		setAdjectives(adjectiveList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false}}));
		setSubjects(subjectList.map((value) => { return { title: value, found: false, hinted: false, lastHintedIndex: -1, revealed: false}}));

		setCurrentAdjective({ index: LEFT_DEFAULT_INDEX, transitionTime: 0});
		setCurrentSubject({ index: RIGHT_DEFAULT_INDEX, transitionTime: 0});
		setIsRunning(false);
		setGameFinished(false);
		setShowResults(false);
		setGaveUp(false);
		setFirstTitle({ adjective: "", subject: ""});
		setLuckyTitle({ adjective: "", subject: ""});
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
		setAdjectives(adjectives.map((item) => { return { ...item, found: true}}));
		setSubjects(subjects.map((item) => { return {...item, found: true}}));

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
				<source src="29quintillioncheese.mp4" type="video/mp4" />
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
					<AdjectiveText>Adjectives ({`${numAdjectives}/${adjectives.length}`})</AdjectiveText>
					<TitleInput type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, setAdjectiveInput, true); }} />
				</TitleTextEntryPair>
				<TitleTextEntryPairRight>
					<TitleInput type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, setSubjectInput, false); }} />
					<SubjectText>Subjects ({`${numSubjects}/${subjects.length}`})</SubjectText>
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
					resultMessages={resultsLeftSide}
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
					resultMessages={resultsRightSide}
					isLeftSide={false}/>
			</Collection>
			<Credits>
				<CreditsRow>Hi there! Welcome to the Splatoon 3 Title Quiz!</CreditsRow>
				<CreditsRow>There are a LOT of titles in this game, how many can you name??</CreditsRow>
				<CreditsRow>You can press on a specific title to get a hint.</CreditsRow>
				<CreditsRow>Or, press and hold on a title to reveal it.</CreditsRow>
				<CreditsRow>Created by <a href='https://twitter.com/EpicYoshiMaster'>EpicYoshiMaster</a>!</CreditsRow>
				<CreditsRow><a href='https://github.com/EpicYoshiMaster/splat-title-quiz'>View the source here! </a><GithubLogo /></CreditsRow>
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
	height: 100vh;

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
	height: ${calcClampRem(15, 45, 600, 1200, 16, "vh")};

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
	padding: ${calcClampPx(5, 20, 400, 1300)};

	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;

	background-repeat: no-repeat;
	background-size: cover;
	background-image: url('./grey_striped_background.png');

	border: solid 5px #3d3e41;
	border-radius: 1rem;

	font-size: ${calcClampRem(1.2, 2, 320, 1100, 16)};
`;

const CreditsRow = styled.div`

	& a {
		color: #9025c6;
	}

	font-size: 1rem;
	font-size: ${calcClampRem(0.8, 1.75, 500, 1100, 16)};
`;