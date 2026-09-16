import { cellStore, useCellActions } from "/src/store/store";
import {rows, cols, squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012} from '/src/utilities/constants';

var cells = [];

export function runHints() {
	var result;
	cells = cellStore.getState().cells;
	initCounts();

	result = hiddenTriples();
	if (1===1) return[];
	result = swordfish();
	if (result) return result[0];
	result = hiddenTriples();
	if (result) return result[0];
	result = singletons();
	if (result) return result[0];
	result = rowSingleCounts();
	if (result) return result[0];
	result = colSingleCounts();
	if (result) return result[0];
	result = sqSingleCounts();
	if (result) return result[0];
	result = findPointingPairsSquare();
	if (result) return result[0];
	result = pointingPairsRowCol();
	if (result) return result[0];
	result = findNakedPairs();
	if (result) return result[0];
	result = findNakedTriples();
	if (result) return result[0];
	result = XWing();
	if (result) return result[0];
	result = XYWing();
	if (result) return result[0];
	result = XYZWing();
	if (result) return result[0];

	return null;
}

// **********************************************************************

// count how many times a value occurs in a row/col/square
var vRows = [];
var vCols = [];
var vSqs = [];

// count the instances of each value in each row/col
// we need columns[rows] containing exactly 2, and rows[columns] of 2 or more
// we need columns[rows] containing exactly 3, and rows[columns] of 3 or more
var rCounts2 = [[],[],[],[],[],[],[],[],[],[]];
var cCounts2 = [[],[],[],[],[],[],[],[],[],[]];
var rCounts3 = [[],[],[],[],[],[],[],[],[],[]];
var cCounts3 = [[],[],[],[],[],[],[],[],[],[]];
var rCounts23 = [[],[],[],[],[],[],[],[],[],[]];
var cCounts23 = [[],[],[],[],[],[],[],[],[],[]];
var rCounts3cols = [[],[],[],[],[],[],[],[],[],[]];

var vRowPT = [];
var vColPT = [];
var vSqPT = [];



// **********************************************************************

function initCounts() {

	// count how many times a value occurs in a row/col/square
	vRows = [];
	vCols = [];
	vSqs = [];

	// count the instances of each value in each row/col
	// we need columns[rows] containing exactly 2, and rows[columns] of 2 or more
	// we need columns[rows] containing exactly 3, and rows[columns] of 3 or more
	rCounts2 = [[],[],[],[],[],[],[],[],[],[]];
	cCounts2 = [[],[],[],[],[],[],[],[],[],[]];
	rCounts3 = [[],[],[],[],[],[],[],[],[],[]];
	cCounts3 = [[],[],[],[],[],[],[],[],[],[]];
	rCounts23 = [[],[],[],[],[],[],[],[],[],[]];
	cCounts23 = [[],[],[],[],[],[],[],[],[],[]];
	rCounts3cols = [[],[],[],[],[],[],[],[],[],[]];

	vRowPT = [];
	vColPT = [];
	vSqPT = [];



	// get the value counts for all rows/columns/squares
	for (var i=0; i<9; i++) {
		var rc = rowCounts(i);
		var cc = colCounts(i);
		var sc = sqCounts(i);
		vRows.push(rc);
		vCols.push(cc);
		vSqs.push(sc);
	}
	//console.log(vRows, vCols, vSqs);

	for (var v=1; v<10; v++) {
		for (var i=0; i<9; i++) {
			var rc = vRows[i][v];
			var cc = vCols[i][v];
			if (rc === 2) rCounts2[v].push(i);
			if (rc === 3) rCounts3[v].push(i);
			if (rc === 3) rCounts3cols[v].push(i);
			if (cc === 2) cCounts2[v].push(i);
			if (cc === 3) cCounts3[v].push(i);
			if (rc === 2 || rc === 3) rCounts23[v].push(i);
			if (cc === 2 || cc === 3) cCounts23[v].push(i);
		}
	}
	//console.log(rCounts2,cCounts2);
	//console.log(rCounts3,cCounts3);
	//console.log(rCounts23,cCounts23);
}

function compareArrays(a,b) {
	return(a.length === b.length && a.every((element, index) => element === b[index]));
}

function arrindex(a,b,c) {return ((c*100) + (a*10) + b)};


function makePairsTriples(ac) {
	var pt = [];

	var aclen = ac.length;
	if (aclen === 0) [];

	for (var i=0; i<aclen; i++) {
		var a1 = ac[i];
		for (var j=i+1; j<aclen; j++) {
			var a2 = ac[j];
			pt.push([a1,a2]);
			for (var k=j+1; k<aclen; k++) {
				var a3 = ac[k];
				pt.push([a1,a3]);
				pt.push([a2,a3]);
				pt.push([a1,a2,a3]);
			}
		}
	}
	console.log(ac, pt);
	return pt;
}

function rowPairsTriples(r) {
	var pt = [];
	var row = rows[r];
	for (var j=0; j<9; j++) {
		var cix = row[j];
		var cell = cells[cix];
		var ac = cell.activecandidates;
		if (cell.value > 0 || ac.length === 0) continue;
		//var pandt = findPairsTriples(ac);
		pt.push([j,ac]);
	}
	return Array.from(pt).sort();;
}

function colPairsTriples(c) {
	var pt = [];
	var col = cols[c];
	for (var j=0; j<9; j++) {
		var cix = col[j];
		var cell = cells[cix];
		var ac = cell.activecandidates;
		if (cell.value > 0 || ac.length === 0) continue;
		//var pandt = findPairsTriples(ac);
		pt.push([j,ac]);
	}
	return pt;
}

function sqPairsTriples(s) {
	var pt = [];
	var sq = squares[s];
	for (var j=0; j<9; j++) {
		var cix = sq[j];
		var cell = cells[cix];
		var ac = cell.activecandidates;
		if (cell.value > 0 || ac.length === 0) continue;
		//var pandt = findPairsTriples(ac);
		pt.push([j,ac]);
	}
	return pt;
}

function countValues(ar) {

}

function removeSingles(ap) {
	for (var value=1; value<10; ++value) {
		if (vc[value] > 3 || vc[value] < 2) {
			for (var i=0; i<ptlen; i++) {
				pt[i][1] = pt[i][1].filter(v => v != value);
			}
		}
	}

}

// for the cells in a row/col/square find any triples
function findHiddenTriple(pt) {
	// pt[]: [row/col/sq, [candidates]]
	var vc = [0,0,0,0,0,0,0,0,0,0];
	// count the values in each cell
	var ptlen = pt.length;
	for (var i=0; i<ptlen; i++) {
		//console.log("map", pt[i][1]);
		pt[i][1].map((v) => {vc[v] += 1});
	}
	// eliminate any values with a count greater than three or less than two
	for (var value=1; value<10; ++value) {
		if (vc[value] > 3 || vc[value] < 2) {
			for (var i=0; i<ptlen; i++) {
				pt[i][1] = pt[i][1].filter(v => v != value);
			}
		}
	}
	// remove any cells with one (or less) candidates
	var ptx = [];
	for (var i=0; i<ptlen; i++) {
		if (pt[i][1].length >= 2) ptx.push([pt[i][0],pt[i][1]]);
	}
	pt = ptx;

	// count candidates again
	vc = [0,0,0,0,0,0,0,0,0,0];
	// count the values in each cell
	ptlen = pt.length;
	for (var i=0; i<ptlen; i++) {
		pt[i][1].map((v) => {vc[v] += 1});
	}

	// eliminate any values with a count less than two
	for (var value=1; value<10; ++value) {
		if (vc[value] < 2) {
			for (var i=0; i<ptlen; i++) {
				pt[i][1] = pt[i][1].filter(v => v != value);
			}
		}
	}


	console.log(vc, pt, ptx);


	return [];
}

function hiddenTriples() {

	// for each row/col/square calculate the possible triples/pairs for each cell;
	for (var i=0; i<9; i++) {
		var rc = rowPairsTriples(i);
		var cc = colPairsTriples(i);
		var sc = sqPairsTriples(i);
		vRowPT.push([i, rc]);
		vColPT.push([i, cc]);
		vSqPT.push([i, sc]);
	}
	console.log(vRowPT, vColPT, vSqPT);

	// for each row/col/square find candidate houses
	var rowC = [];
	var colC = [];
	var sqC = [];
	var ht;
	for (var i=0; i<9; i++) {
		if (vRowPT[i][1].length > 2) {
			console.log("row",i);
			ht = findHiddenTriple(vRowPT[i][1]);
			if (ht) rowC.push([i,ht]);
		}
		if (vColPT[i][1].length > 2) {
			console.log("col",i);
			ht = findHiddenTriple(vColPT[i][1]);
			if (ht) colC.push([i,ht]);
		}
		if (vSqPT[i][1].length > 2) {
			console.log("sq",i);
			ht = findHiddenTriple(vSqPT[i][1]);
			if (ht) sqC.push([i,ht]);
		}
}
	console.log(rowC, colC, sqC);

	return null;
}

