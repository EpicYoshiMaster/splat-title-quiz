import React, { useState } from 'react';
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

			setNamedValues([ ...namedValues, {title: match, index: matchIndex}].sort((a: NamedTitle, b: NamedTitle) => { return sortNoCase(a.title, b.title); }));
		}
	}

  return (
	<Wrapper>
		<TextBox>
			<TitleInput type="string" value={adjectiveInput} onChange={(event) => { checkInput(event.target.value, allAdjectives, namedAdjectives, setAdjectiveInput, setNamedAdjectives); }} />
			<TitleInput type="string" value={subjectInput} onChange={(event) => { checkInput(event.target.value, allSubjects, namedSubjects, setSubjectInput, setNamedSubjects); }} />
		</TextBox>
		<Container>
			<TitleList>
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
			{/*			<TitleList>
			{
				allAdjectives.map((item, index) => {
					return (
						<div key={index}>{item}</div>
					)
				})
			}
			</TitleList> */}
			<TitleList>
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
			</TitleList>
			{/*<TitleList>
			{
				allSubjects.map((item, index) => {
					return (
						<div key={index}>{item}</div>
					)
				})
			}
			</TitleList> */}
		</Container>
	</Wrapper>
	
  );
}

export default App;

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
`

const TitleInput = styled.input`
	font-family: Splatoon;
`;

const TextBox = styled.div`
	margin: 50px;
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	align-items: center;
`

const Container = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
`;

const NamedItem = styled.div`
	display: contents;
`

const TitleList = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`;