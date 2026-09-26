import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS } from '/src/utilities/constants';
import { rCounts2, cCounts2, sCounts2, rCounts3, cCounts3, rCounts23, cCounts23, sCounts23, rCounts2p, cCounts2p } from '/src/hints/hints';
import { cells, vRows, vCols, vSqs, vRowPT, vColPT, vSqPT } from '/src/hints/hints';
import { includesAll, includesAny } from '/src/hints/hints';
import { findAllBivalueCells, findSeenTargets, getActiveCandidates, rcsContainsValue, findTargets } from '/src/hints/hints';


//*****************************************************************************
// Unique Rectangles

function commonRow(c0, c1) {
	return ((RCS[c0][0] === RCS[c1][0]));
}

function commonColumn(c0, c1) {
	return ((RCS[c0][1] === RCS[c1][1]));
}
function commonSquare(c0, c1) {
	return ((RCS[c0][2] === RCS[c1][2]));
}

function getCellCandidates(cix) {
	var cell = cells[cix];
	if (cell.value > 0) return [];
	return cell.activecandidates;
}

function findDiagonalCorner(c0, cls) {
	for (var i = 0; i < cls.length; ++i) {
		var cx = cls[i];
		if (!commonRow(c0, cx) && !commonColumn(c0, cx)) return cx;
	}
	return null;
}