function includesPair(arr, v0, v1) {
	 for (var i=0; i<arr.length; ++i) {
		 if (arr[i] === v0 || arr[i] === v1) return true;
	 }
	return false;
}

// find value that only occurs once in an array
function hasSingleOccurance(arr) {
	var single = null;
	var singleCount = 0;
	for (var i=0; i<arr.length; ++i) {
		if (arr[i] > 0 ) {
			if (single != null) return null;
			single = i;
			singleCount = arr[i];
		}
	}
	if (single != null && singleCount < 2) return null;
	return single;
}

// get the cell numbers of all the cells in the square with the given value
function getSquareValueCells(value, sqix) {
	var svc = [];
	var sq = squares[sqix]; // get the square cells
	for (var i=0; i<9; ++i) {
		var cix = sq[i];	// cell index in square
		var c = cells[cix];
		if (c.value === 0 && c.activecandidates.includes(value)) {
			svc.push(cix);
		}
	}
	return svc;
}

// find pointing pairs in square
// only cells with just 2 candidates
function findPointingPairsSquare() {
	//const cells = cellStore.getState().cells;
	// find pairs in squares
	const ppsHints = [];

	for (var value=1; value<10; ++value) {

		// for each row, count the number of times a value appears in a square
		for (var r=0; r<9; ++r) {
			var row = rows[r];
			var sqCounts = [0,0,0,0,0,0,0,0,0];
			var sqCells = [[],[],[],[],[],[],[],[],[]];
			// for each cell in the row
			for (var c=0; c<9; ++c) {
				var cix = row[c];	// cell index in square
				var cel = cells[cix];
				if (cel.value === 0 && cel.activecandidates.includes(value)) {
					var sq = cellSquare[cix];
					sqCounts[sq]++;
					sqCells[sq].push(cix);
				}
			}
			var sqix = hasSingleOccurance(sqCounts);
			// sqix only occurs in one square, therefore it is a candidate for a pointing pair
			if (sqix != null) {
				//console.log(value, r, sqix, sqCounts);

				var vc = sqCounts[sqix];	// number of times value occurs in the row
				var targets = getSquareValueCells(value, sqix);	// number of times the value occurs in the square

				var vscount = targets.length;
				if (vscount > vc) {
					// we have a candidate value because there are occurances that could be eliminated
					var cels = sqCells[sqix];
					targets = targets.filter((v) => !cels.includes(v));

					//console.log("ppsr", value, r, sqix, vc, vscount, targets, sqCounts);
					var msg = `Pointing Pair: Cells: ${targets}, Value: ${value}`;
					var ppsh = {
						type: "pointingPairSquare",
						direction: "row",
						row: r,
						col: null,
						square: sqix,
						cells: cels,
						offset: null,
						value: value,
						targets: targets,
						msg: msg
					};
					ppsHints.push(ppsh);
				}
			}
		}
		for (var cx=0; cx<9; ++cx) {
			var col = cols[cx];
			var sqCounts = [0,0,0,0,0,0,0,0,0];
			var sqCells = [[],[],[],[],[],[],[],[],[]];
			// for each cell in the row
			for (var c=0; c<9; ++c) {
				var cix = col[c];	// cell index in square
				var cel = cells[cix];
				if (cel.value === 0 && cel.activecandidates.includes(value)) {
					var sq = cellSquare[cix];
					sqCounts[sq]++;
					sqCells[sq].push(cix);
				}
			}
			var sqix = hasSingleOccurance(sqCounts);
			//console.log(sqix, sqCounts);
			if (sqix != null) {
				var vc = sqCounts[sqix];
				var targets = getSquareValueCells(value, sqix);
				var vscount = targets.length;
				if (vscount > vc) {
					// we have a candidate square
					var cels = sqCells[sqix];
					targets = targets.filter((v) => !cels.includes(v));

					//console.log("ppsc", value, cx, sqix, vc, vscount, targets, sqCounts);
					var msg = `Pointing Pairs: Cells: ${targets}, Value: ${value}`;
					var ppsh = {
						type: "pointingPairSquare",
						direction: "col",
						row: null,
						col: cx,
						square: sqix,
						cells: cels,
						offset: null,
						value: value,
						targets: targets,
						msg: msg
					};
					ppsHints.push(ppsh);
				}
			}
		}
	}

	//console.log("ppsHints", ppsHints);

	if (ppsHints.length === 0) return null;
	return ppsHints;
}

function hasSingleValue(ar) {
	for (var i=1; i<10; ++i)
		if (ar[i] == 1)
			return i;
	return 0;
}

