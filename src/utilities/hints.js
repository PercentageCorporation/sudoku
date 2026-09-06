import { cellStore } from "/src/store/store";
import {rows,cols,squares} from '/src/utilities/constants';


export function runHints() {
	var result;
	result = singletons();
	if (result) return result;
	result = rowSingleCounts();
	if (result) return result;
	result = colSingleCounts();
	if (result) return result;
	result = sqSingleCounts();
	if (result) return result;
	result = findNakedPairs();
	return null;
}

function hasSingleValue(ar) {
	for (var i=1; i<10; ++i)
		if (ar[i] == 1)
			return i;
	return 0;
}

// count occurances of canditates in cell row
export function rowSingleCounts() {
	const getCells = cellStore.getState().actions.getCells;
	const cells = getCells();
	for (var r=0; r<9; ++r) {
		var counts = [0,0,0,0,0,0,0,0,0,0];
		var row = rows[r];
		//console.log(row);
		for (var i=0; i<9; ++i) {
			const cix = row[i];
			const cell = cells[cix];
			if (cell.value > 0) continue;
			const candid = cell.candidates.filter(function (x) {return cell.noncandidates.indexOf(x) < 0;});
			//console.log(cix, candid);
			candid.map((c) => {
				counts[c] += 1;
			});
		}
		var sv = hasSingleValue(counts);
		var pos = findValueInRow(r, sv, cells);
		if (sv > 0) {
			//console.log("rsc:", r, sv, counts);
			return {type: 'row', index: r, cell: pos.cell, offset: pos.offset, value: sv};
		}
	}
	return null;
}

