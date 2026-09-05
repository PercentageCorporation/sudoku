import { cellStore, useCellActions, useCells, useHintStore } from "../store/store";
import { getRemainingValues, RCS, bstyles } from "../utilities/utilities";
import CandidatesModal from "./CandidatesModal";
import Spinner from "./Spinner";
import "/src/styles/borders.css";

function Candidates({ix}) {
	const selectedValue = cellStore.getState().selectedValue;
	const can = cellStore.getState().cells[ix].candidates;
	const noncan = cellStore.getState().cells[ix].noncandidates;
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
					cn = " font-extralight"

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
	const { getCell, setCellValue, setSelectedValue, setCellSelected, clearSelected } = useCellActions();
	const { setEditCandidates, updateCandidates, calcNumbersUsed } = useCellActions();
	const { selectedValue } = cellStore();

	const { hint, resetHint } = useHintStore();
	const cell = cellStore.getState().cells[ix];
	//console.log("Cell:", ix, typeof(ix), cells);

	function selectCell(e, ix) {
		e.preventDefault();
		const cs = getCell(ix);
		//console.log("selectCell:", ix, cs);
		clearSelected();
		if (cs.value > 0) {
			setSelectedValue(cs.value);
			setCellSelected(ix);
		} else {
			setSelectedValue(-1);
			setCellSelected(ix);
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
		clearSelected();
		calcNumbersUsed();
		resetHint();
	}
	var rcs = RCS[ix];
	var selMode = (cell.value > 0 && cell.value === selectedValue) ? 1 : 0;
	selMode += cell.selected ? 2 : 0;
	if (cell.value > 0 && cell.solutionValue > 0 && cell.value !== cell.solutionValue) selMode = 4;
	if (hint.type === 'row' && hint.row >= 0 && hint.row === rcs[0]) selMode = 5;
	if (hint.type === 'col' && hint.col >= 0 && hint.col === rcs[1]) selMode = 5;
	if (hint.type && hint.cell === ix) selMode = 6;
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
	const { clearSelected } = useCellActions();
	//console.log("GameGrid");
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	function modalConfirm() {
		console.log("modalConfirm");
		clearSelected();
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
