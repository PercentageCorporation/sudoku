import { useState, useEffect, useMemo } from "react";
import { cellStore } from "../store/store";
import { validateMove, isGameSolved } from "../utilities/utilities";

export default function PlayMenu() {
	const { selectedCell, getCell, setCellValue, setSelectedValue, setSelectedCell, updateGS, gameSolved } = cellStore();
	const [message, setMessage] = useState(gameSolved ? "Game Complete" : null);
	const selection = [1,2,3,4,5,6,7,8,9];

	useEffect(() => {
		console.log("PlayMenu UE");
		const solved = isGameSolved();
		if (solved == 0) {
			console.log("game solved");
			updateGS(true);
		} else if (solved == 1) {
			console.log("game solved, alternate solution");
			updateGS(true);
		}
	},[])

	function select(e,s) {
		e.preventDefault();
		const sc = getCell(selectedCell);
		console.log("select:", s, selectedCell, sc);
		if (s === 0) {
			if (selectedCell >= 0) setCellValue(selectedCell, 0);
			setSelectedCell(-1);
			setSelectedValue(-1);
			setMessage(null);
			return;
		}

		if (selectedCell > 0) {
			const val = validateMove(selectedCell, s);
			console.log("val:", val);
			if (val < 0) {
				setMessage("Invalid Move");
				return;
			}
			if (val > 0) {
				setMessage("Bad Move");
				console.log("Bad Move:", s);
			}

// 			const sc = getCell(selectedCell);
// 			if (sc.value > 0) {
// 				// error??
// 				//return;
// 				console.log("Changing cell value:", sc.value, s);
// 			}

			setCellValue(selectedCell, s);
			setSelectedCell(-1);
			setSelectedValue(s);
			setMessage(null);
			return;
		}

		setSelectedValue(s);
		setSelectedCell(-1);
		setMessage(null);
	}

	return (
		<div>
			<div className="flex flex-row justify-between w-full mt-6" >
			{selection.map((s) => {

				return (
					<div key={s} className=" " >
						<div className="flex justify-center size-8 text-xl font-bold rounded-md bg-green-400 hover:cursor-pointer " onClick={(e) => select(e,s)} >
						{s}
						</div>
					</div>
				)})
			}
				<div className=" ">
					<div className="flex justify-center size-8 text-xl font-bold rounded-md bg-green-400 hover:cursor-pointer " onClick={(e) => select(e,0)} >
					C
					</div>
				</div>
			</div>
			<div className="mt-4 flex text-lg font-bold text-red-600">
				{message}
			</div>
		</div>
	)

}