export function rectangles() {
	var bvpairs = findAllBivalueCells();
	console.log("bvpairs", bvpairs)
	// bv: [ cix, [ac] ]
	// pack the pairs
	var bvpp = [];
	var bvplen = bvpairs.length;
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
	console.log("bvpp", bvpp)

	// starting with a bivalue cell find all additonal cells containing the pair
	var b4p = [];
	bvpp.forEach((p) => {
		var pac = p[0];
		for (var i = 0; i < 81; ++i) {
			var c = cells[i];
			if (c.value > 0) continue;
			var ac = c.activecandidates;
			if (ac.length < 3) continue;	// already have the pairs
			if (!includesAll(ac, pac)) continue;
			p[1].push(i);
		}
		if (p[1].length >= 4) b4p.push(p);
	})
	console.log("b4p", b4p)

	// find all pairs that form a rectangle
	var b4plen = b4p.length;
	var squares = [];

	// compute all possible 4 cell combinations (starting with a bivalue cell)
	for (var b = 0; b < b4plen; ++b) {
		var bi = b4p[b];	// array containing the arrau of cells with the same pair as the original bivalue pair
		var bac = bi[0];	// original bivalue candidates
		var bic = bi[1];	//
		var biclen = bic.length;
		//console.log("bi", bi, biclen, bic);
		for (var i = 0; i < biclen; ++i) {
			var bi = bic[i];
			// bi: [ [ac] [cells containing pair]]
			if (getActiveCandidates(bi).length !== 2) continue;		// must start with a bivalue cell
			for (var j = i + 1; j < biclen; ++j) {
				var bj = bic[j];
				for (var k = j + 1; k < biclen; ++k) {
					var bk = bic[k];
					for (var l = k + 1; l < biclen; ++l) {
						var bl = bic[l];
						//console.log("sq", i, j, k, l, bi, bj, bk, bl, bic);
						// for every group of four cells there are only three possibilities
						// (i,j and k,l) or (i,k and j,l) or (i,l and j,k) must be in the same row
						var comsqr = false;	// common square row
						var comsqc = false;	// common square col
						if (commonRow(bi, bj) && commonRow(bk, bl)) {
							//console.log("rijkl", i, j, k, l, bi, bj, bk, bl);
							// if i,j and k,l have common rows, then either i,l and j,k or i,k and j,l must have common columns
							var rcs = commonSquare(bi, bj);	// if same row, if one is in common square the other has to be
							// they just cannot be in the same square
							if (rcs && RCS[bi][2] === RCS[bk][2]) continue;
							if (commonColumn(bi, bk) && commonColumn(bj, bl)) {
								//console.log("cikjl", i, j, k, l, bi, bj, bk, bl);
								// if the rows are in the same square, the columns cannot be
								// checking the ends of one common colum is sufficient
								var ccs = commonSquare(bi, bk);	// if same row, if one column is in square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bj][2]) continue; // if column ends in common squares they cannot be in the same square
								squares.push([bac, [bi, bj, bk, bl]]);
							} else if (commonColumn(bi, bl) && commonColumn(bj, bk)) {
								//console.log("ciljk", i, j, k, l, bi, bj, bk, bl);
								// if the rows are in the same square, the columns cannot be
								var ccs = commonSquare(bi, bl);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bj][2]) continue; // cannot be in the same square
								squares.push([bac, [bi, bj, bk, bl]]);
							}
						} else if (commonRow(bi, bk) && commonRow(bj, bl)) {
							//console.log("rikjl", i, j, k, l, bi, bj, bk, bl);
							var rsc = commonSquare(bi, bk);	// if same row, if one is in common square the other has to be
							// they just cannot be in the same square
							if (rsc && RCS[bi][2] === RCS[bj][0]) continue;
							// if i,k and j,l have common rows, then either (i,j and k,l) or (i,l and k,j) must have common columns
							if (commonColumn(bi, bj) && commonColumn(bk, bl)) {
								//console.log("cijkl", i, j, k, l, bi, bj, bk, bl);
								var ccs = commonSquare(bi, bj);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bk][2]) continue; // cannot be in the same square
								squares.push([bac, [bi, bj, bk, bl]]);
							} else if (commonColumn(bi, bl) && commonColumn(bk, bj)) {
								//console.log("cilkj", i, j, k, l, bi, bj, bk, bl, comsqr, comsqc);
								//console.log(i, j, k, l, bi, bj, bk, bl);
								var ccs = commonSquare(bi, bl);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bk][2]) continue; // cannot be in the same square
								squares.push([bac, [bi, bj, bk, bl]]);
							}
						} else if (commonRow(bi, bl) && commonRow(bj, bk)) {
							//console.log("riljk", i, j, k, l, bi, bj, bk, bl);
							var rsc = commonSquare(bi, bl);	// if same row, if one pair is in common square the other has to be
							// they just cannot be in the same square
							if (rsc && RCS[bi][2] === RCS[bj][0]) continue;
							// if i,l and j,k have common rows, then either (i,j and k,l) or (i,k and l,j) must have common columns
							if (commonColumn(bi, bj) && commonColumn(bk, bl)) {
								//console.log("ciljk",i, j, k, l, bi, bj, bk, bl);
								var ccs = commonSquare(bi, bj);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bj][2]) continue; // cannot be in the same square
								squares.push([bac, [bi, bj, bk, bk]]);
							} else if (commonColumn(bi, bk) && commonColumn(bj, bl)) {
								//console.log("cikjl",i, j, k, l, bi, bj, bk, bl);
								var ccs = commonSquare(bi, bk);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bj][2]) continue; // cannot be in the same square
								squares.push([bac, [bi, bj, bk, bl]]);
							}
						}
					}
				}
			}
		}
	}
	console.log("squares", squares);

	var rectangles = [];
	//return null;	// TEST
	for (var i = 0; i < squares.length; ++i) {
		// square: [ [ac], [c0,c1,c2,c3] ]
		var square = squares[i]
		var sqac = square[0];		// original bivalue pair
		var sqcells = square[1];	// cells in square

		var numextras = 0;
		var oneextra = 0;
		var oneextras = [];
		var extraextras = [];
		var extras = [];
		var nonextras = [];

		sqcells.forEach((s) => {
			// for each cell in the square
			var cac = getCellCandidates(s);
			var eac = cac.filter(x => !sqac.includes(x));	// extra candidates
			//console.log(cac, eac);
			//console.log(sqac, cac, eac);
			if (cac.length > 2) {
				eac.forEach(ac => { if (!extraextras.includes(ac)) extraextras.push(ac) });
				extras.push(s);
				if (eac.length === 1) {
					// there is one extra candidate
					++oneextra;
					var oe = eac[0];
					if (!oneextras.includes(oe)) oneextras.push(eac[0]);	// only add it once;
				}
				++numextras;

			} else {
				nonextras.push(s);
			}
		})
		console.log("ac", oneextra, numextras, sqac, sqcells, extras, extraextras, oneextras);
		// if there are two bivalue cells are they diagonal
		if (numextras === 2) {
			var c0 = nonextras[0];
			var c1 = nonextras[1];
			var diagonal = !commonRow(c0, c1) && !commonColumn(c0, c1);
		}

		if (oneextra === 1 && numextras === 1) {
			// Type 1 rectangle
			console.log("Type1", oneextra, numextras, extraextras, extras, oneextras);
			var tgts = [extras[0]];
			var vals = sqac;
			var h = {
				type: 'urType1',
				rows: null,
				cols: null,
				square: null,
				cells: sqcells,
				offset: null,
				values: vals,
				targets: tgts,
				msg: `UR Type1: Cells: ${tgts}, Value: ${vals}`
			}

			rectangles.push(h);
			continue;
		}

		if (oneextra === numextras && oneextra >= 1 && oneextra < 4 && oneextras.length === 1) {
			// two or three cells with the same extra candidate
			console.log("Type25", oneextra, numextras, extraextras, extras, oneextras);
			// Type 2 and 5 rectangles
			var val = oneextras[0];
			var cx0 = extras[0];
			var cx1 = extras[1];
			var tgts = findSeenTargets(val, cx0, cx1);
			console.log(val, cx0, cx1, tgts);
			if (tgts) {
				var h = {
					type: 'urType25',
					rows: null,
					cols: null,
					square: null,
					cells: sqcells,
					offset: null,
					value: val,
					targets: tgts,
					msg: `UR Type25: Cells: ${tgts}, Value: ${val}`
				}
				rectangles.push(h);
			}
			continue;
		}

		if (nonextras === 1) continue;	// ????

		// now we can try for a Type 6
		// we need two diagonal bivalue cells with the remaining cells having extra candidates
		if (numextras === 2 && diagonal) {
			var cn0 = nonextras[0];
			var cn1 = nonextras[1];
			var val0 = sqac[0];
			var val1 = sqac[1];
			// check both rows/cols for each value
			var row0 = Rows[cellRow[cn0]];
			var col0 = Cols[cellCol[cn0]];
			var row1 = Rows[cellRow[cn1]];
			var col1 = Cols[cellCol[cn1]];

			var tgtsr0 = findTargets(row0, [val0], sqcells);
			var tgtsc0 = findTargets(col0, [val0], sqcells);
			var tgtsr1 = findTargets(row1, [val0], sqcells);
			var tgtsc1 = findTargets(col1, [val0], sqcells);
			hasVal0 = tgtsr0 !== null || tgtsc0 !== null || tgtsr1 !== null || tgtsc1 !== null;
			var tgtsr0 = findTargets(row0, [val1], sqcells);
			var tgtsc0 = findTargets(col0, [val1], sqcells);
			var tgtsr1 = findTargets(row1, [val1], sqcells);
			var tgtsc1 = findTargets(col1, [val1], sqcells);
			hasVal1 = tgtsr0 !== null || tgtsc0 !== null || tgtsr1 !== null || tgtsc1 !== null;

			console.log("Type6", cn0, cn1, sqac, hasVal0, hasVal1);
			if ((hasVal0 && !hasVal1) || (!hasVal0 && hasVal1)) {
				var val = hasVal0 ? val1 : val0;

				console.log("Type6", corner1, val, tgts, square);
				var h = {
					type: 'urType6',
					rows: null,
					cols: null,
					square: null,
					cells: sqcells,
					offset: null,
					value: val,
					targets: extras,
					msg: `UR Type 6: Cells: ${extras}, Value: ${val}`
				}
				rectangles.push(h);
				continue;
			}
		}

		// check for Type 4
		if (numextras === 2) {
			var cx0 = extras[0];
			var cx1 = extras[1];
			var comrow = commonRow(cx0, cx1);
			var comcol = commonColumn(cx0, cx1);
			var comsq = commonSquare(cx0, cx1);
		}
		var val0 = sqac[0];
		var val1 = sqac[1];
		var hasVal0 = false;
		var hasVal1 = false;

		// check for types 4 and 7
		console.log("t47", numextras, comrow, comcol, comsq);
		// check the common row/col/sq for only one of the bivalues
		if (numextras === 2 && (comrow || comcol)) {
			// Type 4 with common row/column
			var arr = comrow ? Rows[cellRow[cx0]] : Cols[cellCol[cx0]];
			console.log("com rc", cx0, cx1, sqac, comrow, comcol, comsq, arr);
			var tgts0 = findTargets(arr, [val0], extras);
			var tgts1 = findTargets(arr, [val1], extras);
			hasVal0 = tgts0 !== null;
			hasVal1 = tgts1 !== null;
			console.log("Type4 RC", val0, val1, tgts0, tgts1, hasVal0, hasVal1);
			if ((!hasVal0 && hasVal1) || (!hasVal0 && hasVal1)) {
				// we have a Type 4 row/col
				var val = hasVal0 ? sqac[0] : sqac[1];
				var tgts = tgts0 !== null ? tgts0 : tgts1;
				console.log("Type4", oneextra, numextras, extraextras, extras, val, tgts, square);
				var h = {
					type: 'urType4',
					rows: null,
					cols: null,
					square: null,
					cells: sqcells,
					offset: null,
					value: val,
					targets: extras,
					msg: `UR Type4: Cells: ${extras}, Value: ${val}`
				}
				rectangles.push(h);
				continue;
			}
		}

		// row/com test failed, try the square if there is one
		// try for a Type 4 square
		if (numextras === 2 && comsq) {
			// Type 4 with common square
			var arr = Squares[cellSquare[cx0]];
			console.log("com sq", cx0, cx1, sqac, comsq, arr);
			var tgts0 = findTargets(arr, [val0], extras);
			var tgts1 = findTargets(arr, [val1], extras);
			hasVal0 = tgts0 !== null;
			hasVal1 = tgts1 !== null;
			console.log("Type4 SQ", val0, val1, tgts0, tgts1, hasVal0, hasVal1);
			if ((!hasVal0 && hasVal1) || (!hasVal0 && hasVal1)) {
				// we have a Type 4 row/col
				var val = hasVal0 ? sqac[0] : sqac[1];
				var tgts = tgts0 !== null ? tgts0 : tgts1;
				console.log("Type4", oneextra, numextras, extraextras, extras, val, tgts, square);
				var h = {
					type: 'urType4',
					rows: null,
					cols: null,
					square: null,
					cells: sqcells,
					offset: null,
					value: val,
					targets: extras,
					msg: `UR Type4: Cells: ${extras}, Value: ${val}`
				}
				rectangles.push(h);
				continue;
			}
		}

		// not Type 4, let us try for Type 7
		// for these we are interested in a diagonal pair with at least one bivalue cell
		if (numextras === 2) {
			// we should have a diagonal bivalue pair at this point
			// the corners are the cells without the extra values
			var corner0 = nonextras[0];
			var corner1 = nonextras[1];
		} else { // should be numextras === 3
			var corner0 = findDiagonalCorner(nonextras[0], extras);
			var corner1 = null;
		}

		if (numextras >= 2 && !comrow && !comcol && !comsq) {
			console.log("diag", corner0, corner1, sqac);
			// for each corner of the diagonal, check the candidates in each row/col
			// there is always a corner 0
			var row = Rows[cellRow[corner0]];
			var col = Cols[cellCol[corner0]];
			var tgtsr0 = findTargets(row, [val0], sqcells);
			var tgtsc0 = findTargets(col, [val0], sqcells);
			var tgtsr1 = findTargets(row, [val1], sqcells);
			var tgtsc1 = findTargets(col, [val1], sqcells);
			hasVal0 = tgtsr0 !== null || tgtsc0 !== null;
			hasVal1 = tgtsr1 !== null || tgtsc1 != null;
			console.log("Type7a", corner0, hasVal0, hasVal1);

			if ((hasVal0 && !hasVal1) || (!hasVal0 && hasVal1)) {
				// this corner works

				var val = hasVal0 ? sqac[0] : sqac[1];
				var tgts = hasVal0 ? [...tgtsr0, ...tgtsc0] : [...tgtsr1, ...tgtsc1];
				console.log("Type7a", corner1, val, tgts, square);
				var h = {
					type: 'urType7',
					rows: null,
					cols: null,
					square: null,
					cells: sqcells,
					offset: null,
					value: val,
					targets: [corner0],
					msg: `UR Type7: Cells: ${corner0}, Value: ${val}`
				}
				rectangles.push(h);
				continue;
			}

			if (corner1) {	// if there are two usable corners
				var row = Rows[cellRow[corner1]];
				var col = Cols[cellCol[corner1]];
				var tgtsr0 = findTargets(row, [val0], sqcells);
				var tgtsc0 = findTargets(col, [val0], sqcells);
				var tgtsr1 = findTargets(row, [val1], sqcells);
				var tgtsc1 = findTargets(col, [val1], sqcells);
				hasVal0 = tgtsr0 !== null && tgtsc0 !== null;
				hasVal1 = tgtsr1 !== null && tgtsc1 != null;
				console.log("Type7b", corner1, hasVal0, hasVal1);

				if ((hasVal0 && !hasVal1) || (!hasVal0 && hasVal1)) {
					// this corner works

					var val = hasVal0 ? sqac[0] : sqac[1];
					var tgts = hasVal0 ? [...tgtsr0, ...tgtsc0] : [...tgtsr1, ...tgtsc1];
					console.log("Type7b", corner1, val, tgts, square);
					var h = {
						type: 'urType7',
						rows: null,
						cols: null,
						square: null,
						cells: sqcells,
						offset: null,
						value: val,
						targets: [corner1],
						msg: `UR Type7: Cells: ${corner1}, Value: ${val}`
					}
					rectangles.push(h);
					continue;
				}
			}
		}


	}

	if (rectangles.length === 0) return null;
	console.log("rectangles", rectangles);
	return rectangles;

}

