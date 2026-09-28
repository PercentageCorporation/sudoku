import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS } from '/src/utilities/constants';
import { findTargets, findInternalTargets, includesAll, includesAny } from '/src/hints/hints';
import { cells, findAllBivalueCells, findAllTrivalueCells } from '/src/hints/hints';


//*****************************************************************************
// common functions

function getCommonValue(ac1, ac2) {
	// find the common value
	return ac1.filter(item => ac2.includes(item));
}

function findPairInRow(rix, p) {
	//console.log("inRow", rixin, p);
	var rp = [];
	var row = Rows[rix];
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
	var col = Cols[cixin];
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

function findXYPairs(ppiv, pivots) {
	var pairs = [];

	var ppix = ppiv[0];	// pivot cell id
	var prow = ppiv[1];
	var pcol = ppiv[2];
	var psq = ppiv[3];
	var pac = ppiv[4];

	// find pair cells containing XY
	for (var p=0; p<pivots.length; ++p) {
		var piv = pivots[p];
		// piv : [cix, row, col, sq, ac]

		var pix = piv[0];
		//console.log("piv", ppiv, piv);

		if (pix === ppix) continue;	// skip ourselves
		if (prow !== piv[1] && pcol !== piv[2] && psq !== piv[3]) continue;	// skip if not same row/col/square
		if (!pac.includes(pac[0]) && !pac.includes(pac[1])) continue;	// skip if x or y value not in cell

		var ac = piv[4];
		pairs.push([pix, cellRow[pix], cellCol[pix], cellSquare[pix], ac]);
	}
	return pairs;
}

// the kill zone is definded as those cells sharing a house with the wings
// if the wings are far apart this means only the corners of the square defined by the wing cells are targets
// ?????? if the wings intersect the same square, then row/square combination can be used to find the kill zone
function findKillZone(pix, p0, p1, val) {
	// px: cix, row, col, sq, ac
	var targets = [];

	var psq = cellSquare[pix];
	var p0r = p0[1];
	var p0c = p0[2];
	var p0s = p0[3];
	var p1r = p1[1];
	var p1c = p1[2];
	var p1s = p1[3];

	// the corners are obvious candidates for the kill zone
	var c0x = Rows[p0r][p1c];
	var c1x = Rows[p1r][p0c];
	if (pix !== c0x && cellHasCandidate(c0x,val)) targets.push(c0x);
	if (pix !== c1x && cellHasCandidate(c1x,val)) targets.push(c1x);

	// if the pivot and one of the wings are in the same square we can consider the following
	// otherwise we go home

	if (psq !== p0s && psq !== p1s) return targets;
	//console.log("looking for more", psq, p0s, p1s);

	// if the row/col of a wing intersects the square of the other wing
	// then the cells in common are target candidates
	// we can use the corners to define the wing squares
	// does row/col p0r/p0c intersect p1s and/or does row/col p1r/p2r intersect p0s

	var sqrows0 = sqRows012[p0s];	// rows in wing 0 square
	var sqcols0 = sqCols012[p0s];	// rows in wing 0 square
	var sqrows1 = sqRows012[p1s];	// rows in wing 1 square
	var sqcols1 = sqCols012[p1s];	// rows in wing 1 square

	if (sqrows0.includes(p1r)) {
		var s0ix = p1r % 3;
		var tgtcls = sqRowCells[p0s][s0ix];
		tgtcls.forEach((tc) => {if (pix !== tc && cellHasCandidate(tc,val)) targets.push(tc)});
		//console.log("rowsInSq 0", sqrows0, p0r, p1r, p0s, p1s, s0ix, tgtcls);
	}
	if (sqrows1.includes(p0r)) {
		var s1ix = p0r % 3;
		var tgtcls = sqRowCells[p1s][s1ix];
		tgtcls.forEach((tc) => {if (pix !== tc && cellHasCandidate(tc,val)) targets.push(tc)});
		//console.log("rowsInSq 1", sqrows1, p0r, p1r, p0s, p1s, s1ix, tgtcls);
	}
	if (sqcols0.includes(p1c)) {
		var s0ix = p1c % 3;
		var tgtcls = sqColCells[p0s][s0ix];
		tgtcls.forEach((tc) => {if (pix !== tc && cellHasCandidate(tc,val)) targets.push(tc)});
		//console.log("colsInSq 0", sqrows0, p0c, p1c, p0s, p1s, s0ix, tgtcls);
	}
	if (sqcols1.includes(p0c)) {
		var s1ix = p0c % 3;
		var tgtcls = sqRowCells[p1s][s1ix];
		tgtcls.forEach((tc) => {if (pix !== tc && cellHasCandidate(tc,val)) targets.push(tc)});
		//console.log("colsInSq 1", sqrows1, p0c, p1c, p0s, p1s, s1ix, tgtcls);
	}

	return targets;
}

//*****************************************************************************
// X-Wing

export function XWing() {
	var xwings = [];

	// for every value
	for (var value=1; value<10; ++value) {
		// for each row
		var rowPairs = [];
		for (var r=0; r<9; ++r) {
			var count = 0;
			var colCells = [];
			var row = Rows[r];
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
							var row = Rows[rx];
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
							var col = Cols[cx];
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
								Rows[r0][c0],
								Rows[r0][c1],
								Rows[r1][c0],
								Rows[r1][c1],
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

//*****************************************************************************
// XY-Wing

export function XYWing() {
	var pivots = [];
	var xywings = [];

	// find pivot cells
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if ( c.value === 0 && ac.length === 2) {
			pivots.push([cix, cellRow[cix], cellCol[cix], cellSquare[cix],  ac]);
		}
	}
	//console.log("xy pivots", pivots);

	var xyPairs = [];
	for (var px=0; px<pivots.length; ++px) {
		// find candidate pairs
		// piv: [cix, row, col, ac]
		var piv = pivots[px];
		var pix = piv[0];	// pivot cell id
		var prow = piv[1];
		var pcol = piv[2];
		var psq = piv[3];
		var pac = piv[4];
		var x = pac[0];
		var y = pac[1];

		var xyPairs = findXYPairs(piv, pivots);
		if (xyPairs.length === 0) continue;

		// examine each wing combination
		for (var i=0; i<xyPairs.length; ++i) {
			for (var j=i+1; j<xyPairs.length; ++j) {
				// xyPair : [pix, row, col, sq, ac]
				var pi = xyPairs[i];
				var pj = xyPairs[j];
				if (pi[0] === pj[0]) continue;	// just in case ???

				// the wings must have a value in common that is not in the pivot
				var z = -1;
				if (pi[4][0]===pj[4][0])
					z = pi[4][0];
				else if (pi[4][0]===pj[4][1])
					z = pi[4][0];
				else if (pi[4][1]===pj[4][0])
					z = pi[4][1];
				else if (pi[4][1]===pj[4][1])
					z = pi[4][1];
				if (z < 0) continue;
				if (pac.includes(z)) continue;
				// the wings must have one value in common with the house
				if (!includesAny(pac,pi[4])) continue;
				if (!includesAny(pac,pj[4])) continue;
				// the wings cannot be in the same house
				if (pi[1] === pj[1] || pi[2] === pj[2] || pi[3] === pj[3]) continue;
				// the wing values cannot be the same as the house
				if (includesAll(pac, pi[4])) continue;
				if (includesAll(pac, pj[4])) continue;
				// the wing values cannot be the same
				if (includesAll(pi[4],pj[4])) continue;

				// I think we found one
				//console.log("xy wings", pix, z, prow, pcol, psq, pac, pi, pj)
				// get the intersecting cells
				var killBill = findKillZone(pix, pi, pj, z);
				//console.log("killBill", z, killBill);

				var cix0 = Rows[pi[1]][pj[2]];
				var cix1 = Rows[pj[1]][pi[2]];
				//console.log("xy tgts", z, cix0, cix1, killBill);
				if (killBill.length > 0) {
					//console.log("found XY", wval, piv, rp, cp);
					var cls = [pix,pi[0],pj[0]];
					var h = {
						type: 'xyWing',
						rows: [pi[1],pj[1]],
						cols: [pi[2],pj[2]],
						square: null,
						cells: cls,
						offset: null,
						value: z,
						targets: killBill,
						msg: `XY-Wing: Cells: ${cls}, Value: ${z}`
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


//*****************************************************************************
// XYZ-Wing


export function XYZWing() {
	var xyzHints = [];

	// find pivot cells
	var pivots = findAllTrivalueCells();
	//console.log("xyz pivots", pivots);

	// find pincer cells
	for (var px=0; px<pivots.length; ++px) {
		var piv = pivots[px];
		var pix = piv[0];	// pivot cell index
		var pac = piv[4];	// pivot activecandidates
		var prow = cellRow[pix];
		var pcol = cellCol[pix];
		var psq = cellSquare[pix];

		// find two pairs whose values are included in the pincer but are not the same as each other
		// find candidate pairs

		// one of the pairs must be in the same square as the pincer
		// for each square find pairs that can be wings
		var sq = cellSquare[pix];
		var sqcells = Squares[sq];
		// for each cell in the square look for the first wing
		for (var i=0; i<9; ++i) {
			var cix1 = sqcells[i];
			var c = cells[cix1];
			//console.log(pix, sq, i,cix1)
			if (c.value > 0) continue;
			var w1ac = c.activecandidates;
			if ( w1ac.length != 2) continue;
			if (!includesAll(pac, w1ac)) continue;	// values not same as pivot

			// found one, look for another
			// the second wing must be in the same row or col of the pivot but cannot be in the same square
			// it also cannot be in the same row or column as the other wing

			var w1r = cellRow[cix1];	// w1 row
			var w1c = cellCol[cix1];	// w1 col
			//console.log("wing1", cix1, w1r, w1c, w1ac);

			for (var cix2=0; cix2<81; ++cix2) {
				var c = cells[cix2];
				if (c.value > 0) continue;
				var w2ac = c.activecandidates;
				if ( w2ac.length != 2) continue;
				if (!includesAll(pac, w2ac)) continue;	// must have the pivot values
				if (includesAll(w1ac, w2ac)) continue;	// cannot be the same values
				// it must be in the same row/col as the pivot
				var w2r = cellRow[cix2];	// w2 row
				var w2c = cellCol[cix2];	// w2 col
				var w2s = cellSquare[cix2];	// w2 square
				if (prow != w2r && pcol != w2c ) continue;	// not in same row or col
				if (psq === w2s) continue;	// cannot be in same square

				//console.log("pivot", pix, prow, pcol, pac);
				//console.log("wing1", cix1, w1r, w1c, w1ac);
				//console.log("wing2", cix2, w2r, w2c, w2ac);

				var cls = [pix, cix1, cix2];
				var vals = getCommonValue(w1ac, w2ac);
				var val = vals[0];
				// the targets are the cells in the pivot square with the same row/col as wing2
				var targets = [];
				for (var i=0; i<9; ++i) {
					var tix = sqcells[i];
					if (tix == pix) continue;	// skip the pivot cell
					if (tix == cix1) continue;	// skip the wing1 cell
					var tr = cellRow[tix];
					var tc = cellCol[tix];
					if (w2r !== tr && w2c != tc) continue;	// not same row/col
					//console.log("tgt?", val, tix, w2r, w2c, tr, tc);
					var c = cells[tix];
					if (c.value > 0) continue;
					var tac = c.activecandidates;
					if (tac.includes(val)) {
						//console.log("found target", tix, tac);
						targets.push(tix);
					}
				}

				if (targets.length > 0) {
					var h = {
						type: 'xyzWing',
						row: null,
						col: null,
						square: null,
						cells: cls,
						offset: null,
						value: val,
						targets: targets,
						msg: `XYZ-Wing: Cells: ${cls}, Value: ${val}`
					}
					xyzHints.push(h);
				}
			}
		}
	}

	if (xyzHints.length === 0) return null;
	console.log("xyzHints", xyzHints);
	return xyzHints;
}


//*****************************************************************************
// W-Wing

export function WWing() {
	var wwings = [];

	//console.log("wwing", rCounts2, cCounts2 );

	var bvp = findAllBivalueCells();
	// bv: [ cix, [ac] ]
	//console.log("bvp", bvp);

	var bvpp = [];
	var bvplen = bvp.length;
	var i = 0;
	while (i<bvplen) {
		var bvpi = bvp[i];
		var bvix = bvpi[0];
		var bxrcsi = RCS[bvix];
		// create array of [ [ac], [rcs] ]
		var bvppi = [bvp[i][4], [bxrcsi]];
		// check the rest of the pairs and collect the rcs
		for (var j=i+1; j<bvplen; ++j) {
			if (bvp[i][1].includesAll(bvp[j][1])) {
				var bxrcsj = RCS[bvp[j][0]];
				bvppi[1].push(bxrcsj)
			} else {
				if (bvppi[1].length > 1) bvpp.push(bvppi);
				bvppi = null;
				//continue bvi;
				i = j-1;
				break;
			}
		}
		if (bvppi && bvppi[1].length > 1) bvpp.push(bvppi);
		++i;
	}

	console.log("bvpp", bvpp);

	// we have all the bivalue pairs
	// we need to regroup them into pairs of pairs that cannot see each other

	var endpoints = [];
	bvpp.forEach((bvp) => {
		// bvp: [[pair] [[cix,r,c,s]...]]
		var bvp1 = bvp[1];
		var b1len = bvp1.length;
		if (b1len === 2) {
			if (bvp1[0][1] !== bvp1[1][1] && bvp1[0][2] !== bvp1[1][2] && bvp1[0][3] !== bvp1[1][3]) {
				endpoints.push(bvp);
				//console.log("push1", bvp);
			}
		} else {
			for (var i=0; i<b1len; ++i) {
				var bvp1i = bvp1[i];	//
				for (var j=i+1; j<b1len; ++j) {
					var bvp1j = bvp1[j];
					if (bvp1i[1] !== bvp1j[1] && bvp1i[2] !== bvp1j[2] && bvp1i[3] !== bvp1j[3]) {
						var bp = [bvp[0],[bvp1i,bvp1j]];
						endpoints.push(bp);
						//console.log("push2", i, j, bp);
					}
				}
			}
		}
	});
	console.log("endpoints", endpoints);



	if (wwings.length === 0) return null;
	console.log("wwings", wwings);
	return wwings;
}

