import React, { useState, useRef, useEffect } from 'react';
import Data from './titles.json'
import styled from 'styled-components';

//1. Textbox

interface NamedTitle {
	title: string;
	index: number;
}

function App() {

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

	const [ allAdjectives ] = useState(Data.Adjective.sort(sortNoCase));
	const [ allSubjects ] = useState(Data.Subject.sort(sortNoCase));
	const [ adjectiveInput, setAdjectiveInput] = useState("");
	const [ subjectInput, setSubjectInput] = useState("");

	const [ namedAdjectives, setNamedAdjectives ] = useState<NamedTitle[]>([]);
	const [ namedSubjects, setNamedSubjects ] = useState<NamedTitle[]>([]);

	const [isRunning, setIsRunning] = useState(false);
	const [timeState, setTimer] = useState({ time: 0, startTime: Date.now()});
	const interval = useRef<number | null>(null);

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
		setNamedAdjectives([]);
		setNamedSubjects([]);
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

	const checkInput = (text: string, allValues: string[], namedValues: NamedTitle[], setTextInput: React.Dispatch<React.SetStateAction<string>>, setNamedValues: React.Dispatch<React.SetStateAction<NamedTitle[]>>) => {
		setTextInput(text);

		const match = allValues.find((item) => { return titleMatch(item, text) });
		const matchIndex = allValues.indexOf(match ? match : "");

		if(match && !namedValues.some((item) => { return titleMatch(item.title, text) })) {
			setTextInput("");

			setIsRunning(true);

			setNamedValues([ ...namedValues, {title: match, index: matchIndex}].sort((a: NamedTitle, b: NamedTitle) => { return sortNoCase(a.title, b.title); }));
		}
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
				<AdjectiveText>Adjectives ({`${namedAdjectives.length}/${allAdjectives.length}`})</AdjectiveText>
				<TitleInput type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, allAdjectives, namedAdjectives, setAdjectiveInput, setNamedAdjectives); }} />
				<TitleInput type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, allSubjects, namedSubjects, setSubjectInput, setNamedSubjects); }} />
				<SubjectText>Subjects ({`${namedSubjects.length}/${allSubjects.length}`})</SubjectText>
			</TextBox>
			<Container>
				<TitleList>
				{
					namedAdjectives.length <= 0 && (
						<div>Enter your first adjective above!</div>
					)
				}
				{
					namedAdjectives.map((item, index) => {

						const nextUnfoundIndex = (index <= 0) ? 0 : namedAdjectives[index - 1].index + 1;
						const remainingAbove = item.index - nextUnfoundIndex;
						const remainingBelow = (index === namedAdjectives.length - 1) ? (allAdjectives.length - 1) - item.index : 0;

						return (
							<NamedItem key={index}>
								{remainingAbove > 0 && (
									<div>{`??? (${remainingAbove} Remain)`}</div>
								)}
								<div>{item.title}</div>
								{remainingBelow > 0 && (
									<div>{`??? (${remainingBelow} Remain)`}</div>
								)}
							</NamedItem>
						)
					})
				}
				</TitleList>
				<CenterBar />
				<TitleListRight>
				{
					namedSubjects.length <= 0 && (
						<div>Enter your first subject above!</div>
					)
				}
				{
					namedSubjects.map((item, index) => {

						const nextUnfoundIndex = (index <= 0) ? 0 : namedSubjects[index - 1].index + 1;
						const remainingAbove = item.index - nextUnfoundIndex;
						const remainingBelow = (index === namedSubjects.length - 1) ? (allSubjects.length - 1) - item.index : 0;

						return (
							<NamedItem key={index}>
								{remainingAbove > 0 && (
									<div>{`??? (${remainingAbove} Remain)`}</div>
								)}
								<div>{item.title}</div>
								{remainingBelow > 0 && (
									<div>{`??? (${remainingBelow} Remain)`}</div>
								)}
							</NamedItem>
						)
					})
				}
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
	width: 100vw;
	height: 100vh;

	background-color: #000000;
	background-size: 30%;
	background-image: url('./camo-black.png');

	overflow: hidden;
`;

const Content = styled.div`
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
	min-height: 0;
	display: grid;
	margin: 20px;
	border-radius: 1rem;
	grid-template-columns: 1fr max-content 1fr;

	background-color: #4c4c4c;
`;

const NamedItem = styled.div`
	display: contents;
`

const TitleList = styled.div`
	width: 100%;
	height: 100%;
	padding: 50px;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: center;
	font-size: 35px;

	overflow: auto;
`;

const TitleListRight = styled(TitleList)`
	align-items: flex-start;
`

const CenterBar = styled.div`
	height: 100%;
	width: 20px;

	background-color: #797979;
`;