// get the activecandidate counts for the row/col/square
function rowCounts(r) {
	//const cells = cellStore.getState().cells;
	var counts = [0,0,0,0,0,0,0,0,0,0];
	var row = rows[r];
	//console.log(row);
	for (var i=0; i<9; ++i) {
		const cix = row[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.activecandidates;
		//console.log(cix, candid);
		candid.map((c) => {
			counts[c] += 1;
		});
	}
	return counts;
}

function colCounts(c) {
	//const cells = cellStore.getState().cells;
	var counts = [0,0,0,0,0,0,0,0,0,0];
	var col = cols[c];
	for (var j=0; j<9; ++j) {
		const cix = col[j];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.activecandidates;
		candid.map((c) => {
			counts[c] += 1;
		});
	}
	return counts;
}

function sqCounts(s) {
	//const cells = cellStore.getState().cells;
	var counts = [0,0,0,0,0,0,0,0,0,0];
	var csq = squares[s];
	for (var j=0; j<9; ++j) {
		const cix = csq[j];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.activecandidates;
		candid.map((c) => {
			counts[c] += 1;
		});
	}

	return counts;
}

// count occurances of canditates in cell row
function rowSingleCounts() {
	var rowSingles = [];
	for (var r=0; r<9; ++r) {
		var counts = rowCounts(r);
		var sv = hasSingleValue(counts);
		if (sv > 0) {
			var pos = findValueInRow(r, sv);
			//console.log("rsc:", r, sv, pos, counts);
			var rs = {
				type: 'cell',
				row: r,
				col: null,
				square: null,
				cells: [pos.cell],
				offset: pos.offset,
				value: sv,
				msg: `Single: Row: ${r+1}, Cell:  ${pos.cell}, Value: ${sv}`
			}
			rowSingles.push(rs);
		}
	}
	if (rowSingles.length === 0) return null;
	return rowSingles;
}

function findValueInRow(rix, val) {
	//const cells = cellStore.getState().cells;
	var row = rows[rix];
	for (var i=0; i<9; ++i) {
		const cix = row[i];
		const cell = cells[cix];
		//console.log("fvir", rix, val, cix, cell);
		if (cell.value > 0) continue;
		if (cell.activecandidates.includes(val)) return {cell: cix, offset: i};
	}
	return null;
}

function colSingleCounts() {
	var colSingles = [];
	for (var i=0; i<9; ++i) {
		var counts = colCounts(i);
		var sv = hasSingleValue(counts);
		if (sv > 0) {
			var pos = findValueInCol(i, sv);
			//console.log("csc:", i, sv, counts);
			var s = {
				type: 'cell',
				row: null,
				col: i,
				square: null,
				cells: [pos.cell],
				offset: pos.offset,
				value: sv,
				msg: `Single: Column: ${i+1}  Cell:  ${pos.cell}, Value: ${sv}`
			}
			colSingles.push(s);
		}
	}
	if (colSingles.length === 0) return null;
	return colSingles;
}

function findValueInCol(cix, val) {
	//const cells = cellStore.getState().cells;
	var col = cols[cix];
	for (var i=0; i<9; ++i) {
		const cix = col[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		if (cell.activecandidates.includes(val)) return {cell: cix, offset: i};
	}
	return null;
}

function sqSingleCounts() {
	var sqSingles = [];
	for (var i=0; i<9; ++i) {
		var counts = sqCounts(i);
		var sv = hasSingleValue(counts);
		if (sv > 0) {
			var pos = findValueInSq(i, sv);
			//console.log("ssc:", i, sv, counts)
			var s = {
				type: 'cell',
				row: null,
				col: null,
				square: i,
				cells: [pos.cell],
				offset: pos.offset,
				value: sv,
				msg: `Single: Square: ${i+1}, Cell:  ${pos.cell}, Value: ${sv}`
			}
			sqSingles.push(s);
		}
	}
	if (sqSingles.length === 0) return null;
	return sqSingles;
}

function findValueInSq(six, val) {
	//const cells = cellStore.getState().cells;
	var sq = squares[six];
	for (var i=0; i<9; ++i) {
		const cix = sq[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		if (cell.activecandidates.includes(val)) return {cell: cix, offset: i};
	}
	return null;
}

// returns an array of cells which only have one candidate
function singletons() {
	var singletons = [];
	//const cells = cellStore.getState().cells;
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

// return an array of cells which contain naked pairs
function findNakedPairs() {
	var np = [];
	//const cells = cellStore.getState().cells;

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

	//console.log("naked pairs:", np);

	var pairRows = [];	// rows with 2 naked pairs
	var rowPairs = [];	// pairs in those rows
	var rowCells = [];	// cells containing the pairs

	var pairCols = [];	// cols with 2 naked pairs
	var colPairs = [];	// pairs in those cols
	var colCells = [];	// cells containing the pairs

	var pairSq = [];	// squares with 2 naked pairs
	var sqPairs = [];	// pairs in those squares
	var sqCells = [];	// cells containing the pairs

	// count the number of pair cells in each row
	var npl = np.length;
	// for each pair, count the number of occurances in the row
	for (var i=0; i<npl; ++i) {
		// for each row
		var npi = np[i];
		// for each row
		for (var j=0; j<9; ++j) {
			//console.log("row", j, npi);
			var row = rows[j];
			// for each cell in the row
			var count = 0;
			var ncells = [];
			// for each cell in the row
			for (var k=0; k<9; ++k) {
				var cix = row[k];
				var c = cells[cix];
				if (c.value > 0) continue;
				var ac = c.activecandidates;
				if (ac.length !== 2) continue;	// skip non pairs
				//console.log(k, cix, ac, npi );

				if (ac.includes(npi[0]) && ac.includes(npi[1])) {
					++count;
					ncells.push(cix);
				}

			}
			//console.log("count:", count);
			if (count === 2) {
				pairRows.push(j)
				rowPairs.push(npi);
				rowCells.push(ncells);
				//console.log("row added:", j);
			}
		};
	}

	//console.log("pairrows", pairRows, rowPairs, rowCells);

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
			var ncells = [];
			for (var k=0; k<9; ++k) {
				var cix = col[k];
				var c = cells[cix];
				if (c.value > 0) continue;
				var ac = c.activecandidates;
				if (ac.length !== 2) continue;	// skip non pairs
				//console.log(k, cix, ac, npi );

				if (ac.includes(npi[0]) && ac.includes(npi[1])) {
					++count;
					ncells.push(cix);
				}

			}
			//console.log("count:", count);
			if (count === 2) {
				pairCols.push(j);	// col with naked pair
				colPairs.push(npi);
				colCells.push(ncells);
				//console.log("col added:", j);
			}
		};
	}

	//console.log("paircols", pairCols, colPairs, colCells);

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
			var ncells = [];
			for (var k=0; k<9; ++k) {
				var cix = sq[k];
				var c = cells[cix];
				if (c.value > 0) continue;
				var ac = c.activecandidates;
				if (ac.length !== 2) continue;	// skip non pairs
				//console.log(k, cix, ac, npi );

				if (ac.includes(npi[0]) && ac.includes(npi[1])) {
					++count;
					ncells.push(cix);
				}

			}
			//console.log("count:", count);
			if (count === 2) {
				pairSq.push(j)
				sqPairs.push(npi);
				sqCells.push(ncells);
				//console.log("sq added:", j);
			}
		};
	}

	//console.log("squares", pairSqs);

	// console.log("rows:", pairRows, rowPairs, rowCells);
	// console.log("cols:", pairCols, colPairs, colCells);
	// console.log("squares:", pairSq, sqPairs, sqCells);

	// now we have all the pairs, find which ones can be used to pair down the candidates
	var npHints = [];
	var rpl = rowPairs.length;
	// for each pair, count the number of occurances in the row
	for (var i=0; i<rpl; ++i) {
		var pri = pairRows[i];		// get the row number
		var rpi = rowPairs[i];		// get the pair
		var cellsi = rowCells[i];	// get the cells to skip
		var row = rows[pri];
		var targetCells = [];
		//console.log(pri, rpi, row);
		// for each cell in the row
		var isHint = false;
		// for each cell in the row
		for (var j=0; j<9; ++j) {
			var cix = row[j];
			//console.log(cellsi, cix);
			if (cellsi.includes(cix)) continue;	//skip original cells with pairs
			var c = cells[cix];
			if (c.value > 0) continue;	// skip

			var p0 = rpi[0];
			var p1 = rpi[1];
			var ac = c.activecandidates;
			//console.log(cix, ac, p0, p1);
			if (ac.includes(p0) || ac.includes(p1)) {
				isHint = true;
				targetCells.push(cix);
			}
		}
		if (isHint) {
			console.log("Row has hint:", pri, rpi);
			var msg = `Naked Pair Row ${j+1}, Values: ${p0}, ${p1}`;
			var pf = {
				type: "nakedPair",
				direction: "row",
				row: pri,
				col: null,
				square: null,
				cells: cellsi,
				offset: null,
				values: [p0,p1],
				targets: targetCells,
				msg: msg
			};
			npHints.push(pf);
		}
	}

	var cpl = colPairs.length;
	// for each pair, count the number of occurances in the col
	for (var i=0; i<cpl; ++i) {
		var pci = pairCols[i];		// get the col number
		var cpi = colPairs[i];		// get the pair
		var cellsi = colCells[i];	// get the cells to skip
		var col = cols[pci];
		var targetCells = [];
		//console.log("column:", pci, cpi, col);
		// for each cell in the col
		var isHint = false;
		for (var j=0; j<9; ++j) {
			var cix = col[j];
			//console.log(cellsi, cix);
			if (cellsi.includes(cix)) continue;	//skip original cells with pairs
			var c = cells[cix];
			if (c.value > 0) continue;	// skip

			var p0 = cpi[0];
			var p1 = cpi[1];
			var ac = c.activecandidates;
			//console.log(c.candidates, c.noncandidates);
			//console.log(cix, ac, p0, p1, ac.includes(p0), ac.includes(p1));
			if (ac.includes(p0) || ac.includes(p1)) {
				isHint = true;
				targetCells.push(cix);
			}
		}
		if (isHint) {
			console.log("Col has hint:", pci, cpi);
			var msg = `Naked Pair Column ${j+1}, Values: ${p0}, ${p1}`;
			var pf = {
				type: "nakedPair",
				direction: "col",
				row: pci,
				col: null,
				square: null,
				cells: cellsi,
				offset: null,
				values: [p0,p1],
				targets: targetCells,
				msg: msg
			};
			npHints.push(pf);
		}
	}

	var spl = sqPairs.length;
	// for each pair, count the number of occurances in the square
	for (var i=0; i<spl; ++i) {
		var psi = pairSq[i];		// get the square number
		var spi = sqPairs[i];		// get the pair
		var cellsi = sqCells[i];	// get the squares to skip
		var sq = squares[psi];
		var targetCells = [];
		//console.log(psi, spi, sq);
		// for each cell in the square
		var isHint = false;
		for (var j=0; j<9; ++j) {
			var cix = sq[j];
			//console.log(cellsi, cix);
			if (cellsi.includes(cix)) continue;	//skip original cells with pairs
			var c = cells[cix];
			if (c.value > 0) continue;	// skip

			var p0 = spi[0];
			var p1 = spi[1];
			var ac = c.activecandidates;
			//console.log(psi, cix, ac, p0, p1);
			if (ac.includes(p0) || ac.includes(p1)) {
				isHint = true;
				targetCells.push(cix);
			}
		}
		if (isHint) {
			console.log("Square has hint:", psi, spi);
			var msg = `Naked Pair Square ${j+1}, Values: ${p0}, ${p1}`;
			var pf = {
				type: "nakedPair",
				direction: "square",
				row: null,
				col: null,
				square: psi,
				cells: cellsi,
				offset: null,
				values: [p0,p1],
				targets: targetCells,
				msg: msg
			};
			npHints.push(pf);
		}
	}

	//console.log("npHints", npHints);
	if (npHints.length === 0) return null;
	return npHints;
}

function hasSingleValueRC(ar) {
	//console.log(ar);
	// check that row only has a single value
	var single = -1;
	for (var i=0; i<9; ++i) {
		if (ar[i] > 0) {
			if (single > -1) return -1
			single = i;
			//console.log("single:", i, ar[i], single);
		}
	}
	return single;
}

