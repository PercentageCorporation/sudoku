import { cellStore, useCellActions } from "/src/store/store";
import {rows, cols, squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012} from '/src/utilities/constants';

export function runHints() {
	var result;

	result = singletons();
	if (result) return result[0];
	result = rowSingleCounts();
	if (result) return result[0];
	result = colSingleCounts();
	if (result) return result[0];
	result = sqSingleCounts();
	if (result) return result[0];
	result = findNakedPairs();
	if (result) return result[0];
	result = findNakedTriples();
	if (result) return result[0];
	result = findPointingPairsSquare();
	if (result) return result[0];
	result = pointingPairsRowCol();
	if (result) return result[0];
	result = XWing();
	if (result) return result[0];
	result = XYWing();
	if (result) return result[0];
	result = XYZWing();
	if (result) return result[0];

	return null;
}

function includesPair(arr, v0, v1) {
	 for (var i=0; i<arr.length; ++i) {
		 if (arr[i] === v0 || arr[i] === v1) return true;
	 }
	return false;
}

function hasSingleOccurance(arr) {
	var single = null;
	for (var i=0; i<arr.length; ++i) {
		if (arr[i] > 0 ) {
			if (single != null) return null;
			single = i;
		}
	}
	return single;
}

function getSquareValueCells(value, sqix, cells) {
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
	const cells = cellStore.getState().cells;
	// find pairs in squares
	const ppsHints = [];

	// for each row, count the number of times a value appears in a square
	for (var value=1; value<10; ++value) {

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
			if (sqix != null) {
				var vc = sqCounts[sqix];
				var targets = getSquareValueCells(value, sqix, cells);
				var vscount = targets.length;
				if (vscount > vc) {
					// we have a candidate square
					var cels = sqCells[sqix];
					targets = targets.filter((v) => !cels.includes(v));

					//console.log("ppsr", value, r, sqix, vc, vscount, targets, sqCounts);
					var msg = `Pointing Pairs: Cells: ${targets}, Value: ${value}`;
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
			if (sqix != null) {
				var vc = sqCounts[sqix];
				var targets = getSquareValueCells(value, sqix, cells);
				var vscount = targets.length;
				if (vscount > vc) {
					// we have a candidate square
					var cels = sqCells[sqix];
					targets = targets.filter((v) => !cels.includes(v));

					//console.log("ppsc", value, c, sqix, vc, vscount, targets, sqCounts);
					var msg = `Pointing Pairs: Cells: ${targets}, Value: ${value}`;
					var ppsh = {
						type: "pointingPairSquare",
						direction: "row",
						row: null,
						col: c,
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

function rowCounts(r) {
	const cells = cellStore.getState().cells;
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
	return counts;
}

function colCounts(c) {
	const cells = cellStore.getState().cells;
	var counts = [0,0,0,0,0,0,0,0,0,0];
	var col = cols[c];
	for (var j=0; j<9; ++j) {
		const cix = col[j];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.candidates;
		candid.map((c) => {
			counts[c] += 1;
		});
	}
	return counts;
}

function sqCounts(s) {
	const cells = cellStore.getState().cells;
	var counts = [0,0,0,0,0,0,0,0,0,0];
	var csq = squares[s];
	for (var j=0; j<9; ++j) {
		const cix = csq[j];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.candidates;
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
	const cells = cellStore.getState().cells;
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
	const cells = cellStore.getState().cells;
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
	const cells = cellStore.getState().cells;
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
	const cells = cellStore.getState().cells;
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
	var single = null;
	for (var i=0; i<9; ++i) {
		if (ar[i] > 0) {
			if (single != null) return null
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
	var sqVal = [0,0,0,0,0,0,0,0,0,0];
	for (var sq=0; sq<9; ++sq) {
		// for each value
		for (var value=1; value<10; ++value) {
			var vRows = [0,0,0,0,0,0,0,0,0];
			var vCols = [0,0,0,0,0,0,0,0,0];
			var vCellsR = [[],[],[],[],[],[],[],[],[],[]]
			var vCellsC = [[],[],[],[],[],[],[],[],[],[]]
			// for each cell with the candidate value get the row and col
			var sqCells = squares[sq];
			// for each cell in the square
			for (var c=0; c<9; ++c) {
				var cix = sqCells[c];
				var sc = cells[cix];
				var crow = cellRow[cix];
				var ccol = cellCol[cix];
				if (sc.value > 0) continue;
				if (sc.activecandidates.includes(value)) {
					sqVal[value]++;
					vRows[crow]++;
					vCols[ccol]++;
					vCellsR[crow].push(cix);
					vCellsC[ccol].push(cix);
				}
			}
			//console.log(value, vRows);
			var singleRow = hasSingleValueRC(vRows);
			var singleCol = hasSingleValueRC(vCols);
			// skip singletons (should not happen)
			if (singleRow || singleCol) {
				if (singleRow) {
					//console.log("sr", value, singleRow, vRows);
					var src = {
						square: sq,
						row: singleRow,
						col: null,
						count: vRows[singleRow],
						cells: vCellsR[singleRow],
						value: value
					}
					ppCandidates.push(src);
					//console.log("ppsr", sq, value, singleRow, vRows, vCellsR[singleRow]);
				}
				if (singleCol) {
					//console.log("sc", value, singleCol, vCols);
					var src = {
						square: sq,
						row: null,
						col: singleCol,
						count: vCols[singleCol],
						cells: vCellsC[singleCol],
						value: value
					}
					ppCandidates.push(src);
					//console.log("ppsc", sq, value, singleCol, vCols, vCellsC[singleCol] );
				}

			}
		}
	}

	//console.log("ppc", ppCandidates)

	// for each candidate check if any other cells in the row or col contain the candidate value
	var ppHintsRaw = [];
	var targets = [];
	ppCandidates.forEach((ppc) => {
		var value = ppc.value;
		var pcells = ppc.cells;
		var disqualified = true;
		if (ppc.row) {
			var row = rows[ppc.row];
			for (var r=0; r<9; ++r) {
				var cix = row[r];
				if (!pcells.includes(cix)) {
					var rc = cells[cix];
					if (rc.value === 0 && rc.activecandidates.includes(value)) {
						console.log("hr", cix, r, value, pcells, rc);
						disqualified = false;
						targets.push(cix);
					}
				}
			}
		}
		if (ppc.col) {
			var col = cols[ppc.col];
			for (var c=0; c<9; ++c) {
				var cix = col[c];
				if (!pcells.includes(cix)) {
					var cc = cells[cix];
					if (cc.value === 0 && cc.activecandidates.includes(value)) {
						console.log("hc", cix, c, value, pcells, cc);
						disqualified = false;
						targets.push(cix);
					}
				}
			}
		}
		if (!disqualified) ppHintsRaw.push(ppc);
	})
	//console.log("ppHintsRaw", ppHintsRaw);

	var ppHints = [];

	ppHintsRaw.forEach((pp) => {
		var msg = "Pointing Pair: ";
		msg += pp.row ? `Row: ${pp.row+1}` : "";
		msg += pp.col ? `Column: ${pp.col+1}` : "";
		msg += `, Value: ${pp.value}`;

		var pp = {
			type: 'pointingPair',
			row: pp.row,
			col: pp.col,
			square: pp.square,
			cells: pp.cells,
			offset: null,
			value: pp.value,
			targets: targets,
			msg: msg
		}
		ppHints.push(pp);
	})

	//console.log("ppHints", ppHints);

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

function findPairs(p0, p1, cells) {
	var pairs = [];
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if (c.value == 0 && ac.length === 2) {
			if (ac.includes(p0) && ac.includes(p1)) {
				var rcs = [cellRow[cix],cellCol[cix],cellSquare[cix]];
				pairs.push([cix,ac,rcs]);
			}
		}
	}
	return pairs;
}

function findPairInRow(rix, p, cells) {
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

function findPairInCol(cixin, p, cells) {
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
			pivots.push([cix, ac]);
		}
	}
	//console.log("xyz", pivots);

	var xyPairs = [];
	var xzPairs = [];
	var yzPairs = [];
	pivots.forEach((piv) => {
		// find candidate pairs
		var pix = piv[0];	// pivot cell id
		var pac = cells[pix].activecandidates;
		var xy = [pac[0],pac[1]];
		var xz = [pac[0],pac[2]];
		var yz = [pac[1],pac[2]];
		var xyz = [pac[0],pac[1],pac[2]];
		xyPairs = findPairs(pac[0],pac[1],cells);
		xzPairs = findPairs(pac[0],pac[2],cells);
		yzPairs = findPairs(pac[1],pac[2],cells);

		var count = 0;
		if (xyPairs.length > 0) ++count;
		if (xzPairs.length > 0) ++count;
		if (yzPairs.length > 0) ++count;

		if (count >= 2) {
			//console.log("candidate", pix, xyz)
			//console.log(xyPairs,xzPairs,yzPairs);
		} else {
			return null;	// nothing to do here
		}

		// are any of the pairs in the same row/col/square as the pivot
		var pr = cellRow[pix];
		var pc = cellCol[pix];
		var ps = cellSquare[pix];
		//console.log("rcs", pr, pc, ps);

		// find pairs in same row
		var xyRow = [];
		var xzRow = [];
		var yzRow = [];
		xyPairs.forEach((p) => {if (cellRow[p[0]] === pr) xyRow.push(p);})
		xzPairs.forEach((p) => {if (cellRow[p[0]] === pr) xzRow.push(p);})
		yzPairs.forEach((p) => {if (cellRow[p[0]] === pr) yzRow.push(p);})

		// find pairs in same col
		var xyCol = [];
		var xzCol = [];
		var yzCol = [];
		xyPairs.forEach((p) => {if (cellCol[p[0]] === pc) xyCol.push(p);})
		xzPairs.forEach((p) => {if (cellCol[p[0]] === pc) xzCol.push(p);})
		yzPairs.forEach((p) => {if (cellCol[p[0]] === pc) yzCol.push(p);})

		// find pairs in same square
		var xySquare = [];
		var xzSquare = [];
		var yzSquare = [];
		xyPairs.forEach((p) => {if (cellSquare[p[0]] === ps) xySquare.push(p);})
		xzPairs.forEach((p) => {if (cellSquare[p[0]] === ps) xzSquare.push(p);})
		yzPairs.forEach((p) => {if (cellSquare[p[0]] === ps) yzSquare.push(p);})

		var count = 0;
		var xyHaveRow = (xyRow.length > 0);
		var xzHaveRow = (xzRow.length > 0);
		var yzHaveRow = (yzRow.length > 0);
		//console.log("Rows");
		//console.log(xyRow,xzRow,yzRow);

		var xyHaveCol = (xyCol.length > 0);
		var xzHaveCol = (xzCol.length > 0);
		var yzHaveCol = (yzCol.length > 0);
		//console.log("Cols");
		//console.log(xyCol,xzCol,yzCol);

		var xyHaveSquare = (xySquare.length > 0);
		var xzHaveSquare = (xzSquare.length > 0);
		var yzHaveSquare = (yzSquare.length > 0);
		//console.log("Squares");
		//console.log(xySquare,xzSquare,yzSquare);

		//console.log(xyHaveRow,xzHaveRow,yzHaveRow,xyHaveCol,xzHaveCol,yzHaveCol);
		//console.log(xyRow,xzRow,yzRow,xyCol,xzCol,yzCol);
		// check for a candidate from a row and a col
		if (xzHaveCol && xyHaveRow) {
			//console.log("Combo 1");
			//console.log(xyRow,xzCol);
			var xyRowMates = findPairInRow(pr, xy, cells);
			var xzColMates = findPairInCol(pc, xz, cells);
			//console.log("pivot", piv)
			//console.log("matesX", xyRowMates, );
			xyzwings.push(xyzHint(pix, xyz[0], pr, pc, ps, xyRowMates,xzColMates));
		}
		if (yzHaveCol && xyHaveRow) {
			//console.log("Combo 2");
			//console.log(xyRow,yzCol);
			var xyRowMates = findPairInRow(pr, xy, cells);
			var yzColMates = findPairInCol(pc, yz, cells);
			//console.log("pivot", piv)
			//console.log("matesY", xyRowMates, yzColMates);
			xyzwings.push(xyzHint(pix, xyz[1], pr, pc, ps, xyRowMates,yzColMates));
		}
		if (xyHaveCol && xzHaveRow) {
			//console.log("Combo 3");
			//console.log(xzRow,xyCol);
			var xzRowMates = findPairInRow(pr, xz, cells);
			var xyColMates = findPairInCol(pc, xy, cells);
			//console.log("pivot", piv)
			//console.log("matesX", xzRowMates, xyColMates);
			xyzwings.push(xyzHint(pix, xyz[0], pr, pc, ps, xzRowMates,xyColMates));
		}
		if (yzHaveCol && xzHaveRow) {
			//console.log("Combo 4");
			//console.log(xzRow,yzCol);
			var xzRowMates = findPairInRow(pr, xz, cells);
			var yzColMates = findPairInCol(pc, yz, cells);
			//console.log("pivot", piv)
			//console.log("matesZ", xzRowMates, yzColMates);
			xyzwings.push(xyzHint(pix, xyz[2], pr, pc, ps, xzRowMates,yzColMates));
		}
		if (xyHaveCol && yzHaveRow) {
			//console.log("Combo 5");
			//console.log(yzRow,xyCol);
			var yzRowMates = findPairInRow(pr, yz, cells);
			var xyColMates = findPairInCol(pc, xy, cells);
			//console.log("pivot", piv)
			//console.log("matesY", yzRowMates, xyColMates);
			xyzwings.push(xyzHint(pix, xyz[1], pr, pc, ps, yzRowMates,xyColMates));
		}
		if (xzHaveCol && yzHaveRow) {
			//console.log("Combo 6");
			//console.log(yzRow,xzCol);
			var yzRowMates = findPairInRow(pr, yz, cells);
			var xzColMates = findPairInCol(pc, xz, cells);
			//console.log("pivot", piv)
			//console.log("matesZ", yzRowMates, xzColMates);
			xyzwings.push(xyzHint(pix, xyz[2], pr, pc, ps, yzRowMates,xzColMates));
		}

	})

	if (xyzwings.length === 0) return null;
	console.log("xyzHints", xyzwings);
	return xyzwings;
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
					console.log("found XY", wval, piv, rp, cp);

					var h = {
						type: 'xyWing',
						row: piv[1],
						col: piv[2],
						square: null,
						cells: [piv[0]],
						offset: null,
						value: wval,
						targets: [rp[0],cp[0]],
						msg: `XY-Wing: Cell: ${piv[0]}, Value: ${wval}`
					}

					//console.log("hint", h);
					xywings.push(h);
				}
			}
		}

	}

	if (xywings.length === 0) return null;
	console.log("xyHints", xywings);
	return xywings;
}

function uniquePairsx(pairs) {
	var unique = [];
	for (var i=0; i<9; ++i) {
		var p0 = pairs[i];
		var pix = p0[0]
		var p0v0 = p0[1][0];
		var p0v1 = p0[1][1];
		// check the rest for a match
		var match = null;
		for (var j=0; j<9; ++j) {
			if (i === j) continue;
			var p1 = pairs[j];
			var p1v0 = p1[1][0];
			var p1v1 = p1[1][1];
			if ((p0v0 !== p1v0 && p0v0 !== p1v1) || (p0v1 !== p1v0 && p0v1 !== p1v1)) {
				// unique pair, so far
				if (match) {
					// not unique
					match = null;
					break;
				}
				match = p0;
			}
		}
		if (match) unique.push(match);
	}
}

function uniquePairsy(pairs) {
	const seen = new Set();

	return pairs.filter(([a, b]) => {
		const key = Math.min(a, b) * 10 + Math.max(a, b);

		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function uniquePairs(pairs) {

	const seen = new Set();

	return pairs.filter((p) => {
		var a = p[1][0];
		var b = p[1][1];
		//const key = Math.min(a, b) * 10 + Math.max(a, b);
		const key = Math.min(a, b) * 10 + Math.max(a, b);
		console.log(a,b,key);

		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

}

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

function tripleTargets(row, col, sq, cls, vals, cells) {
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

	// check the rows for four or more pairs

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
		var tgts = tripleTargets(row, col, sq, cls, vals, cells);
		console.log(trip, row, col, sq, cls, vals, tgts);
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


