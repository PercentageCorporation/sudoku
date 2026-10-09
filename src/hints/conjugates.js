import {Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS} from '/src/utilities/constants';
import { cellStore, useCellActions } from "/src/store/store";
import { initCounts, rCounts2, cCounts2, sCounts2, includesAll } from '/src/hints/hints';

let cells = [];
let conjugateCells = null;
let conjugatePairs = [];
let strongLinks = [];	// includes conjugate pairs and bivalue cells

// *****************************************************************************
// functions called from anywhere

export function getConjugatePairs() {
	cells = cellStore.getState().cells;
	if (cells !== conjugateCells || conjugatePairs.length === 0) {
		var cp = calculateConjugatePairs();
		conjugatePairs = cp[0];

		conjugateCells = cells;
		console.log("conjugate pairs updated", conjugatePairs.length);
	}

	return conjugatePairs;
}

// get the conjugate pairs for the given value
export function getConjugatePairsForValue(cpairs, v) {
	getConjugatePairs();
	var vp = [];
	cpairs.forEach((cp) => {
		if (cp[0] === v) vp.push(cp);
	})
	return vp;
}

// get the conjugate pairs that contain the cell [cix]
export function getConjugatePairsWithCell(cpairs, cix) {
	getConjugatePairs();
	var cp = [];
	conjugatePairs.forEach((cp) => {
		if (cp[1][0] === cix || cp[2][0] === cix) vp.push(cp);
	})
	return cp;
}

// is the cell in a conjugate pair
export function cellInConjugatePair(cix, value) {
	getConjugatePairs();
	var cplen = conjugatePairs.length;
	for (var i=0; i<cplen; ++i) {
		var cp = conjugatePairs[i];
		if (value > 0 && value !== cp[0]) continue;
		if (cix === cp[1][0]) return 1;
		if (cix === cp[2][0]) return 2;
	}
	return 0;
}


// find all occurances of the value in the row/col/sq
function findValuePairsInRCS(arr, val) {
	var cls = [];
	for (var i=0; i<9; ++i) {
		const cixi = arr[i];
		const celli = cells[cixi];
		if (celli.value > 0) continue;
		var aci = celli.activecandidates;
		if (!aci.includes(val)) continue;
		// found one, look for the other
		for (var j=i+1; j<9; ++j) {
			const cixj = arr[j];
			const cellj = cells[cixj];
			if (cellj.value > 0) continue;
			var acj = cellj.activecandidates;
			if (!acj.includes(val)) continue;
			// found two
			// cls: [ [offset, cix, ac], [offset, cix, ac] ]
			cls.push([i, cixi, aci],[j, cixj, acj]);
		}
	}
	return cls;
}

function addBivalueLinks(cpairs2) {

}

