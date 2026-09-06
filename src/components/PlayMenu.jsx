import { useState, useEffect } from "react";
import { cellStore, useHintStore, useCellActions } from "../store/store";
import { validateMove } from "../utilities/utilities";
import { RCS } from "../utilities/constants";
import { runHints } from "../utilities/hints";
import { Hint } from "../store/store";
//import Spinner from "./Spinner";

export default function PlayMenu() {
	const { selectedValue } = cellStore();
	const { setCellValue, setSelectedValue, setCellSelected, clearSelected, getSelected } = useCellActions();
	const { checkGameSolved, calcNumbersUsed } = useCellActions();
	const { updateCandidates } = useCellActions();
	const { gameComplete, numbersUsed } = cellStore();
	const { hint, setHint, setHintMsg, resetHint } = useHintStore();
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
		var h = runHints();
		if (!h) return;
		console.log("doHint", h);
		var cix = h.cell;
		var v = h.value;
		setCellValue(cix, v);
		clearSelected();
		updateCandidates();
		setSelectedValue(v);
		resetHint();
		checkGameSolved();
	}

	function showHint(e) {
		e.preventDefault();
		//console.log("showHint", hint);
		var h = runHints();
		if (!h) {
			//resetHint();
			console.log("No Hints");
			setHintMsg("No Hints");
			return;
		}
		var newHint = {...Hint}
		newHint.type = h.type;
		newHint.cell = h.cell;
		var rcs = RCS[newHint.cell];
		newHint.row = rcs[0];
		newHint.col = rcs[1];
		newHint.sq = rcs[2];

		var type = h.type;
		var hmsg;
		switch (type) {
			case 'row':
				hmsg = `Row ${h.index}, cell ${h.cell}, value ${h.value}`;
				break;
			case 'col':
				hmsg = `Column ${h.index}, cell ${h.cell}, value ${h.value}`;
				break;
			case 'square':
				hmsg = `Square ${h.index}, cell ${h.cell}, value ${h.value}`;
				break;
			case 'cell':
				hmsg = `Cell ${h.cell+1}, value ${h.value}`;
				break;
		}
		newHint.msg = hmsg;
		//console.log("hint:", h, newHint, rcs);
		setHint(newHint);
		setCellSelected(h.cell);
	}

	function select(e,s) {
		e.preventDefault();
		doSelect(s);
		calcNumbersUsed();
	}

	function doSelect(s) {
		const selected = getSelected();
		console.log("select:", s, selected, selected.length);
		selected.forEach((sel) => {
			//console.log("forEach:", sel, s)
			if (s > 0) {
				const val = validateMove(sel, s);
				//console.log("val:", val);
				if (val < 0) {
					setMessage("Invalid Move");
				} else if (val > 0) {
					setMessage("Bad Move");
					//console.log("Bad Move:", s);
					setCellValue(sel, s);
				} else {
					//console.log("Set:", sel, s)
					setMessage(null);
					setCellValue(sel, s);
					clearSelected();
				}
			} else {
				setCellValue(sel, s);
				clearSelected();
			}
		});
		if (s > 0) setSelectedValue(s);
		updateCandidates();
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
						className="ml-4 px-2 bg-green-300 rounded-md"
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
