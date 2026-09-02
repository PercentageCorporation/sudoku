import { cellStore } from "../store/store";
import { sudoku_generate } from "./generator";

const getCell = cellStore.getState().getCell;
const cells = cellStore.getState().cells;
const cellsLoaded = cellStore.getState().cellsLoaded;

export function getNewGame(dif) {
	let { board, solution } = sudoku_generate(dif, true);
	console.log(board);
	console.log(solution);

	var sudoix = 0;
	var sqix = 0;
	var supuzzle = [[], [], [], [], [], [], [], [], []];
	while (sqix < 9) {
		for (var row = 0; row < 9; row += 3) {
			for (var i3 = 0; i3 < 3; ++i3) {
				for (var x = 0; x < 3; ++x) {
					const off = sqix + i3;
					const val = board[sudoix++];
					supuzzle[off].push(val === "." ? 0 : Number(val));
				}
			}
		}
		sqix += 3;
	}
	//console.log(supuzzle);
	var puzzleGrid = [];
	for (let x = 0; x < 9; ++x)
		for (let y = 0; y < 9; ++y) puzzleGrid.push(supuzzle[x][y]);

		var sudoix = 0;
	var sqix = 0;
	var susolution = [[], [], [], [], [], [], [], [], []];
	while (sqix < 9) {
		for (var row = 0; row < 9; row += 3) {
			for (var i3 = 0; i3 < 3; ++i3) {
				for (var x = 0; x < 3; ++x) {
					const off = sqix + i3;
					//console.log(sqix, row, i3, x, off);
					susolution[off].push(Number(solution[sudoix++]));
				}
			}
		}
		sqix += 3;
	}
	//console.log(susolution);
	var solutionGrid = [];
	for (let x = 0; x < 9; ++x)
		for (let y = 0; y < 9; ++y) solutionGrid.push(susolution[x][y]);

	return {puzzleGrid, solutionGrid};
}

export function getCandidates(cellIx) {
	const c = getCell(cellIx);
	const ev = getExclusionValues(cellIx);

}

export function getExclusionValues(cellIx) {
	const values = [];
	const rowix = cellRow[cellIx];
	const colix = cellCol[cellIx];
	//console.log("valInRow:", value, cellIx, rowix, colix);
	//console.log(rows[rowix], cols[colix]);
	rows[rowix].map(rix => {
		const r = getCell(rix);
		if (r.value > 0 && !values.includes(r.value)) values.push(r.value);
	})
	cols[colix].map(cix => {
		const c = getCell(cix);
		if (c.value > 0 && !values.includes(c.value)) values.push(c.value);
	})
	const sqix = Math.floor(cellIx/9);
	//console.log(sqix, squares[sqix]);
	squares[sqix].map(six => {
		const s = getCell(six);
		if (s.value > 0 && !values.includes(s.value)) {
			//console.log(six, s);
			values.push(s.value);
		}
	})

	return values;
}

export function getRemainingValues(cellIx) {
	var values = [1,2,3,4,5,6,7,8,9];
	const rowix = cellRow[cellIx];
	const colix = cellCol[cellIx];
	//console.log("valInRow:", value, cellIx, rowix, colix);
	//console.log(rows[rowix], cols[colix]);
	rows[rowix].map(rix => {
		const r = getCell(rix);
		if (r.value > 0) values = values.filter(v => v !== r.value);
	})
	cols[colix].map(cix => {
		const c = getCell(cix);
		if (c.value > 0) values = values.filter(v => v !== c.value);
	})
	const sqix = Math.floor(cellIx/9);
	//console.log(sqix, squares[sqix]);
	squares[sqix].map(six => {
		const s = getCell(six);
		if (s.value > 0) values = values.filter(v => v !== s.value);
	})

	return values;
}

export function valueInRowColSq(cellIx, value) {
	var included = false;
	const rowix = cellRow[cellIx];
	const colix = cellCol[cellIx];
	//console.log("valInRow:", value, cellIx, rowix, colix);
	//console.log(rows[rowix], cols[colix]);
	rows[rowix].map(rix => {
		const r = getCell(rix);
		//console.log(rix, r);
		if (r.value === value) included=true;
	})
	cols[colix].map(cix => {
		const c = getCell(cix);
		//console.log(cix, c);
		if (c.value === value) included=true;
	})
	const sqix = Math.floor(cellIx/9);
	squares[sqix].map(six => {
		const s = getCell(six);
		//console.log(cix, c);
		if (s.value === value) included=true;
	})

	return included;
}

