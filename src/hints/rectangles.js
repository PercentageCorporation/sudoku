import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS } from '/src/utilities/constants';
import { rCounts2, cCounts2, sCounts2, rCounts3, cCounts3, rCounts23, cCounts23, sCounts23, rCounts2p, cCounts2p } from '/src/hints/hints';
import { cells, vRows, vCols, vSqs, vRowPT, vColPT, vSqPT } from '/src/hints/hints';
import { includesAll, includesAny } from '/src/hints/hints';
import { findAllBivalueCells, findSeenTargets, getActiveCandidates } from '/src/hints/hints';


//*****************************************************************************
// Unique Rectangles

function commonRow(c0,c1) {
	return ((RCS[c0][0] === RCS[c1][0]));
}

function commonColumn(c0,c1) {
	return ((RCS[c0][1] === RCS[c1][1]));
}
function commonSquare(c0,c1) {
	return ((RCS[c0][2] === RCS[c1][2]));
}

function getCellCandidates(cix) {
	var cell = cells[cix];
	if (cell.value > 0) return [];
	return cell.activecandidates;
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
			for (var j = i+1; j < biclen; ++j) {
				var bj = bic[j];
				for (var k = j+1; k < biclen; ++k) {
					var bk = bic[k];
					for (var l = k+1; l < biclen; ++l) {
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
								squares.push([bac,[bi,bj,bk,bl]]);
							} else if (commonColumn(bi, bl) && commonColumn(bj, bk)) {
								//console.log("ciljk", i, j, k, l, bi, bj, bk, bl);
								// if the rows are in the same square, the columns cannot be
								var ccs = commonSquare(bi, bl);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bj][2]) continue; // cannot be in the same square
								squares.push([bac,[bi,bj,bk,bl]]);
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
								squares.push([bac,[bi,bj,bk,bl]]);
							} else if (commonColumn(bi, bl) && commonColumn(bk, bj)) {
								//console.log("cilkj", i, j, k, l, bi, bj, bk, bl, comsqr, comsqc);
								//console.log(i, j, k, l, bi, bj, bk, bl);
								var ccs = commonSquare(bi, bl);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bk][2]) continue; // cannot be in the same square
								squares.push([bac,[bi,bj,bk,bl]]);
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
								squares.push([bac,[ bi,bj,bk,bk]]);
							} else if (commonColumn(bi, bk) && commonColumn(bj, bl)) {
								//console.log("cikjl",i, j, k, l, bi, bj, bk, bl);
								var ccs = commonSquare(bi, bk);	// if same row, if one is in common square the other has to be
								if (rcs && ccs) continue;	// everyting is in the same square
								if (ccs && RCS[bi][2] === RCS[bj][2]) continue; // cannot be in the same square
								squares.push([bac,[ bi,bj,bk,bl]]);
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
		var bivals = [];
		var square = squares[i]
		var sqac = square[0];	// original bivalue pair

		var numextras = 0;
		var oneextra = 0;
		var oneextras = [];
		var extras = [];

		square[1].forEach((s) => {
			var cac = getCellCandidates(s);
			var eac = cac.filter(x => !sqac.includes(x));

			//console.log(sqac, cac, eac);
			bivals.push([s, cac]);
			if (cac.length > 2) {
				extras.push(s);
				if (eac.length === 1) {
					// there is one extra candidate
					++oneextra;
					var oe = eac[0];
					if (!oneextras.includes(oe)) oneextras.push(eac[0]);	// only add it once;
				}
				++numextras;

			}
		})
		console.log("ac", oneextra, numextras, bivals, extras, oneextras);

		if (oneextra === 1 && numextras === 1) {
			// Type 1 rectangle
			console.log("Type1", oneextra, numextras, bivals, extras, oneextras);
			var tgts = [extras[0]];
			var vals = square[0];
			var h = {
				type: 'urType1',
				rows: null,
				cols: null,
				square: null,
				cells: square[1],
				offset: null,
				values: vals,
				targets: tgts,
				msg: `UR Type1: Cells: ${tgts}, Value: ${vals}`
			}

			rectangles.push(h);
		}
		else if (oneextra === numextras && oneextra >= 1 && oneextra < 4 && oneextras.length === 1) {
			// two or three cells with the same extra candidate
			console.log("Type25", oneextra, numextras, bivals, extras, oneextras);
			// Type 2 and 5 rectangles
			var val = oneextras[0];
			var c0 = extras[0];
			var c1 = extras[1];
			var tgts = findSeenTargets(val, c0, c1);
			console.log(val, c0, c1, tgts);
			if (tgts) {
				var h = {
					type: 'urType25',
					rows: null,
					cols: null,
					square: null,
					cells: square[1],
					offset: null,
					value: val,
					targets: tgts,
					msg: `UR Type25: Cells: ${tgts}, Value: ${val}`
				}

				rectangles.push(h);
			}
		}
	}

	if (rectangles.length === 0) return null;
	console.log("rectangles", rectangles);
	return rectangles;

}