function findValueInRow(rix, val, cells) {
	var row = rows[rix];
	for (var i=0; i<9; ++i) {
		const cix = row[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.candidates;
		//console.log(cix, candid);
		if (candid.includes(val)) return {cell: cix, offset: i};
	}
	return -1;
}

export function colSingleCounts() {
	const cells = cellStore.getState().cells;

	for (var i=0; i<9; ++i) {
		var counts = [0,0,0,0,0,0,0,0,0,0];
		var col = cols[i];
		for (var j=0; j<9; ++j) {
			const cix = col[j];
			const cell = cells[cix];
			if (cell.value > 0) continue;
			const candid = cell.candidates;
			candid.map((c) => {
				counts[c] += 1;
			});
		}
		var sv = hasSingleValue(counts);
		var pos = findValueInCol(i, sv, cells);
		if (sv > 0) {
			//console.log("csc:", i, sv, counts);
			return {type: 'col', index: i, cell: pos.cell, offset: pos.offset, value: sv};
		}
	}
	return null;
}

function findValueInCol(cix, val, cells) {
	var col = cols[cix];
	for (var i=0; i<9; ++i) {
		const cix = col[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.candidates;
		//console.log(cix, candid);
		if (candid.includes(val)) return {cell: cix, offset: i+1};
	}
	return -1;
}

export function sqSingleCounts() {
	const cells = cellStore.getState().cells;

	for (var i=0; i<9; ++i) {
		var counts = [0,0,0,0,0,0,0,0,0,0];
		var csq = squares[i];
		for (var j=0; j<9; ++j) {
			const cix = csq[j];
			const cell = cells[cix];
			if (cell.value > 0) continue;
			const candid = cell.candidates;
			candid.map((c) => {
				counts[c] += 1;
			});
		}
		var sv = hasSingleValue(counts);
		var pos = findValueInSq(i, sv, cells);
		if (sv > 0) {
			//console.log("ssc:", i, sv, counts)
			return {type: 'square', index: i, cell: pos.cell, offset: pos.offset, value: sv};
		}
	}
	return null;
}

function findValueInSq(six, val, cells) {
	var sq = squares[six];
	for (var i=0; i<9; ++i) {
		const cix = sq[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.candidates;
		//console.log(cix, candid);
		if (candid.includes(val)) return {cell: cix, offset: i};
	}
	return -1;
}

// returns an array of cells which only have one candidate
export function singletons() {
	const cells = cellStore.getState().cells;
	for (var ix=0; ix<81; ++ix) {
		var c = cells[ix];
		const candid = c.candidates.filter(function (x) {return c.noncandidates.indexOf(x) < 0;});

		if (c.value === 0 && candid.length === 1){
			//console.log("single:", ix, c.candidates[0]);
			return {type: 'cell', index: -1, cell: ix, offset: ix, value: candid[0]};
		}
	};
	return null;
}

// return an array of cells for which a candidate is the only occurance in the r/c/s
export function singlevaluercs() {
	const cells = cellStore.getState().cells;
	for (var ix=0; ix<81; ++ix) {
		var c = cells[ix];
		if (c.value === 0 && c.activecandidates.length === 1){
			//console.log("single:", ix, c.candidates[0]);
			return {type: 'cell', index: -1, cell: ix, offset: ix, value: c.activecandidates[0]};
		}
	};
	return null;

}

// return an array of cells which contain naked pairs
function findNakedPairs() {
	var np = [];
	const cells = cellStore.getState().cells;

	// find all naked pairs
	for (var ix=0; ix<81; ++ix) {
		var c = cells[ix];
		var ac = c.activecandidates;
		if (c.value === 0 && ac.length === 2){
			var dup = false;
			//console.log("npl:", np.length, ac[0], ac[1]);
			for (var j = 0; j < np.length; ++ j) {
				var npj = np[j];
				// check if we already have this pair
				if (ac.includes(npj[0]) && ac.includes(npj[1])) dup = true;
			}
			if (!dup) {
				np.push(ac);
				//console.log("pair added:", ac, np.length);
			}
		}
	};

	console.log("naked pairs:", np);

	var pairRows = [];	// rows with 2 naked pairs
	var rowPairs = [];	// pairs in those rows
	var pairCols = [];	// cols with 2 naked pairs
	var colPairs = [];	// pairs in those cols
	var pairSqs = [];	// squares with 2 naked pairs
	var sqPairs = [];	// pairs in those squares

	// count the number of pair cells in each row
	var npl = np.length;
	// for each pair, count the number of occurances in the row
	for (var i=0; i<npl; ++i) {
		// for each row
		var npi = np[i];
		for (var j=0; j<9; ++j) {
			//console.log("row", j, npi);
			var row = rows[j];
			// for each cell in the row
			var count = 0;
			for (var k=0; k<9; ++k) {
				var cix = row[k];
				var c = cells[cix];
				if (c.value > 0) continue;
				var ac = c.activecandidates;
				if (ac.length !== 2) continue;	// skip non pairs
				//console.log(k, cix, ac, npi );

				if (ac.includes(npi[0]) && ac.includes(npi[1])) ++count;

			}
			//console.log("count:", count);
			if (count === 2) {
				pairRows.push(j)
				rowPairs.push(npi);
				console.log("row added:", j);
			}
		};
	}

	console.log("rows", pairRows);

	// count the number of pair cells in each col
	var npl = np.length;
	// for each pair, count the number of occurances in the col
	for (var i=0; i<npl; ++i) {
		var npi = np[i];
		// for each col
		for (var j=0; j<9; ++j) {
			//console.log("row", j, npi);
			var col = cols[j];
			// for each cell in the row
			var count = 0;
			for (var k=0; k<9; ++k) {
				var cix = col[k];
				var c = cells[cix];
				if (c.value > 0) continue;
				var ac = c.activecandidates;
				if (ac.length !== 2) continue;	// skip non pairs
				//console.log(k, cix, ac, npi );

				if (ac.includes(npi[0]) && ac.includes(npi[1])) ++count;

			}
			//console.log("count:", count);
			if (count === 2) {
				pairCols.push(j)
				colPairs.push(npi);
				console.log("col added:", j);
			}
		};
	}

	console.log("cols", pairCols);

	// count the number of pair cells in each square
	var npl = np.length;
	// for each pair, count the number of occurances in the square
	for (var i=0; i<npl; ++i) {
		var npi = np[i];
		// for each square
		for (var j=0; j<9; ++j) {
			//console.log("row", j, npi);
			var sq = squares[j];
			// for each cell in the row
			var count = 0;
			for (var k=0; k<9; ++k) {
				var cix = sq[k];
				var c = cells[cix];
				if (c.value > 0) continue;
				var ac = c.activecandidates;
				if (ac.length !== 2) continue;	// skip non pairs
				//console.log(k, cix, ac, npi );

				if (ac.includes(npi[0]) && ac.includes(npi[1])) ++count;

			}
			//console.log("count:", count);
			if (count === 2) {
				pairSqs.push(j)
				sqPairs.push(npi);
				console.log("sq added:", j);
			}
		};
	}

	console.log("squares", pairSqs);


	console.log("ix:", pairRows, pairCols, pairSqs);
	console.log("np:", rowPairs, colPairs, sqPairs);

	return {rows: pairRows, cols: pairCols, squares: pairSqs};
}



