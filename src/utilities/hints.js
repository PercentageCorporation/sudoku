import { cellStore, useCellActions } from "/src/store/store";
import {rows, cols, squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012} from '/src/utilities/constants';

export function runHints() {
	var result;

	result = XYZWing();
	if (result) return result[0];
	result = singletons();
	if (result) return result[0];
	result = rowSingleCounts();
	if (result) return result[0];
	result = colSingleCounts();
	if (result) return result[0];
	result = sqSingleCounts();
	if (result) return result[0];
	result = XWing();
	if (result) return result[0];
	result = findNakedPairs();
	if (result) return result[0];
	result = findPointingPairs2();
	if (result) return result[0];
	result = pointingPairsRowCol();
	if (result) return result[0];
	result = XWing();
	if (result) return result[0];

	return null;
}
 function includesPair(arr, v0, v1) {
	 for (var i=0; i<arr.length; ++i) {
		 if (arr[i] === v0 || arr[i] === v1) return true;
	 }
	return false;
}

// find pointing pairs in square
// only cells with just 2 candidates
function findPointingPairs2() {
	const getCells = cellStore.getState().actions.getCells;
	const cells = getCells();
	// find pairs in squares
	var pairsRow = [];
	var pairsCol = [];
	var pairsSq = [];

	// look for cells with just two active candidates
	for (var s=0; s<9; ++s) {
		var sq = squares[s];	// cells for square
		var sqpairs = [];
		for (var c=0; c<9; ++c) {
			var cix = sq[c];	// cell index in square
			var cx = cells[cix];
			if (cx.value === 0 && cx.activecandidates.length === 2) {
				// found a cell with a pair pair
				sqpairs.push(
					{
						square: s,
						cell: cix,
						row: cellRow[cix],
						col: cellCol[cix],
						v0: cx.activecandidates[0],
						v1: cx.activecandidates[1],
					}
				);
			}
		}
		//console.log("sqpairs", s, sqpairs);

		// look for other cells with the same pair in the same row/col/or ?
		var sqpl = sqpairs.length;
		if (sqpl >= 2) {
			//console.log(s, sqpairs);
			// find matching pair, if any
			// by definition, there should not be more than two that match each other
			for (var i=0; i<sqpl; ++i) {
				for (var j=i+1; j<sqpl; ++j) {
					var pi = sqpairs[i];
					var pj = sqpairs[j];
					if (pi.v0 === pj.v0 && pi.v1 === pj.v1) {
						// we have a match, but are they in the same row/col
						if (pi.row === pj.row) {
							// matching pair row
							pairsRow.push([pi, pj]);
						} else if (pi.col === pj.col) {
							// matching pair col
							pairsCol.push([pi, pj]);
						}
						// any of them could be for a square
						pairsSq.push([pi, pj]);
					}
				}
			}
		}
	}
	// now we need to check if there are any candidates we can eliminate
	const pfinal= [];
	//console.log("pr", pairsRow);
	//console.log("pc", pairsCol);
	//console.log("ps", pairsSq);

	// try rows first
	pairsRow.forEach((ppr) => {
		// since they are similar, we only need to look at one of the pairs
		var rix = ppr[0].row;
		var c0 =  ppr[0].cell;
		var c1 =  ppr[1].cell;
		var v0 =  ppr[0].v0;
		var v1 =  ppr[0].v1;
		var row = rows[rix];
		var targets = [];
		var hasCandidates = false;
		for (var i=0; i<9; ++i) {
			var cix = row[i];
			if (cix === c0 || cix === c1) continue;
			var c = cells[cix];
			if (c.value === 0 && includesPair(c.activecandidates, v0, v1)) {
				hasCandidates = true;
				targets.push(cix);
			}
		}
		//console.log(hasCandidates, ppr)
		if (hasCandidates) {
			var pf = {
				type: "pointingPairs2",
				direction: "row",
				row: rix,
				col: null,
				square: p0.square,
				cells: [ p0.cell, p1.cell ],
				offset: null,
				values: [p0.v0, p0.v1],
				targets: targets,
				msg: msg
			};
			pfinal.push(pf);
		}
	})

	// try cols next
	pairsCol.forEach((ppc) => {
		// since they are similar, we only need to look at one of the pairs
		var rix = ppc[0].col;
		var c0 =  ppc[0].cell;
		var c1 =  ppc[1].cell;
		var v0 =  ppc[0].v0;
		var v1 =  ppc[0].v1;
		var col = cols[rix];
		var targets = [];
		var hasCandidates = false;
		for (var i=0; i<9; ++i) {
			var cix = col[i];
			if (cix === c0 || cix === c1) continue;
			var c = cells[cix];
			if (c.value === 0 && includesPair(c.activecandidates, v0, v1)) {
				hasCandidates = true;
				targets.push(cix);
			}
		}
		//console.log(hasCandidates, ppc)
		if (hasCandidates) {
			var pf = {
				type: "pointingPairs2",
				direction: "col",
				row: rix,
				col: null,
				square: p0.square,
				cells: [ p0.cell, p1.cell ],
				offset: null,
				values: [p0.v0, p0.v1],
				targets: targets,
				msg: msg
			};
			pfinal.push(pf);
		}
	})

	// now for squares
	pairsSq.forEach((pps) => {
		// since they are similar, we only need to look at one of the pairs
		var six = pps[0].square;
		var c0 =  pps[0].cell;
		var c1 =  pps[1].cell;
		var v0 =  pps[0].v0;
		var v1 =  pps[0].v1;
		var sq = squares[six];
		var targets = [];
		var hasCandidates = false;
		for (var i=0; i<9; ++i) {
			var cix = sq[i];
			if (cix === c0 || cix === c1) continue;
			var c = cells[cix];
			//console.log( six, i, cix, v0, v1, c);
			if (c.value === 0 && includesPair(c.activecandidates, v0, v1)) {
				hasCandidates = true;
				targets.push(cix);
			}
		}
		//console.log(hasCandidates, pps)
		if (hasCandidates) {
			var msg = `PointingPair Square: ${six} Values: ${v0}, ${v1}`;
			var pf = {
				type: "pointingPairs2",
				direction: "sq",
				row: null,
				col: null,
				square: six,
				cells: [ c0, c1 ],
				offset: null,
				values: [v0, v1],
				targets: targets,
				msg: msg
			};
			pfinal.push(pf);
		}
	});

	if (pfinal.length === 0) return null;
	return pfinal;
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

function hasValuePair(ar) {
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
			var singleRow = hasValuePair(vRows);
			var singleCol = hasValuePair(vCols);
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
										console.log("push3", cix0);
									}
								}
							}
						}
						if (hasCandidates) {
							var x0 = (r0*9)+c0;
							var x1 = (r0*9)+c1;
							var x2 = (r1*9)+c0;
							var x3 = (r1*9)+c1;
							console.log(x0,x1,x2,x3);
							var xwcells = [
								rows[r0][c0],
								rows[r0][c1],
								rows[r1][c0],
								rows[r1][c1],
							];
							console.log("has", targets, r0, r1, c0, c1, xwcells);
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
	//console.log("xwz", pivots);

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