// if a value only appears in the same row or column of a square
// then that value can be eliminated from the remaining row or column cells outside the square
function pointingPairsRowCol() {
	const cells = cellStore.getState().cells;
	var ppCandidates = [];
	// for each square
	for (var sq=0; sq<9; ++sq) {
		var candids = [];

		// for each value
		for (var value=1; value<10; ++value) {
			var vCellsR = [[],[],[],[],[],[],[],[],[],[]];	// row cells that the value appears in
			var vCellsC = [[],[],[],[],[],[],[],[],[],[]];	// col cells that the value appears in
			// for each cell with the candidate value get the row and col
			// for each cell in the square
			// count the occurances in each row/col
			var sqCells = squares[sq];
			for (var c=0; c<9; ++c) {
				var cix = sqCells[c];
				var sc = cells[cix];
				if (sc.value > 0) continue;
				var crow = cellRow[cix];
				var ccol = cellCol[cix];
				if (sc.activecandidates.includes(value)) {
					vCellsR[crow].push(cix);
					vCellsC[ccol].push(cix);
				}
			}

			var hasTargets = false;
			var targets = [];
			var singleRow = hasSingleValueRC(vRows);
			var singleCol = hasSingleValueRC(vCols);
			// if there is a single row, see if there is anyting to eliminate outside the square
			if (singleRow > -1) {
				var row = rows[singleRow];
				for (var r=0; r<9; ++r) {
					var cix = row[r];
					var rsq = cellSquare[cix];
					if (sq === rsq ) continue;	// skip cells in our square
					var cel = cells[cix];
					if (cel.value === 0 && cel.activecandidates.includes(value)) {
						hasTargets = true;
						targets.push(cix);
					}
				}
			} else if (singleCol > -1) {
				var col = cols[singleCol];
				for (var c=0; c<9; ++c) {
					var cix = col[c];
					var csq = cellSquare[cix];
					if (sq === csq ) continue;	// skip cells in our square
					var cel = cells[cix];
					if (cel.value === 0 && cel.activecandidates.includes(value)) {
						hasTargets = true;
						targets.push(cix);
					}
				}
			}

			// skip singletons (should not happen)
			if (hasTargets) {
				var sc = [ value, singleRow, singleCol, sq, vRows[singleRow], vCellsR[singleRow], vCols[singleCol], vCellsC[singleCol], targets ];
				console.log("sc",sc)
				candids.push(sc);
			}
		}

		//console.log("pp candids", candids);

		var prevRow = -1;
		var prevCol = -1;
		var prevSq = -1;
		var prevSrc = null;
		var src = null;
		var val;
		candids.forEach((can) => {
			console.log("can", can);
			val = can[0];
			var csr = can[1];
			var csc = can[2];
			var csq = can[3];
			//console.log(csr, prevRow, csc, prevCol, csq, prevSq, val);
			if (prevRow !== csr || prevCol !== csc || prevSq !== csq) {
				//console.log("notElse", prevSrc)
				if (prevSrc != null) ppCandidates.push(prevSrc);

				var vrsr =  can[4];		// vRows[singleRow];
				var vcrsr = can[5];		// vCellsR[singleRow];
				var vcsc =  can[6];		// vCols[singleCol];
				var vccsc = can[7];		// vCellsC[singleCol];
				var targets = can[8];
				// skip singletons (should not happen)
				var sc = [val, csq, csr, csc, val]
				//console.log("sc",sc)
				if (csr) {
					//console.log("sr", value, singleRow, vRows);
					src = {
						square: csq,
						row: csr,
						col: null,
						count: vrsr,
						cells: vcrsr,
						values: [val],
						targets: targets
					}
					//console.log("ppsr", sq, value, singleRow, vRows, vCellsR[singleRow]);
				}
				if (csc) {
					//console.log("sc", value, singleCol, vCols);
					src = {
						square: csq,
						row: null,
						col: csc,
						count: vcsc,
						cells: vccsc,
						values: [val],
						targets: targets
					}
					//console.log("ppsc", sq, value, singleCol, vCols, vCellsC[singleCol] );
				}

				prevRow = csr;
				prevCol = csc;
				prevSq = csq;
				prevSrc = src;
			} else {
				//console.log("else", prevSrc)
				if (prevSrc) {
					prevSrc.values.push(val);
					prevSrc.targets = Array.from(new Set(prevSrc.targets) || new Set(targets));
				}
			}
		})
		//console.log("end",prevSrc)
		if (prevSrc) {
			ppCandidates.push(src);
		}
	}

	console.log("ppCandidates", ppCandidates)
	var ppHints = [];
	ppCandidates.forEach((pp) => {
		var msg = "Pointing ";
		msg += pp.cells.length === 3 ? "Triple: " : "Pair: ";
		msg += pp.row ? `Row: ${pp.row+1}` : "";
		msg += pp.col ? `Column: ${pp.col+1}` : "";
		msg += `, Value: ${pp.values}`;

		var pp = {
			type: 'pointingPair',
			row: pp.row,
			col: pp.col,
			square: pp.square,
			cells: pp.cells,
			offset: null,
			values: pp.values,
			targets: pp.targets,
			msg: msg
		}
		ppHints.push(pp);
	})

	if (ppHints.length === 0) return null;
	return ppHints;
}

// find values only in one row/col and return sq/row/val triples
function oneRowValues(sq, sqrc) {
	var rv = [];
	//console.log(sqrc)
	for (var v=1; v<10; ++v) {
		var count = 0;
		var row;
		var vcount;
		var c;
		if (sqrc[0][0][v] > 0  && sqrc[1][0][v] === 0 && sqrc[2][0][v] === 0) {
			// row 0 has value
			++count;
			row = sqRows012[sq][0];
			vcount = sqrc[0][0][v];
			c = sqrc[0][1][v];
		}
		if (sqrc[0][0][v] ===0  && sqrc[1][0][v] > 0 && sqrc[2][0][v] === 0) {
			++count;
			row = sqRows012[sq][1];
			vcount = sqrc[1][0][v];
			c = sqrc[1][1][v];
		}
		if (sqrc[0][0][v] === 0  && sqrc[1][0][v] === 0 && sqrc[2][0][v] > 0) {
			++count
			row = sqRows012[sq][2];
			vcount = sqrc[2][0][v];
			c = sqrc[2][1][v];
		}

		if (count === 1) {
			rv.push(
			{
				square: sq,
				row: row,
				col: null,
				cells: c,
				value: v,
				count: vcount,
			}
			);
		}
	}
	return rv;
}

function oneColValues(sq, sqrc) {
	var rv = [];
	//console.log(sqrc)
	for (var v=1; v<10; ++v) {
		var count = 0;
		var col;
		var vcount;
		var c;
		if (sqrc[0][0][v] > 0  && sqrc[1][0][v] === 0 && sqrc[2][0][v] === 0) {
			// col 0 has value
			++count;
			col = sqCols012[sq][0];
			vcount = sqrc[0][0][v];
			c = sqrc[0][1][v];
		}
		if (sqrc[0][0][v] ===0  && sqrc[1][0][v] > 0 && sqrc[2][0][v] === 0) {
			++count;
			col = sqCols012[sq][1];
			vcount = sqrc[1][0][v];
			c = sqrc[1][1][v];
		}
		if (sqrc[0][0][v] === 0  && sqrc[1][0][v] === 0 && sqrc[2][0][v] > 0) {
			++count
			col = sqCols012[sq][2];
			vcount = sqrc[2][0][v];
			c = sqrc[2][1][v];
		}

		if (count === 1) {
			rv.push(
				{
					square: sq,
					row: null,
					col: col,
					cells: c,
					value: v,
					count: vcount,
				}
			);
		}
	}
	return rv;
}

// X-Wing
function XWing() {
	const cells = cellStore.getState().cells;
	var xwings = [];

	// for every value
	for (var value=1; value<10; ++value) {
		// for each row
		var rowPairs = [];
		for (var r=0; r<9; ++r) {
			var count = 0;
			var colCells = [];
			var row = rows[r];
			// for each cell in the row
			for (var c=0; c<9; ++c) {
				var cix = row[c];
				var clx = cells[cix];
				if (clx.value === 0 && clx.activecandidates.includes(value)) {
					count++;
					colCells.push(cellCol[cix]);
				}
			}
			if (count === 2) {
				rowPairs.push( [r, colCells]);
			}
		}
		//console.log("xw", value, rowPairs.length, rowPairs);

		if (rowPairs.length > 1) {
			for (var i=0; i<rowPairs.length; ++i) {
				var pi = rowPairs[i];
				for (var j=i+1; j<rowPairs.length; ++j) {
					var pj = rowPairs[j];
					//console.log(pi, pj);
					if (pi[1][0] === pj[1][0] && pi[1][1] === pj[1][1]) {
						var r0 = pi[0];
						var r1 = pj[0];
						var c0 = pi[1][0];
						var c1 = pj[1][1];
						//console.log("xw", value, r0, r1, c0, c1);

						// check for candidates for elimination
						var hasCandidates = false;
						var targets = [];
						// check the rows for elimination candidates
						var rlist = [r0,r1];
						var clist = [c0,c1];
						for (var k in rlist) {
							var rx = rlist[k];
							//console.log("RX",rx, rlist)
							var row = rows[rx];
							// for each cell in the row
							for (var cx=0; cx<9; ++cx) {
								if (cx != c0 && cx != c1) {
									var cix0 = row[cx];
									var cl0 = cells[cix0]
									//console.log("rc", rx, cx, cix0, cl0);
									if (cl0.value === 0 && cl0.activecandidates.includes(value)) {
										hasCandidates = true;
										targets.push(cix0)
										console.log("push1", cix0);
									}
								}
							}
						}
						// check the rows for elimination candidates
						for (k in clist) {
							var cx = clist[k]
							var col = cols[cx];
							// for each cell in the cols
							for (var rx=0; rx<9; ++rx) {
								if (rx != r0 && rx != r1) {
									var cix0 = col[rx];
									var cl0 = cells[cix0]
									//console.log("cc", rx, cx, cix0, cl0);
									if (cl0.value === 0 && cl0.activecandidates.includes(value)) {
										hasCandidates = true;
										targets.push(cix0)
										//console.log("push3", cix0);
									}
								}
							}
						}
						if (hasCandidates) {
							var x0 = (r0*9)+c0;
							var x1 = (r0*9)+c1;
							var x2 = (r1*9)+c0;
							var x3 = (r1*9)+c1;
							//console.log(x0,x1,x2,x3);
							var xwcells = [
								rows[r0][c0],
								rows[r0][c1],
								rows[r1][c0],
								rows[r1][c1],
							];
							//console.log("has", targets, r0, r1, c0, c1, xwcells);
							var xw = {
								type: 'xWing',
								rows: [r0,r1],
								cols: [c0,c1],
								square: null,
								cells: xwcells,
								offset: null,
								value: value,
								targets: targets,
								msg: `XWing Rows: ${r0}, ${r1}, Cols: ${c0}, ${c1}, Value: ${value}`
							}
							xwings.push(xw);

						}


					}
				}
			}
		}
	}


	if (xwings.length == 0) return null;
	return xwings;

}


