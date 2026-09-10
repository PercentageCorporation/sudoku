import { cellStore, useCellActions, useCells, useHintStore } from "../store/store";
import { getRemainingValues } from "../utilities/utilities";
import { RCS, bstyles } from "../utilities/constants";
import CandidatesModal from "./CandidatesModal";
import Spinner from "./Spinner";
import "/src/styles/borders.css";

function Candidates({ix}) {
	const selectedValue = cellStore.getState().selectedValue;
	const can = cellStore.getState().cells[ix].candidates;
	const noncan = cellStore.getState().cells[ix].noncandidates;
	//console.log(ix, can, noncan);
	const clist = [1, 2, 3, 4, 5, 6, 7, 8, 9];

	return (
		<div className="grid grid-cols-3 leading-none pt-0.5">
			{clist.map((c) => {
				var val = c.toString();
				var cn = " font-normal";
				if (c === selectedValue) cn = " font-bold text-orange-600"
				if (!can.includes(c))
					val = "";
				else if (noncan.includes(c))
					cn = " font-thin"

				return (
					<div key={c}
						className={"flex justify-center items-center w-full min-h-[12px] text-[12px] " + cn}
						>
						{val}
					</div>
				);
			})}
		</div>
	);
}

function Cell({ix}) {
	const { getCell, setCellValue, setSelectedValue, clearSelectedValue, setSelectedCell, clearSelectedCell } = useCellActions();
	const { setEditCandidates, updateCandidates, calcNumbersUsed } = useCellActions();
	const { selectedValue, selectedCell } = cellStore();

	const { hint, resetHint } = useHintStore();
	const cell = cellStore.getState().cells[ix];
	//console.log("Cell:", ix, typeof(ix), cells);

	function selectCell(e, ix) {
		e.preventDefault();
		const cs = getCell(ix);
		console.log("selectCell:", ix, cs);
		setSelectedCell(ix);
		if (cs.value > 0) {
			setSelectedValue(cs.value);
		} else {
			clearSelectedValue();
		}
		calcNumbersUsed();
	}

	function doubleClick(e, ix) {
		e.preventDefault();
		// auto fill if possible
		const rv = getRemainingValues(ix);
		//console.log("autofill:", ix, rv);
		if (rv.length !== 1) {
			console.log("setEditCandidates:", ix);
			setEditCandidates(ix);
			return;
		}
		const val = rv[0];
		setCellValue(ix, val);
		updateCandidates();
		setSelectedValue(val);
		clearSelectedCell();
		calcNumbersUsed();
		resetHint();
	}

	// set highlighting
	var rcs = RCS[ix];
	var selMode = 0;
	if (cell.value > 0 ) {
		if (selectedCell === ix)
			selMode = 2;
		else if (cell.value === selectedValue)
			selMode = 1;

		// check for invalid value
		if (cell.value > 0 && cell.solutionValue > 0 && cell.value !== cell.solutionValue) selMode = 4;
	}
	else if (hint.type) {
		switch (hint.type) {
			case "nakedPair":
				if (hint.cells.includes(ix))
					selMode = 3;
				else if (hint.targets.includes(ix))
					selMode = 2;
			break;

			case "pointingPair":
				if (hint.cells.includes(ix))
					selMode = 3;
				else if (hint.row === rcs[0] || hint.col === rcs[1]) {
					if (cell.activecandidates.includes(hint.value)) selMode = 2;
				}
				break;

			case "pointingPairs2":
				if (hint.cells.includes(ix))
					selMode = 3;
				else if (hint.row === rcs[0] || hint.col === rcs[1]) {
					if (cell.activecandidates.includes(hint.values[0])
						|| cell.activecandidates.includes(hint.values[1])) selMode = 2;
				}
				break;

			case "pointingPairSquare":
				if (hint.cells.includes(ix))
					selMode = 3;
				else if (hint.square === rcs[2]) {
					if (cell.activecandidates.includes(hint.value)) selMode = 2;
				}
				break;

			case 'xWing':
				if (hint.cells.includes(ix))
					selMode = 3;
			else if (hint.targets.includes(ix))
				selMode = 2;
			break;

			case 'row':
				if (hint.row >= 0 && hint.row === rcs[0]) selMode = 5;
				break;

			case 'col':
				if (hint.col >= 0 && hint.col === rcs[1]) selMode = 5;
				break;

			default:
				if (hint.cells[0] === ix) {
					//console.log(hint);
					selMode = 6;
				}
				break;
		}
	} else {
		if (selectedCell === ix) selMode = 2;
	}

	var cn = "bg-white";
	switch (selMode) {
		case 1:
			cn = "bg-green-200";
			break;
		case 2:
			cn = "bg-green-300";
			break;
		case 3:
			cn = "bg-green-400";
			break;
		case 4:
			cn = "bg-red-200";
			break;
		case 5:
			cn = "bg-orange-100";
			//console.log(ix, rcs, hint);
			break;
		case 6:
			cn = "bg-orange-200";
			break;
		case 7:
			cn = "bg-slate-200";
			break;
	}
	const bs = bstyles[ix];

	//console.log("Cell:", ix, selectedCell, cn);
	return (
		<div
			className={"size-11 " + cn + bs}
			onDoubleClick={(e)=>doubleClick(e,ix)}
			onClick={(e)=>selectCell(e, ix)}
			>
			{cell.value === 0 &&
					<Candidates ix={ix} />
			}
			{cell.value !== 0 &&
				<div className="flex justify-center items-center w-full h-full text-3xl font-bold">
						{cell.value}
				</div>
			}
		</div>
	);
}

function Grid9({y}) {
	//console.log("Grid9:", y);
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	return (
		<>
			<div className="grid grid-cols-3 w-full">
			{
			index.map((x, ix) => {
				const cellIx = (y*9) + x;
				return (<Cell key={ix} ix={cellIx} />)
			})
			}
			</div>
		</>
	);
}

export default function GameGrid() {
	const { clearSelectedCell } = useCellActions();
	//console.log("GameGrid");
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	function modalConfirm() {
		console.log("modalConfirm");
		clearSelectedCell();
	}

	return (
		<div className="">
			<CandidatesModal onConfirm={modalConfirm} />
			<div className="px-1 grid grid-cols-3 w-full">
				{
					index.map((y, ix) => { return (<Grid9 key={ix} y={y} />) })
				}
			</div>
		</div>
	);
}
