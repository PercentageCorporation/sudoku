import { cellStore } from "../store/store";
import { getExclusionValues, getRemainingValues } from "../utilities/utilities";

function Candidates({ix}) {
	const clist = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const { getCell, selectedValue } = cellStore();
	const cell = getCell(Number(ix));
	//const ev = getExclusionValues(ix);
	const rv = getRemainingValues(ix);
	//console.log(ix, rv);

	return (
		<div className="grid grid-cols-3">
			{clist.map((c) => {
				var val = c.toString();
				var cn = " font-extralight";
				if (c === selectedValue) cn = " font-bold text-orange-600"
				if (!rv.includes(c)) val = "";

				return (
					<div key={c}
						className={"flex justify-center items-center min-w-full h-full text-[10px] " + cn}
						>
						{val}
					</div>
				);
			})}
		</div>
	);
}

function Cell({ix}) {
	//console.log("Cell:", ix);
	const { getCell, selectedCell, selectedValue, setCellValue, setSelectedValue, setSelectedCell } = cellStore();
	const cell = getCell(Number(ix));

	function selectCell(e, ix) {
		e.preventDefault();
		const cs = getCell(ix);
		//console.log("selectCell:", ix, cs);
		if (cs.value > 0) {
			setSelectedValue(cs.value);
			setSelectedCell(ix);
		} else {
			setSelectedValue(-1);
			setSelectedCell(ix);
		}
	}

	function doubleClick(e, ix) {
		e.preventDefault();
		// auto fill if possible
		const rv = getRemainingValues(ix);
		//console.log("autofill:", ix, rv);
		if (rv.length !== 1) {
			return;
		}
		const val = rv[0];
		setSelectedValue(val);
		setSelectedCell(-1);
		setCellValue(ix, val);
	}

	var selMode = (cell.value > 0 && cell.value === selectedValue) ? 1 : 0;
	selMode += ix === selectedCell ? 2 : 0;
	if (cell.value > 0 && cell.value !== cell.solutionValue) selMode = 4;
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
	}
	//console.log("Cell:", ix, selectedCell, cn);
	return (
		<div
			className={"border border-black-300 size-11 " + cn}
			onDoubleClick={(e)=>doubleClick(e,ix)}
			onClick={(e)=>selectCell(e, ix)}
			>
			{cell.value === 0 &&
					<Candidates ix={ix} />
			}
			{cell.value !== 0 &&
				<div className="flex justify-center items-center w-full h-full text-xl font-bold">
						{cell.value}
				</div>
			}
		</div>
	);
}

function Grid9({y}) {
	//console.log("Grid9:", y, typeof(y));
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	return (
		<>
			<div className="grid grid-cols-3 w-full border border-black-600">
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
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	return (
		<div className="border">
			<div className="grid grid-cols-3 w-full border border-black-900">
				{
					index.map((y, ix) => { return (<Grid9 key={ix} y={y} />) })
				}
			</div>
		</div>
	);
}