function findPairInRow(rix, p) {
	//console.log("inRow", rixin, p);
	var rp = [];
	var row = rows[rix];
	for (var r=0; r<9; ++r) {
		var cix = row[r];
		var cel = cells[cix];
		//console.log("inRow", cix);
		var ac = cel.activecandidates;
		if (cel.value === 0 && ac.length === 2) {
			if (ac.includes(p[0]) && ac.includes(p[1])) {
				rp.push(cix);
			}
		}
	}
	return rp;
}

function findPairInCol(cixin, p) {
	var cp = [];
	//console.log("inCol", cixin, p);
	var col = cols[cixin];
	for (var c=0; c<9; ++c) {
		var cix = col[c];
		//console.log("inCol", cix);
		var cel = cells[cix];
		var ac = cel.activecandidates;
		if (cel.value === 0 && ac.length === 2) {
			if (ac.includes(p[0]) && ac.includes(p[1])) {
				cp.push(cix);
			}
		}
	}
	return cp;
}

function candidatePairsMatch(c0, c1) {
	if (c0[0] !== c1[0] && c0[0] !== c1[1]) return false;
	if (c0[1] !== c1[0] && c0[1] !== c1[1]) return false;
	return true;
}

function findPairs(p) {
	var pairs = [];
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if (c.value == 0 && ac.length === 2) {
			if (ac.includes(p[0]) && ac.includes(p[1])) {
				var rcs = [cellRow[cix],cellCol[cix],cellSquare[cix]];
				pairs.push([cix,ac,rcs]);
			}
		}
	}
	return pairs;
}

// X-Wing
function XYZWing() {
	const cells = cellStore.getState().cells;
	var pivots = [];
	var xyzwings = [];

	// find pivot cells
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if ( c.value === 0 && ac.length === 3) {
			var rcs = [cellRow[cix],cellCol[cix],cellSquare[cix]];
			pivots.push([cix, ac, rcs]);
		}
	}
	//console.log("xyz", pivots);

	// find pincer cells
	var xyPairs = [];
	var xzPairs = [];
	var yzPairs = [];
	var xyzCandidates = [];

	for (var px=0; px<pivots.length; ++px) {
		var piv = pivots[px];
		// find candidate pairs
		var pix = piv[0];	// pivot cell id
		var pac = cells[pix].activecandidates;
		var xy = [pac[0],pac[1]];
		var xz = [pac[0],pac[2]];
		var yz = [pac[1],pac[2]];
		var xyz = [pac[0],pac[1],pac[2]];

		xyPairs = findPairs(xy);
		xzPairs = findPairs(xz);
		yzPairs = findPairs(yz);

		var haveXY = (xyPairs.length > 0);
		var haveXZ = (xzPairs.length > 0);
		var haveYZ = (yzPairs.length > 0);

		var count = 0;
		if (haveXY) ++count;
		if (haveXZ) ++count;
		if (haveYZ) ++count;
		if (count < 2)  continue;	// nothing to do

		//console.log("candidate", pix, xyz)
		//console.log("xyzp",piv, xyPairs,xzPairs,yzPairs);

		// pincers can be anywhere apparently
		// pincer: cix, ac, rcs

		// pair xyz with xy and xz
		xyPairs.forEach((xy) => {
			xzPairs.forEach((xz) => {
				xyzCandidates.push([piv,xy,xz,xyz[0]]);
			})
		})

		// pair xyz with xy and yz
		xyPairs.forEach((xy) => {
			yzPairs.forEach((yz) => {
				xyzCandidates.push([piv,xy,yz,xyz[1]]);
			})
		})

		// pair xyz with xz and yz
		xzPairs.forEach((xz) => {
			yzPairs.forEach((yz) => {
				xyzCandidates.push([piv,xz,yz,xyz[2]]);
			})
		})
	}

	//console.log("xyzCandidates",xyzCandidates)


	for (var x=0; x<xyzCandidates.length; ++x) {
	//for (var x=0; x<1; ++x) {
		var can = xyzCandidates[x];
		//console.log(x, can);
		// pivot/pincer: cix, ac, rcs, value
		var piv = can[0];	// pivot
		var pin1 = can[1];	// pincer 1
		var pin2 = can[2];	// pincer 2
		var pval = can[3];

		for (var cix=0; cix<81; ++cix) {
			if (cix === piv[0]) continue;	// skip ourselves
			if (cix === pin1[0]) continue;	// skip ourselves
			if (cix === pin2[0]) continue;	// skip ourselves

			var cel = cells[cix];
			if (cel.value > 0) continue;
			var ac = cel.activecandidates;
			if (ac.length != 2) continue;

			var crcs = [cellRow[cix],cellCol[cix],cellSquare[cix]];
			//console.log("chek", x, cix, crcs, piv, pin1, pin2, pval);

			// is the cell in the same row/col/square  the pincers
			if (crcs[0] == pin1[2][0] && crcs[0] == pin2[2][0] ) {
				//console.log("same row", x, cix, crcs, piv, pin1, pin2, pval);
				// same row
				var row = rows[crcs[0]];
				for (var i=0; i<9; ++i) {
					var ix = row[i];	// cell in row
					// if cell is same as pincers, skip it
					if (ix === pin1[0] || ix === pin2[0]) continue;
					if (!ac.includes(pval)) continue;

					console.log("acr",ix, crcs, pin1, pin2, pval, ac);
					xyzwings.push(piv, pin1, pin2, pval);
				}

			}
			// column
			if (crcs[1] == pin1[2][1] && crcs[1] == pin2[2][1] ) {
				//console.log("same col", x, cix, crcs, piv, pin1, pin2, pval);
				// same row
				var col = cols[crcs[0]];
				for (var i=0; i<9; ++i) {
					var ix = col[i];	// cell in row
					// if cell is same as pincers, skip it
					if (ix === pin1[0] || ix === pin2[0]) continue;
					if (!ac.includes(pval)) continue;

					console.log("acc",ix, crcs, pin1, pin2, pval, ac);
					xyzwings.push(piv, pin1, pin2, pval);
				}

			}
			// square
			if (crcs[2] == pin1[2][2] && crcs[2] == pin2[2][2] ) {
				//console.log("same sq", x, cix, crcs, piv, pin1, pin2, pval);
				// same row
				var sq = squares[crcs[0]];
				for (var i=0; i<9; ++i) {
					var ix = sq[i];	// cell in row
					// if cell is same as pincers, skip it
					if (ix === pin1[0] || ix === pin2[0]) continue;
					if (!ac.includes(pval)) continue;

					console.log("acs",ix, crcs, pin1, pin2, pval, ac);
					xyzwings.push(piv, pin1, pin2, pval);
				}

			}
		}
	}

	if (xyzwings.length === 0) return null;

	var xyzHints = [];

	console.log("xyzHints", xyzHints);
	if (xyzHints.length === 0) return null;
	return xyzHints;
}

function xyzHint(pix, pval, pr, pc, ps, rowMates,colMates) {

	var h = {
		type: 'xyzWing',
		row: pr,
		col: pc,
		square: ps,
		cells: [rowMates[0],colMates[0]],
		offset: null,
		value: pval,
		targets: [pix],
		msg: `XYZ-Wing: Cell: ${pix}, Value: ${pval}`
	}
	return h;
}

function findXYPairs(ppiv, pivots) {
	var pairs = [];

	var ppix = ppiv[0];	// pivot cell id
	var prow = ppiv[1];
	var pcol = ppiv[2];
	var pac = ppiv[3];

	// find pair cells containing XY
	var r
	for (var p=0; p<pivots.length; ++p) {
		var piv = pivots[p];
		var pix = piv[0];

		if (pix === ppix) continue;	// skip ourselves
		if (prow !== piv[1] && pcol !== piv[2]) continue;	// skip if not same row/col
		if (!piv[3].includes(pac[0]) && !piv[3].includes(pac[1])) continue;	// skip if x or y value not in cell

		var ac = piv[3];
		pairs.push([pix, cellRow[pix], cellCol[pix], ac]);
	}
	return pairs;
}

