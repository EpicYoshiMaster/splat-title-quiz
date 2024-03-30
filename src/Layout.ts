import styled from "styled-components";
import { calcClampPx, calcClampRem } from "./helpers";


export const RowItem = styled.div`
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
`;