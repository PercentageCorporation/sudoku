import { useState, useEffect } from "react";
import { cellStore, useHintStore, useCellActions } from "../store/store";
import { validateMove } from "../utilities/utilities";
import { runHints } from "../utilities/hints";
import { rows, cols, squares } from "../utilities/constants";
//import { Hint } from "../store/store";
//import Spinner from "./Spinner";

export default function PlayMenu() {
	const { selectedValue, selectedCell } = cellStore();
	const { setCellValue, clearCellValue, setSelectedValue, clearSelectedValue, clearSelectedCell, showCell } = useCellActions();
	const { checkGameSolved, calcNumbersUsed } = useCellActions();
	const { updateCandidates, addNonCandidate } = useCellActions();
	const { gameComplete, numbersUsed } = cellStore();
	const { hint, getHint, setHint, setHintMsg, resetHint } = useHintStore();
	const [message, setMessage] = useState(gameComplete ? "Game Complete" : null);
	const selection = [1,2,3,4,5,6,7,8,9];

	useEffect(() => {
		console.log("PlayMenu UE");
		calcNumbersUsed();
		const solved = gameComplete;
		console.log("solved:", solved);
		if (solved == 1) {
			console.log("game solved");
			setMessage("Game Solved");
		} else if (solved == 2) {
			console.log("game solved, alternate solution");
			setMessage("Game Solved, Alternate Solution");
		} else
			setMessage(null);

	},[gameComplete])

	function doHint(e) {
		e.preventDefault();
		var h = getHint();
		if (!h) return;
		console.log("doHint", h);
		switch (h.type) {
			// hints with targets
			case "xWing":
			case "xyWing":
			case "xyzWing":
			case "nakedPair":
			case "pointingPair":
				var cls = h.targets;
				console.log(cls);
				cls.forEach((cix) => {
					if (h.values) {
						h.values.forEach((value) => {
							addNonCandidate(cix, value);
						})
					}
					else if (h.value) {
						addNonCandidate(cix, h.value);
					}
				})
				clearSelectedValue();
				clearSelectedCell();
				break;

			case "cell":
				var cix = h.cells[0];
				var v = h.value;
				console.log("setCellValue", cix, v);
				setCellValue(cix, v);
				setSelectedValue(v);
				clearSelectedCell();
				break;

			case "nakedPairXXX":
				var cls = h.targets;
				console.log(cls);
				cls.forEach((cix) => {
					addNonCandidate(cix, h.values[0]);
					addNonCandidate(cix, h.values[1]);
				})
				clearSelectedValue();
				clearSelectedCell();
				break;

			case "pointingPairXXX":
				var cls = h.row !== null ? rows[h.row] : h.col != null ? cols[h.col] : [];
				console.log(cls);
				cls.forEach((cix) => {
					if (!h.cells.includes(cix)) addNonCandidate(cix, h.value);
				})
				clearSelectedValue();
				clearSelectedCell();
				break;

			case "pointingPairs2":
				clearSelectedValue();
				var cls = [];
				switch (h.direction) {
					case "row":
						cls = rows[h.row];
						break;
					case "col":
						cls = cols[h.col];
						break;
					case "sq":
						cls = squares[h.square];
						break;
					default:
						return;
				}

				console.log(cls);
				cls.forEach((cix) => {
					console.log("addC", cix, h.cells, h.values);
					if (!h.cells.includes(cix)) {
						addNonCandidate(cix, h.values[0]);
						addNonCandidate(cix, h.values[1]);
					}
					showCell(cix);
				})
				clearSelectedValue();
				clearSelectedCell();
				break;

			case "pointingPairSquare":
				clearSelectedValue();
				var six = h.square;
				var sq = squares[six];
				sq.forEach((cix) => {
					if (!h.cells.includes(cix))  addNonCandidate(cix, h.value);
				})
				clearSelectedCell();
				break

			default:
				break;
		}
		//updateCandidates();
		resetHint();
		checkGameSolved();
	}

	function showHint(e) {
		e.preventDefault();
		//console.log("showHint", hint);
		clearSelectedValue();
		var h = runHints();
		if (!h) {
			//resetHint();
			console.log("No Hints");
			setHintMsg("No Hints");
			return;
		}
		console.log("hint:", h, h.msg);
		setHintMsg(h.msg);
		setHint(h);
	}

	function select(e,s) {
		e.preventDefault();
		doSelect(s);
		calcNumbersUsed();
	}

	function doSelect(s) {
		// s: -1 - clear selected value
		// s:  0 - if selectedCell
		console.log("PMselect:", s, selectedCell);
		//console.log("forEach:", sel, s)
		var msg = null;
		if (s < 0) {
			// clear all selctions
			clearSelectedCell();
			clearSelectedValue();
		}
		else if (s > 0) {
			if (selectedCell < 0) {
				// set cell value selection
				setSelectedValue(s);
			} else {
				// set cell value
				const val = validateMove(selectedCell, s);
				console.log("val:", val);
				if (val < 0) {
					msg = "Invalid Move";
				} else if (val > 0) {
					msg = "Bad Move";
					//console.log("Bad Move:", selectedCell);
					setCellValue(selectedCell, s);
					clearSelectedCell();
					updateCandidates();
				} else {
					//console.log("Set:", sel, selectedCell)
					setCellValue(selectedCell, s);
					clearSelectedCell();
					updateCandidates();
				}
			}
		} else { // s === 0
			if (selectedCell < 0) {
				//
				clearSelectedValue();
				clearSelectedCell();
			} else {
				// clear selected cell value
				clearCellValue(selectedCell);
				updateCandidates(selectedCell);
				clearSelectedValue();
				clearSelectedCell();
			}
		}
	setMessage(msg);
	//updateCandidates();
	resetHint();
	checkGameSolved();
}

	//if (!used.current) return <Spinner />;
	//console.log("used:", numbersUsed)
	//console.log("hint:", hint);


	return (
		<div>
			<div className="flex flex-row justify-between w-full mt-6" >
			{selection.map((s) => {
				var cn = " bg-green-300";
				if (numbersUsed[s] == 9)
					cn = " bg-green-100 pointer-events-none";
				else if (selectedValue === s)
					cn = " bg-green-500";

				return (
					<div key={s} className={"flex justify-center size-8 text-xl font-bold rounded-md hover:cursor-pointer " + cn} onClick={(e) => select(e,s)} >
					{s}
					</div>
				)})
			}
				<div className="flex justify-center size-8 text-xl font-bold rounded-md hover:cursor-pointer bg-green-300" onClick={(e) => select(e,-1)} >
					&nbsp;
				</div>
			</div>
			<div className="flex flex-row mt-4">
				<div className="flex justify-center mr-4 size-8 text-xl font-bold rounded-md bg-green-400 hover:cursor-pointer " onClick={(e) => select(e,0)} >
				C
				</div>
				<div className="flex flex-row">
					<div
					className="flex justify-center size-8 text-xl font-bold rounded-md bg-green-400 hover:cursor-pointer "
					onClick={(e) => showHint(e)} >
					?
					</div>
					{ hint.msg &&
					<div
						className="ml-4 px-2 flex items-center bg-green-300 rounded-md text-sm"
						onClick={(e)=>doHint(e)}
						>
						{hint.msg}
					</div>
					}
				</div>
			</div>
			<div className="mt-4 flex text-lg font-bold text-red-600">
				{message}
			</div>
		</div>
	)

}
