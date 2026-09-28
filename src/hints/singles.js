import { Rows, Cols, Squares, cellRow, cellCol, cellSquare } from '/src/utilities/constants';
import { cells, rcsCounts } from '/src/hints/hints';


//*****************************************************************************
// common functions

function firstSingleValue(arr) {
	for (var i=1; i<10; ++i)
		if (arr[i] == 1)
			return i;
	return 0;
}

function hasSingleValueHint(arr) {
	var counts = rcsCounts(arr);
	var sv = firstSingleValue(counts);	// sv only occurs once in the rcs
	if (sv > 0) {
		var pos = findValueInRCS(arr, sv);	// find the candidate in the rcs
		//console.log("rsc:", r, sv, pos, counts);
		var rs = {
			type: 'cell',
			row: null,
			col: null,
			square: null,
			cells: [pos.cell],
			offset: pos.offset,
			value: sv,
			msg: ""
		}
		return rs;
	}
	return null;
}

// find the first occurance of the value in the row/col/sq
function findValueInRCS(arr, val) {
	for (var i=0; i<9; ++i) {
		const cix = arr[i];
		const cell = cells[cix];
		//console.log("fvir", rix, val, cix, cell);
		if (cell.value > 0) continue;
		if (cell.activecandidates.includes(val)) return {cell: cix, offset: i};
	}
	return null;
}

//*****************************************************************************
// Single Counts

export function singleCounts() {
	var singleCounts = [];
	for (var i=0; i<9; ++i) {
		var hassv = hasSingleValueHint(Rows[i])
		if (hassv) {
			hassv.row = i;
			hassv.msg = `Single: Row: ${i+1}, Cell:  ${hassv.cells}, Value: ${hassv.value}`
			singleCounts.push(hassv)
		}
		var hassv = hasSingleValueHint(Cols[i])
		if (hassv) {
			hassv.col = i;
			hassv.msg = `Single: Column: ${i+1}, Cell:  ${hassv.cells}, Value: ${hassv.value}`
			singleCounts.push(hassv)
		}
		var hassv = hasSingleValueHint(Squares[i])
		if (hassv) {
			hassv.square = i;
			hassv.msg = `Single: Square: ${i+1}, Cell:  ${hassv.cells}, Value: ${hassv.value}`
			singleCounts.push(hassv)
		}
	}

	if (singleCounts.length === 0) return null;
	console.log("singleCounts",singleCounts);
	return singleCounts;
}

//*****************************************************************************
// singletons

// returns an array of cells which only have one candidate
export function singletons() {
	var singletons = [];
	for (var ix=0; ix<81; ++ix) {
		var c = cells[ix];
		const ac = c.activecandidates;
		if (c.value === 0 && ac.length === 1){
			//console.log("single:", ix, c.candidates[0]);
			var sv = c.activecandidates[0];
			var s = {
				type: 'cell',
				row: cellRow[ix],
				col: cellCol[ix],
				square: cellSquare[ix],
				cells: [ix],
				offset: null,
				value: sv,
				msg: `Single: Cell:  ${ix+1}, Value: ${sv}`
			}
			singletons.push(s);
		}
	};
	if (singletons.length == 0) return null;
	return singletons;
}