// find conjugate pairs
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
// if a value only appears twice in a row/col/sq it is a strong link conjugate pair
function calculateConjugatePairs() {

	// for each row for each value of count 2 get their cell info
	var cpairs = [];
	var cpairs2 = [];
	initCounts();

	for (var v=1; v<10; ++v) {
		var vrows = rCounts2[v];
		//console.log(v, vrows);
		// vrows are the rows containing 2 of value v
		vrows.forEach((r) => {
			// vrows [ [offset1, cell1, ac1] [offset2, cell2, ac2] ]
			// find the two cells containing value v in the row
			var vals = findValuePairsInRCS(Rows[r], v);
			if (vals.length === 2) {
				var ac1 = vals[0][2]
				var ac2 = vals[1][2]
				var cel1 = vals[0][1];
				var cel2 = vals[1][1];
				var rcs1 = [cel1, ac1];
				var rcs2 = [cel2, ac2];
				cpairs.push([v, rcs1, rcs2]);
				cpairs2.push([ [cel1,cel2], [v, v], [r,-1,-1] ]);
			}
		})
		var vcols = cCounts2[v];
		//console.log(v, vcols);
		vcols.forEach((c) => {
			// vals [ [offset1, cell1, ac1] [offset2, cell2, ac2] ]
			var vals = findValuePairsInRCS(Cols[c], v);
			if (vals.length === 2) {
				var ac1 = vals[0][2]
				var ac2 = vals[1][2]
				var cel1 = vals[0][1];
				var cel2 = vals[1][1];
				var rcs1 = [cel1, ac1];
				var rcs2 = [cel2, ac2];
				cpairs.push([v, rcs1, rcs2]);
				cpairs2.push([ [cel1,cel2], [v, v], [-1,c,-1]]);
			}
		})

		var vsqs = sCounts2[v];
		//console.log(v, vsqs);
		vsqs.forEach((s) => {
			// vals [ [off1, cell1, ac1] [off2, cell2, ac2] ]
			var vals = findValuePairsInRCS(Squares[s], v);
			//console.log("vals", vals);
			if (vals.length === 2) {
				var ac1 = vals[0][2]
				var ac2 = vals[1][2]
				var cel1 = vals[0][1];
				var cel2 = vals[1][1];
				var rcs1 = [cel1, ac1];
				var rcs2 = [cel2, ac2];
				// check if pair in square is also in a row or column
				var dup = false;
				for (var cx=0; cx<cpairs2.length; ++cx) {
					var cp = cpairs2[cx];
					if ((cp[0][0] === cel1 && cp[0][1] === cel2) || (cp[0][0] === cel1 && cp[0][1] === cel2)) {
						// same pair, just add the square index
						//console.log(v, cx, s, cp, cpairs2)
						cpairs2[cx][2][2] = s;
						dup = true;
						break;
					}
				}
				if (!dup) {
					cpairs2.push([ [cel1,cel2], [v, v], [-1,-1,s] ]);
					cpairs.push([v, rcs1, rcs2]);
				}
			}
		})
	}
	//console.log("cpairs", cpairs);
	//console.log("cpairs", cpairs.length, rowp, colp, sqp);

	return [cpairs, cpairs2];
}

// find all cells with just 2 candidates
// return array sorted by candidate pairs
// bv: [ cix, [ac] ]
export function findAllBivalueCells() {
	var bv = [];
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if ( c.value === 0 && ac.length === 2) {
			bv.push([cix,  ac]);
		}
	}
	bv = bv.sort((a,b) => a[1][0] - b[1][0]);	// sort by first candidate
	bv = bv.sort((a,b) => a[1][1] - b[1][1]);	// then by second candidate

	return bv;
}

// list all bivalue cells where there are two or more cells
// bvp: [ [ac], [[cix0, rcs0], [cix1, rcs1], ... ] ]

export function getBivalueList() {

	var bvpairs = findAllBivalueCells();
	var bvplen = bvpairs.length;
	//console.log("bvpairs", bvpairs)
	// bv: [ cix, [ac] ]
	// pack the pairs
	var bvpp = [];
	var brcsi = [];
	// first, pack the list of pairs so there is only one entry per pair
	for (var i = 0; i < bvplen; ++i) {
		// bvpi: [ [ac], [[cix, rcs], ... ] ]
		var bvpi = bvpairs[i];
		var brcsi = [bvpi[1], [bvpi[0]]];
		for (var j = i + 1; j < bvplen; ++j) {
			var bvpj = bvpairs[j];
			if (includesAll(bvpi[1], bvpj[1])) {
				brcsi[1].push(bvpj[0]);	// add cell ix to array
			} else {
				bvpp.push(brcsi);
				brcsi = null;
				//continue bvi;
				i = j - 1;
				break;
			}
		}
		if (brcsi) bvpp.push(brcsi);
	}
	var bvpl = [];
	// get all the entries with two or more cells
	bvpp.forEach((b) => {
		if (b[1].length >= 2) bvpl.push(b);
	})
	//console.log("bvpp", bvpp)
	return bvpl;
}