function XYWing() {
	const cells = cellStore.getState().cells;
	var pivots = [];
	var xywings = [];

	// find pivot cells
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if ( c.value === 0 && ac.length === 2) {
			pivots.push([cix, cellRow[cix], cellCol[cix],  ac]);
		}
	}
	//console.log("xy", pivots);

	var xyPairs = [];
	for (var px=0; px<pivots.length; ++px) {
		// find candidate pairs
		// piv: [ix, row, col, ac]
		var piv = pivots[px];
		var pix = piv[0];	// pivot cell id
		var prow = piv[1];
		var pcol = piv[2];
		var pac = piv[3];
		var x = pac[0];
		var y = pac[1];

		xyPairs = findXYPairs(piv, pivots);
		if (xyPairs.length === 0) continue;

		//console.log("xy candidates", pix, x, y);
		//console.log(xyPairs);

		// are any of the pairs in the same row/col/square as the pivot

		// find pairs in same row
		// xpairs : [pix, row, col, ac]
		var xyRow = [];
		xyPairs.forEach((p) => {if (p[1] === prow) xyRow.push(p);})

		// find pairs in same col
		var xyCol = [];
		xyPairs.forEach((p) => {if (p[2] === pcol) xyCol.push(p);})

		var xyHaveRow = (xyRow.length > 0);
		var xyHaveCol = (xyCol.length > 0);

		//console.log(xyHaveRow,xyHaveCol);
		if (!xyHaveRow || !xyHaveCol) continue;		// no candidates

		//console.log("xy candidates", piv, x, y);
		//console.log(xyRow,xyCol);

		// examine each wing combination
		for (var r=0; r<xyRow.length; ++r) {
			for (var c=0; c<xyCol.length; ++c) {
				// xy row/col : [pix, row, col, ac]

				var rp = xyRow[r];
				var cp = xyCol[c];
				// the wings must have a value in common that is not in the pivot
				var rac = rp[3];
				var cac = cp[3];

				var wval = null;
				if (cac.includes(rac[0]) && !pac.includes(rac[0]))
					wval = rac[0];
				else if (cac.includes(rac[1]) && !pac.includes(rac[1]))
					wval = rac[1];

				if (wval) {
					// the value wval can be eliminated from the intersecting cell
					//console.log("found XY", wval, piv, rp, cp);

					var ir = cp[1];	// wing column
					var ic = rp[2];	// wing row
					var target = rows[ir][ic];
					//console.log("xy target", ir, ic, target);
					var tc = cells[target];
					if (tc.value === 0 && tc.activecandidates.includes(value)) {
						var h = {
							type: 'xyWing',
							row: piv[1],
							col: piv[2],
							square: null,
							cells: [piv[0],rp[0],cp[0]],
							offset: null,
							value: wval,
							targets: [target],		//	 [rp[0],cp[0]],
							msg: `XY-Wing: Cell: ${piv[0]}, Value: ${wval}`
						}

						//console.log("hint", h);
						xywings.push(h);
					}
				}
			}
		}

	}

	if (xywings.length === 0) return null;
	console.log("xyHints", xywings);
	return xywings;
}

// look for a set of three pairs where the pattern is [a,b] [a,c] [a,b]
function findPairTriples(pairs) {
	const triples = [];

	const oneInCommon = (p1, p2) =>
	p1.filter(v => p2.includes(v)).length === 1;

	const validDigitCounts = (triple) => {
		const counts = {};

		for (const pair of triple) {
			for (const value of pair) {
				counts[value] = (counts[value] || 0) + 1;

				if (counts[value] > 2) {
					return false;
				}
			}
		}

		return true;
	};

	for (let i = 0; i < pairs.length - 2; i++) {
		for (let j = i + 1; j < pairs.length - 1; j++) {
			if (!oneInCommon(pairs[i][1], pairs[j][1])) continue;

			for (let k = j + 1; k < pairs.length; k++) {
				const triple = [
					pairs[i],
					pairs[j],
					pairs[k]
				];

				if (
					oneInCommon(pairs[i][1], pairs[k][1]) &&
					oneInCommon(pairs[j][1], pairs[k][1]) &&
					validDigitCounts(triple)
				) {
					triples.push(triple);
				}
			}
		}
	}

	return triples;
}

// for either row,col,sq find the cells containing [vals] that are not in [cls]
function tripleTargets(row, col, sq, cls, vals) {
	var targets = [];
	var cix = row ? rows[row] : col ? cols[col] : sq ? squares[sq] : [];
	cix.forEach((cx) => {
		if (!cls.includes(cx)) {
			var c = cells[cx];
			if (c.value === 0) {
				var ac = c.activecandidates;
				var has = vals.some(r => ac.includes(r))
				if (has) targets.push(cx);
			}
		}
	})

	if (targets.length === 0) return null;
	return targets;
}

function tripleValues(trip) {
	const values = new Set();
	trip.forEach((t) => {
		var pair = t[1];
		if (!values.has(pair[0])) values.add(pair[0]);
		if (!values.has(pair[1])) values.add(pair[1]);
	})
	//console.log("set",values);
	return Array.from(values);
}

function findNakedTriples() {
	var nakedtriples = [];
	const cells = cellStore.getState().cells;

	var npRows = [[],[],[],[],[],[],[],[],[]]
	var npCols = [[],[],[],[],[],[],[],[],[]]
	var npSquares = [[],[],[],[],[],[],[],[],[]]

	// find all naked pairs
	for (var ix=0; ix<81; ++ix) {
		var c = cells[ix];
		var ac = c.activecandidates;
		if (c.value === 0 && ac.length === 2){
			var row = cellRow[ix];
			var col = cellCol[ix];
			var sq = cellSquare[ix];
			npRows[row].push([ix,ac]);
			npCols[col].push([ix,ac]);
			npSquares[sq].push([ix,ac]);
		}
	};

	// check the rows/cols/squares for four or more pairs

	var nptrips = [];

	for (var i=0; i<9; ++i) {
		var npt;
		if (npRows[i].length > 3) {
			//console.log("npr", i, npRows[i]);
			npt = findPairTriples(npRows[i]);
			if (npt.length > 0) {
				var npt0 = npt[0];
				//console.log("npr", i, npt.length, npt0);
				nptrips.push([i, null, null, npt0]);
			}
		}
		if (npCols[i].length > 3) {
			//console.log("npc", i, npCols[i]);
			npt = findPairTriples(npCols[i]);
			if (npt.length > 0) {
				var npt0 = npt[0];
				//console.log("npc", i, npt.length, npt0);
				nptrips.push([null, i, null, npt0]);
			}
		}
		if (npSquares[i].length > 3) {
			npt = findPairTriples(npSquares[i]);
			if (npt.length > 0) {
				var npt0 = npt[0];
				//console.log("npc", i, npt.length, npt0);
				nptrips.push([null, null, i, npt0]);
			}
		}
	}

	//console.log("nptrips",nptrips)
	if (nptrips.length === 0) return null;

	nptrips.forEach((npt) => {
		//console.log(npt);
		var row = npt[0];
		var col = npt[1];
		var sq = npt[2];
		var trip = npt[3];
		var cls = [trip[0][0],trip[1][0],trip[2][0]];
		var vals = tripleValues(trip);
		var tgts = tripleTargets(row, col, sq, cls, vals);
		//console.log(trip, row, col, sq, cls, vals, tgts);
		if (tgts) {
			var msg = "XY-Triple: ";
			if (row) msg += `Row: ${row}`;
			if (col) msg += `Column: ${col}`;
			if (sq) msg += `Square: ${sq}`;
			msg += `, Values: ${vals}`;

			var xyt = {
				type: 'xyTriple',
				row: row,
				col: col,
				square: sq,
				cells: cls,
				offset: null,
				values: vals,
				targets: tgts,
				msg: msg
			}
			nakedtriples.push(xyt);
		}
	})

	if (nakedtriples.length === 0) return null;
	console.log("nakedtriples", nakedtriples);
	return nakedtriples;
}

// record the index of the occurance of each value with the number of counts in the row/col
function valCounts(rowcol, count) {
	var counts = [0,0,0,0,0,0,0,0,0,0];
	var vrc = [[],[],[],[],[],[],[],[],[],[]];
	var countsix = [];
	//console.log(row);
	for (var i=1; i<10; ++i) {
		const val = rowcol[i];
		if (val === count) {
			counts[i] = 1;
			countsix.push(i);
			vrc[val].push(i);
		};
	}
	return vrc;
}

function cellHasValue(r,c,v) {
	var cix = rows[r][c];
	var cel = cells[cix];
	//console.log(r,c,v,cix,cel);
	if (cel.value === 0 && cel.activecandidates.includes(v)) return ([cix,[r,c]]);
	return null;
}