// -1: still in progress
//  0: finished
//  1: finished, alternate solution
export function isGameSolved() {
	if (!cellsLoaded) return -1;
	var nonStandard = false;
	for (var i=0; i<81; ++i) {
		const c = cells[i];
		if (c.value === 0) return -1;
		if (c.value !== c.solutionValue) nonStandard = true;
	}

	if (!validateBoard) return -2;
	return nonStandard ? 1 : 0;
}

export function validateBoard() {
	// check each row for duplicates
	for (var i=0; i<9; ++i) {
		const row = rows[i];
		var vals = [];
		for (var j=0; j<9; ++j) {
			const cix = row[j];
			const val = cells[cix].value;
			if (val > 0) {
				if (vals.includes(val)) return false;
				vals.push(val);
			}
		}
	}
	// check each col for duplicates
	for (var i=0; i<9; ++i) {
		const col = cols[i];
		var vals = [];
		for (var j=0; j<9; ++j) {
			const cix = col[j];
			const val = cells[cix].value;
			if (val > 0) {
				if (vals.includes(val)) return false;
				vals.push(val);
			}
		}
	}
	// check each square for duplicates
	for (var i=0; i<9; ++i) {
		const sq = squares[i];
		var vals = [];
		for (var j=0; j<9; ++j) {
			const cix = sq[j];
			const val = cells[cix].value;
			if (val > 0) {
				if (vals.includes(val)) return false;
				vals.push(val);
			}
		}
	}

	return true;
}

// -1: value already in row col
// 	0: valid move
// >0: value does not match solution
export function validateMove(cellIx, value) {
	const rc = valueInRowColSq(cellIx, value);
	if (rc) return (-1);

	const sc = getCell(cellIx);
	if (value !== sc.originalValue) {
		return sc.originalValue;
	}
	return 0;
}



export const rows = [
	[ 0, 1, 2,	 9,10,11,	18,19,20],
	[ 3, 4, 5,	12,13,14,	21,22,23],
	[ 6, 7, 8,	15,16,17,	24,25,26],

	[27,28,29,	36,37,38,	45,46,47],
	[30,31,32,	39,40,41,	48,49,50],
	[33,34,35,	42,43,44,	51,52,53],

	[54,55,56,	63,64,65,	72,73,74],
	[57,58,59,	66,67,68,	75,76,77],
	[60,61,62,	69,70,71,	78,79,80]
	];

export const cols = [
	[ 0, 3, 6,	27,30,33,	54,57,60],
	[ 1, 4, 7,	28,31,34,	55,58,61],
	[ 2, 5, 8,	29,32,35,	56,59,62],

	[ 9,12,15,	36,39,42,	63,66,69],
	[10,13,16,	37,40,43,	64,67,70],
	[11,14,17,	38,41,44,	65,68,71],

	[18,21,24,	45,48,51,	72,75,78],
	[19,22,25,	46,49,52,	73,76,79],
	[20,23,26,	47,50,53,	74,77,80]
	];

export const squares = [
	[ 0, 1, 2, 3, 4, 5, 6, 7, 8],
	[ 9,10,11,12,13,14,15,16,17],
	[18,19,20,21,22,23,24,25,26],
	[27,28,29,30,31,32,33,34,35],
	[36,37,38,39,40,41,42,43,44],
	[45,46,47,48,49,50,51,52,53],
	[54,55,56,57,58,59,60,61,62],
	[63,64,65,66,67,68,69,70,71],
	[72,73,74,75,76,77,78,79,80]
	];

export const cellCol = [
0,1,2,0,1,2,0,1,2,3,4,5,3,4,5,3,4,5,6,7,8,6,7,8,6,7,8,
0,1,2,0,1,2,0,1,2,3,4,5,3,4,5,3,4,5,6,7,8,6,7,8,6,7,8,
0,1,2,0,1,2,0,1,2,3,4,5,3,4,5,3,4,5,6,7,8,6,7,8,6,7,8
];

export const cellRow = [
0,0,0,1,1,1,2,2,2,0,0,0,1,1,1,2,2,2,0,0,0,1,1,1,2,2,2,
3,3,3,4,4,4,5,5,5,3,3,3,4,4,4,5,5,5,3,3,3,4,4,4,5,5,5,
6,6,6,7,7,7,8,8,8,6,6,6,7,7,7,8,8,8,6,6,6,7,7,7,8,8,8
];

export const cellSquare = [

];

