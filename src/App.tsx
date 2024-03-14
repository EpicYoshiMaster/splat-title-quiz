import React, { useState, useRef, useEffect, useMemo } from 'react';
import Data from './titles.json'
import styled from 'styled-components';

//1. Textbox

interface NamedTitle {
	title: string;
	found: boolean;
}

const sortNoCase = (a: string, b: string) => {
	const nameA = a.toLowerCase();
	  const nameB = b.toLowerCase();

	  if (nameA < nameB) {
		return -1;
	  }

	  if (nameA > nameB) {
		return 1;
	  }

	  // names must be equal
	  return 0;
}

const adjectiveList = Data.Adjective.sort(sortNoCase);
const subjectList = Data.Subject.sort(sortNoCase);

function App() {

	const [ adjectives, setAdjectives ] = useState<NamedTitle[]>(adjectiveList.map((value) => { return { title: value, found: false}}));
	const [ subjects, setSubjects ] = useState<NamedTitle[]>(subjectList.map((value) => { return { title: value, found: false}}));
	const [ adjectiveInput, setAdjectiveInput] = useState("");
	const [ subjectInput, setSubjectInput] = useState("");

	//const [ namedAdjectives, setNamedAdjectives ] = useState<NamedTitle[]>([]);
	//const [ namedSubjects, setNamedSubjects ] = useState<NamedTitle[]>([]);

	const [ isRunning, setIsRunning ] = useState(false);
	const [ timeState, setTimer ] = useState({ time: 0, startTime: Date.now()});
	const interval = useRef<number | null>(null);

	const [ currentAdjective, setCurrentAdjective ] = useState(0);
	const [ currentSubject, setCurrentSubject ] = useState(0);

	const formatTime = (time: number) => {
		//HH:MM:SS
		time = Math.floor(time / 1000);
		const hours = Math.floor(time / 3600);
		time %= 3600;
		const minutes = Math.floor(time / 60);
		time %= 60;
		const seconds = time;

		return `${hours}:${minutes < 10 ? `0` + minutes : minutes}:${seconds < 10 ? `0` + seconds : seconds}`;
	}

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

	const onPressHint = () => {
		//TODO :)
	}

	const onPressReset = () => {
		setAdjectives(adjectiveList.map((value) => { return { title: value, found: false}}));
		setSubjects(subjectList.map((value) => { return { title: value, found: false}}));
		setIsRunning(false);
		setTimer(prevState => ({ time: 0, startTime: Date.now()}));
	}

	const onPressGiveUp = () => {
		//TODO :)
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

	const getTitleListIndex = (titleIndex: number, values: NamedTitle[]) => {

		console.log(titleIndex);

		return values.reduce((effectiveIndex, item, index, array) => {
			if(index > titleIndex) return effectiveIndex;

			console.log(`${effectiveIndex} ${JSON.stringify(item)} ${index}`);

			if(item.found) {
				const nextUnfoundIndex = getPreviousUnfoundIndex(index, array);

				return effectiveIndex + (index < titleIndex ? 1 : 0) + (nextUnfoundIndex < index ? 1 : 0);
			}
			else {
				return effectiveIndex;
			}
		}, 0);
	};

	const renderTitle = (item: NamedTitle, index: number, values: NamedTitle[]) => {

		if(!item.found && index === values.length - 1) {
			const nextUnfoundIndex = getPreviousUnfoundIndex(index, values);
			const remainingAbove = (index + 1) - nextUnfoundIndex;

			if(remainingAbove <= 0) return;

			return (
				<NamedItem key={index}>
					<div>{`??? (${remainingAbove} Remain)`}</div>
				</NamedItem>
			);
		}

		if(!item.found) return;

		const nextUnfoundIndex = getPreviousUnfoundIndex(index, values);
		const remainingAbove = index - nextUnfoundIndex;

		return (
			<NamedItem key={index}>
				{remainingAbove > 0 && (
					<div>{`??? (${remainingAbove} Remain)`}</div>
				)}
				<div>{item.title}</div>
			</NamedItem>
		);
	};

	const getPreviousUnfoundIndex = (index: number, values: NamedTitle[]) => {
		for(let i = index - 1; i >= 0; i--) {
			if(values[i].found) return i + 1;
		}

		return 0;
	};

	const checkInput = (
		text: string, 
		values: NamedTitle[], 
		setTextInput: React.Dispatch<React.SetStateAction<string>>, 
		setValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>,
		setCurrentItem: React.Dispatch<React.SetStateAction<number>>) => {
			
		setTextInput(text);

		const match = values.find((item) => { return titleMatch(item.title, text) });

		if(!match || match.found) return;

		const matchIndex = values.indexOf(match);

		setTextInput("");

		setIsRunning(true);

		const newValues = values.map((item, index) => { return (matchIndex === index) ? { ...item, found: true } : item; });

		setValues(newValues);
		setCurrentItem(getTitleListIndex(matchIndex, newValues));
	}

  return (
	<Background>
		<Content>
			<TopRow>
				<TopRowItem as="button" onClick={() => { onPressHint(); }}>Hint</TopRowItem>
				<TopRowItem as="button" onClick={() => { onPressReset(); }}>Reset</TopRowItem>
				<TopRowItem as="button" onClick={() => { onPressGiveUp(); }}>Give Up</TopRowItem>
				<TimeDisplay>
					Time: {formatTime(timeState.time)}
				</TimeDisplay>
			</TopRow>
			<TextBox>
				<AdjectiveText>Adjectives ({`${numAdjectives}/${adjectives.length}`})</AdjectiveText>
				<TitleInput type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, adjectives, setAdjectiveInput, setAdjectives, setCurrentAdjective); }} />
				<TitleInput type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, subjects, setSubjectInput, setSubjects, setCurrentSubject); }} />
				<SubjectText>Subjects ({`${numSubjects}/${subjects.length}`})</SubjectText>
			</TextBox>
			<Container>
				<TitleList>
					<ReelBackground />
					<Reel style={{ top: `${-currentAdjective * 2}em`}}>
						
					{
						numAdjectives <= 0 && (
							<div>Enter your first adjective above!</div>
						)
					}
					{
						numAdjectives > 0 && adjectives.map(renderTitle)
					}
						
					</Reel>
				</TitleList>
				<CenterBar>
					<CenterBarReel />
				</CenterBar>
				<TitleListRight>
					<ReelBackground />
					<ReelRight style={{ top: `${-currentSubject * 2}em`}}>
					{
						numSubjects <= 0 && (
							<div>Enter your first subject above!</div>
						)
					}
					{
						numSubjects > 0 && subjects.map(renderTitle)
					}
					</ReelRight>
				</TitleListRight>
			</Container>
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

	background-color: #4c4c4c;

	overflow: hidden;
`;

const NamedItem = styled.div`
	display: contents;
`

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

const Reel = styled.div`
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

	transition: top 1s ease-in-out;
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