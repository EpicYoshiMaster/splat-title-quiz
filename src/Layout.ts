import styled from "styled-components";
import { calcClampPx } from "./helpers";


export const RowItem = styled.div`
	margin: 5px;
	margin: ${calcClampPx(2, 10, 320, 1000)};

	padding: 5px;
	padding: ${calcClampPx(2, 10, 320, 1000)};

	font-family: Splatoon;

	font-size: 0.6rem;

	@media screen and (min-width: 400px) {
		font-size: 0.8rem;
	}

	@media screen and (min-width: 500px) {
		font-size: 1rem;
	}

	@media screen and (min-width: 700px) {
		font-size: 1.5rem;
	}

	@media screen and (min-width: 900px) {
		font-size: 1.75rem;
	}

	border-radius: 0.5rem;

	text-align: center;

	color: #ffffff;
	background-color: #4c4c4c;
`;