function findTriplesByRow(rows) {
	const triples = [];

	for (let r1 = 0; r1 < rows.length - 2; r1++) {
		const [row1, cols1] = rows[r1];

		for (let r2 = r1 + 1; r2 < rows.length - 1; r2++) {
			const [row2, cols2] = rows[r2];

			for (let r3 = r2 + 1; r3 < rows.length; r3++) {
				const [row3, cols3] = rows[r3];

				// Generate one pair from row 1
				for (let a = 0; a < cols1.length - 1; a++) {
					for (let b = a + 1; b < cols1.length; b++) {
						const p1 = [cols1[a], cols1[b]];

						// Generate one pair from row 2
						for (let c = 0; c < cols2.length - 1; c++) {
							for (let d = c + 1; d < cols2.length; d++) {
								const p2 = [cols2[c], cols2[d]];

								if (!oneInCommon(p1, p2)) continue;

								// Generate one pair from row 3
								for (let e = 0; e < cols3.length - 1; e++) {
									for (let f = e + 1; f < cols3.length; f++) {
										const p3 = [cols3[e], cols3[f]];

										if (
											oneInCommon(p1, p3) &&
											oneInCommon(p2, p3) &&
											validTriple(p1, p2, p3)
										) {
											triples.push([
												[row1, p1],
												[row2, p2],
												[row3, p3]
											]);
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	return triples;
}

function findTriplesByColumn(cols) {
	const triples = [];

	for (let c1 = 0; c1 < cols.length - 2; c1++) {
		const [col1, rows1] = cols[c1];

		for (let c2 = c1 + 1; c2 < cols.length - 1; c2++) {
			const [col2, rows2] = cols[c2];

			for (let c3 = c2 + 1; c3 < colss.length; c3++) {
				const [col3, rows3] = cols[c3];

				// Generate one pair from col 1
				for (let a = 0; a < rows1.length - 1; a++) {
					for (let b = a + 1; b < rows1.length; b++) {
						const p1 = [rows1[a], rows1[b]];

						// Generate one pair from row 2
						for (let c = 0; c < rows2.length - 1; c++) {
							for (let d = c + 1; d < rows2.length; d++) {
								const p2 = [rows2[c], rows2[d]];

								if (!oneInCommon(p1, p2)) continue;

								// Generate one pair from row 3
								for (let e = 0; e < rows3.length - 1; e++) {
									for (let f = e + 1; f < rows3.length; f++) {
										const p3 = [rows3[e], rows3[f]];

										if (
											oneInCommon(p1, p3) &&
											oneInCommon(p2, p3) &&
											validTriple(p1, p2, p3)
										) {
											triples.push([
												[col1, p1],
												[col2, p2],
												[col3, p3]
											]);
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	return triples;
}

function oneInCommon(a, b) {
	return (
		Number(b.includes(a[0])) +
		Number(b.includes(a[1]))
	) === 1;
}

function validTriple(p1, p2, p3) {
	return new Set([
		...p1,
		...p2,
		...p3
	]).size === 3;
}

function columnsInRow(r, c, v) {
	var cir = [];
	var cxx = [];
	var row = rows[r];
	for (var i=0; i<9; i++) {
		var cix = row[i];
		var col = cellCol[cix];
		var cel = cells[cix];
		if (cel.value === 0 && cel.activecandidates.includes(v)) {
			if (c.includes(col))
				cir.push(i)
			else
				cxx.push(i)
		}
	}
	if (cir.length < 2) return null;
	return [r,cir,cxx];
}

// for each cell in column c, if the cell includes value v, if the row is included in [r], push the row number into rix otherwise push into rxx
// if there are at least two rows, return them
function rowsInColumn(c, r, v) {
	var rir = [];
	var rxx = [];	// rows we do not want
	var col = cols[c];
	for (var i=0; i<9; i++) {
		var cix = col[i];
		var row = cellRow[cix];
		var cel = cells[cix];
		if (cel.value === 0 && cel.activecandidates.includes(v)) {
			if (r.includes(row))
				rir.push(i);
			else
				rxx.push(i);
		}
	}
	if (rir.length < 2) return null;
	return [c,rir,rxx];
}

function cellContainsCandidate(cix, v) {
	const cells = cellStore.getState().cells;
	var c = cells[cix];
	if (c.value === 0 && c.activecandidates.includes(v)) return true;
	return false;
}

// check if the columns have all rows in common
function rowsInCommon(c1, c2, c3, v) {
	var ric = [];
	var c1r = cols[c1];
	var c2r = cols[c2];
	var c3r = cols[c3];
	for (var i=0; i<9; i++) {
		var c1x = c1r[i];
		var c2x = c2r[2];
		var c3x = c3r[3];
		// for each row in the column, make sure they contain the candidate value
		var ccc1 = cellContainsCandidate(c1x, v);
		var ccc2 = cellContainsCandidate(c2x, v);
		var ccc3 = cellContainsCandidate(c3x, v);
		// all or nothing
		if (!(ccc1 && ccc2 && ccc3)) return null;
		ric.push([c1x,c2x,c3x]);
	}

	console.log("ric", v, ric);
	return ric;
}

// check if the rows have all columns in common
function columnsInCommon(r1, r2, r3, v) {
	var cic = [];
	var r1c = rows[r1];
	var r2c = rows[r2];
	var r3c = rows[r3];
	for (var i=0; i<9; i++) {
		var r1x = r1c[i];
		var r2x = r2c[2];
		var r3x = r3c[3];
		// for each column in the row, make sure they all contain the candidate value
		var ccc1 = cellContainsCandidate(r1x, v);
		var ccc2 = cellContainsCandidate(r2x, v);
		var ccc3 = cellContainsCandidate(r3x, v);
		// all or nothing
		if (!(ccc1 && ccc2 && ccc3)) return null;
		cic.push([r1x,r2x,r3x]);
	}

	console.log("cic", v, cic);
	return cic;
}

function rowsInCommon23(c1, c2, c3, v) {
	var ric = [];
	var c1r = cols[c1];
	var c2r = cols[c2];
	var c3r = cols[c3];
	for (var i=0; i<9; i++) {
		var c1x = c1r[i];
		var c2x = c2r[i];
		var c3x = c3r[i];
		// we only need to check columns from r1 that have the value
		// if the other rows have the value in a column then that column must be in the first row
		var ccc1 = cellContainsCandidate(c1x, v);
		var ccc2 = cellContainsCandidate(c2x, v);
		if (ccc2 && !ccc1) return null;
		var ccc3 = cellContainsCandidate(c3x, v);
		if (ccc3 && !ccc1) return null;
		if (ccc1 ) {
			if (ccc2 && ccc3)
				ric.push([i,[c1x,c2x,c3x]]);
			else if (ccc2)
				ric.push([i,[c1x,c2x]]);
			else if (ccc3)
				ric.push([i,[c1x,c3x]]);
		}
	}
	console.log("cir23", v, ric);
	return ric;
}

// check if the rows have columns in common
// r1 must have 3 columns, r2 and r3 can have two or three columns;
// r2 and r3 must have the same columns as r1
function columnsInCommon23(r1, r2, r3, v) {
	var cic = [];
	var r1c = rows[r1];
	var r2c = rows[r2];
	var r3c = rows[r3];
	for (var i=0; i<9; i++) {
		var r1x = r1c[i];
		var r2x = r2c[i];
		var r3x = r3c[i];
		// we only need to check columns from r1 that have the value
		// if the other rows have the value in a column then that column must be in the first row
		var ccc1 = cellContainsCandidate(r1x, v);
		var ccc2 = cellContainsCandidate(r2x, v);
		if (ccc2 && !ccc1) return null;
		var ccc3 = cellContainsCandidate(r3x, v);
		if (ccc3 && !ccc1) return null;
		if (ccc1 ) {
			if (ccc2 && ccc3)
				cic.push([i,[r1x,r2x,r3x]]);
			else if (ccc2)
				cic.push([i,[r1x,r2x]]);
			else if (ccc3)
				cic.push([i,[r1x,r3x]]);
		}
	}
	console.log("cic23", v, cic);
	return cic;
}

function tripleArrayContains(a,b) {
	var alen = a.length;
	for (var i=0; i<alen; i++) {
		var ti = a[i];
		//console.log("tt", ti, b);
		if (!b.includes(ti[0])) continue;
		if (!b.includes(ti[1])) continue;
		if (!b.includes(ti[2])) continue;
		return true;
	}
	return false;
}

function makeTriples(a1,a2) {
	var triples = [];
	var a1len = a1.length;
	var a2len = a2.length;
	if (a1len+a2len < 3) return triples;
	for (var i=0; i<a1len; i++) {
		var t0 = a1[i];
		for (var j=0; j<a2len; j++) {
			var t1 = a2[j];
			if (t0 === t1) continue;
			for (var k=j+1; k<a2len; k++) {
				var t2 = a2[k];
				if (t0 === t2 || t1 === t2) continue;
				var ts = [t0,t1,t2];
				if (!tripleArrayContains(triples,ts)) triples.push(ts);
			}
		}
	}
	return triples;
}

// for each row in [r] find cells with value v excluding cells in [ex]
function findRowTargets(r, v, ex) {
	const cells = cellStore.getState().cells;
	var targets = [];
	r.forEach((rx) => {
		var row = rows[rx];
		for (var i=0; i<9; i++) {
			var cix = row[i];
			var cel = cells[cix];
			if (!ex.includes(cix)) {
				if (cel.value === 0 && cel.activecandidates.includes(v)) {
					targets.push(cix);
				}
			}
		}
	})
	return targets;
}

function findColumnTargets(c, v, ex) {
	const cells = cellStore.getState().cells;
	var targets = [];
	c.forEach((cx) => {
		var col = cols[cx];
		for (var i=0; i<9; i++) {
			var cix = col[i];
			var cel = cells[cix];
			if (!ex.includes(cix)) {
				if (cel.value === 0 && cel.activecandidates.includes(v)) {
					targets.push(cix);
				}
			}
		}
	})
	return targets;
}

function swordfish() {
	const cells = cellStore.getState().cells;

	var sfcandidates = [];

	// first we need to find any rows/colums with exacty three rows of three values (if any)
	// for each value in rCounts3 count the rows of three

	// first check rows/cols with three of the same value
	for (var v=1; v<10; v++) {
		if (rCounts3[v].length === 3) {
			var cicr = columnsInCommon(rCounts3[v][0],rCounts3[v][1],rCounts3[v][2], v);
			if (cicr) {
				console.log("cic", v, rCounts3[v], cicr);
			}
		}
		if (cCounts3[v].length === 3) {
			var cicc = rowsInCommon(cCounts3[v][0],cCounts3[v][1],cCounts3[v][2], v);
			if (cicc) {
				console.log("cic", v, cCounts3[v], cicc);
			}
		}
	}

	// next check rows/cols with three values against rows/cols with two or three values
	for (var v=1; v<10; v++) {
		//if (v !== 5) continue;	// TESTING
		if (rCounts3[v].length === 0) continue;

		var allrows = new Set(rCounts3[v]);
		rCounts23[v].forEach(allrows.add, allrows);
		var allsorted = Array.from(allrows).sort();
		var triples = makeTriples(rCounts3[v], allsorted);
		//console.log("triples", allrows, allsorted, triples);

		// for each row of three find other rows
		triples.forEach((t) => {
			//console.log("cicr23 chk", v, t);

			var cicr23 = columnsInCommon23(t[0],t[1],t[2], v);
			if (cicr23) {
				var cls = [];
				var tgtcols = [];
				cicr23.forEach((ci) => {
					cls = cls.concat(ci[1]);
					tgtcols.push(ci[0]);
				})
				cls.sort();
				// find targets in cols
				var tgts = findColumnTargets(tgtcols, v, cls);
				if (tgts.length > 0) {
					console.log("cicr23", v, t, cicr23, cls, tgtcols, tgts);
					sfcandidates.push([v, tgts, cls]);
				}

			}
		})
	}

	for (var v=1; v<10; v++) {
		//if (v !== 5) continue;	// TESTING
		if (cCounts3[v].length === 0) continue;

		var allrows = new Set(cCounts3[v]);
		cCounts23[v].forEach(allrows.add, allrows);
		var allsorted = Array.from(allrows).sort();
		var triples = makeTriples(cCounts3[v], allsorted);
		//console.log("triples", allrows, allsorted, triples);

		// for each row of three find other rows
		triples.forEach((t) => {
			//console.log("cicr23 chk", v, t);

			var cicc23 = rowsInCommon23(t[0],t[1],t[2], v);
			if (cicc23) {
				var cls = [];
				var tgtrows = [];
				cicc23.forEach((ci) => {
					cls = cls.concat(ci[1]);
					tgtrows.push(ci[0]);
				})
				cls.sort();
				// find targets in cols
				var tgts = findRowTargets(tgtrows, v, cls);
				if (tgts.length > 0) {
					console.log("cicc23", v, t, cicc23, cls, tgtrows, tgts);
					sfcandidates.push([v, tgts, cls]);
				}

			}
		})
	}


	// now we need to find any rows/colums with at least one row/col of two values and the remaing rows of three values
	// for each row of two, find other rows of two
	for (var v=1; v<10; v++) {
		//if (v != 2) continue;	// TESTING

		var r2 = rCounts2[v];	// each row of 2
		if (r2.length === 0) continue;

		for (var ip=0; ip<r2.length; ip++) {
			// c2: 0 2 3 6
			var row0 = r2[ip];		// row of 2
			var r2a = rCounts2[v];	// each row of 2
			for (var ip0=0; ip0<r2a.length; ip0++) {
				// c2p0: 0 2 3 5 6 7
				var row1 = r2a[ip0];	// first row of 2
				if (row1 <= row0) continue;
				for (var ip1=ip0+1; ip1<r2a.length; ip1++) {
					// c2p0: 0 2 3 5 6 7
					var row2 = r2a[ip1];	// second row of 2+
					if (row2 <= row1) continue;

					// find cols in common, the cols must have at least two of the value
					var vc = cCounts23[v];	// cols that contain value
					var vrc = [];
					var rowx = [row0, row1, row2];
					//console.log("ckr", v, row0, row1, row2);
					// find the rows in rowx that have the value in common with the columns in [vc]
					for (var r=0; r<vc.length; ++r) {
						// 0 2 3 4 6 8
						var colx = vc[r];	// row to check
						var v0 = rowsInColumn(colx, rowx, v);
						//console.log(colx, rowx, v0);
						if (v0) vrc.push(v0);
					}

					if (vrc.length > 2) {
						//console.log("rows", v, row0, row1, row2);
						//console.log("vrc", vrc);
						var pt = findTriplesByRow(vrc);
						// pt: [row,[col,col]
						if (pt.length > 0) {
							var cls = [];
							pt.forEach((p) => {
								cix = cols[p[0]][p[1][0]];
								cls.push(cix);
								cix = cols[p[0]][p[1][1]];
								cls.push(cix);
							})
							var tgts = [];
							vrc.forEach((v) => {
								v[2].forEach((v2) => {
									var cx = cols[v[0]][v2];
									//console.log("v2", v[0], v2, cx)
									tgts.push(cx);
								});
							})
							//console.log("pt",pt);
							sfcandidates.push([v, tgts, cls])
						}
					}
				}
			}
		}
	}


	// for each column of two, find other columns of two
	for (var v=1; v<10; v++) {
		//if (v != 2) continue;	// TESTING
		var c2 = cCounts2[v];	// each column of 2
		if (c2.length === 0) continue;

		for (var ip=0; ip<c2.length; ip++) {
			// c2: 0 2 3 6
			var col0 = c2[ip];		// column of 2
			var c2a = cCounts2[v];	// each column of 2
			for (var ip0=0; ip0<c2a.length; ip0++) {
				// c2p0: 0 2 3 5 6 7
				var col1 = c2a[ip0];	// first column of 2
				if (col1 <= col0) continue;
				for (var ip1=ip0+1; ip1<c2a.length; ip1++) {
					// c2p0: 0 2 3 5 6 7
					var col2 = c2a[ip1];	// second column of 2+
					if (col2 <= col1) continue;

					// find rows in common, the rows must have at least two of the value
					var vr = rCounts23[v];	// rows that contain value
					var vrc = [];
					var colx = [col0, col1, col2];
					//console.log("ckc", col0, col1, col2, vr);
					for (var r=0; r<vr.length; ++r) {
						// 0 2 3 4 6 8
						var rowx = vr[r];	// row to check
						var v0 = columnsInRow(rowx, colx, v);
						//console.log(rowx, colx, v0);
						if (v0) vrc.push(v0);
					}
					//console.log(vrc)

					if (vrc.length > 2) {
						//console.log("vrc", vrc);
						var pt = findTriplesByColumn(vrc);
						if (pt.length > 0) {
							var cls = [];
							pt.forEach((p) => {
								cix = rows[p[0]][p[1][0]];
								cls.push(cix);
								cix = rows[p[0]][p[1][1]];
								cls.push(cix);
							})
							var tgts = [];
							vrc.forEach((v) => {
								v[2].forEach((v2) => {
									var cx = rows[v[0]][v2];
									//console.log("v2", v[0], v2, cx)
									tgts.push(cx);
								});
							})
							//console.log("pt",pt);
							sfcandidates.push([v, tgts, cls])
						}
					}
				}
			}
		}
	}

	console.log("sfcandidates",sfcandidates);
	var swordfish = [];

	sfcandidates.forEach((sfc) => {
		//console.log("sfc", sfc)
		//var dir = sfc[0];
		var val = sfc[0];
		var tgts = sfc[1]
		var cls = sfc[2];
		//console.log(dir,trc0,cls)

		var h = {
			type: 'swordfish',
			rows: null,
			cols: null,
			square: null,
			cells: cls,
			offset: null,
			value: val,
			targets: tgts,
			msg: `Swordfish: Cells: ${tgts}, Value: ${val}`
		}
		swordfish.push(h);
	})

	if (swordfish.length === 0) return null;
	console.log("swordfish", swordfish);
	return swordfish;
}

