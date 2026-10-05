import { Rows, Cols, Squares, RCS } from '/src/utilities/constants';
import { findTargets } from '/src/hints/hints';
import { vSqs, sCounts2, sameRow, sameCol } from '/src/hints/hints';
import { canSeeEachOther, canAllSeeEachOther, findTargetsSeenByAll, getActiveCandidates, getCommonValues, includesAny, includesAll } from './hints';


//*****************************************************************************
// ALS

function getUnique(ax) {
	var s = new Set();
	ax.forEach(a => a.forEach(s.add, s));
	return Array.from(s);
}

function getHouseCells(house) {
	var hc = [];
	var hac = new Set();
	for (var i=0; i<9; ++i) {
		var cix = house[i];
		var ac = getActiveCandidates(cix);
		if (ac.length > 1) {
			hc.push([cix, ac]);
			ac.forEach(c => hac.add(c));
		}
	}
	return [hc, Array.from(hac)];
}

// find cells containing the value
// cls: [ [cix0, [ac0] ], [ cix1, [ac1] ], ... ]

function candidateValueCells(val, cls0, cls1 ) {
	var cls = [];
	cls0.forEach((c) => {
		if (c[1].includes(val)) cls.push(c[0]);
	})
	cls1.forEach((c) => {
		if (c[1].includes(val)) cls.push(c[0]);
	})
	return cls;
}

// find all ALS combinations
function findALS(arr) {
	var als = [];
	var ghc = getHouseCells(arr);
	var hc = ghc[0];	// cells in house
	var allac = ghc[1];
	//console.log("als", hc, allac);
	var numc = hc.length;		// total cells in house
	var numac = allac.length;	// total candidates in house

	// house cells hc: [ cix, [ac] ]
	for (var i=0; i<numc; ++i) {
		var hci = hc[i];
		var cixi = hci[0];
		for (var j=i+1; j<numc; ++j) {
			var hcj = hc[j];
			var cixj = hcj[0];
			// for two cells how many candidates
			var tc = getUnique([hci[1], hcj[1]]);
			if (tc.length === 3) {
				//console.log("als2", i, j, cixi, cixj, tc);
				// two cells with three candidates
				als.push([tc, [cixi, cixj], [hci, hcj]])
			}
			for (var k=j+1; k<numc; ++k) {
				var hck = hc[k];
				var cixk = hck[0];
				// for three cells how many candidates
				var tc = getUnique([hci[1], hcj[1], hck[1]]);
				if (tc.length === 4) {
					//console.log("als3", i, j, cixi, cixj, tc);
					// three cells with four candidates
					als.push([tc, [cixi, cixj, cixk], [hci, hcj, hck]]);
				}
				for (var l=k+1; l<numc; ++l) {
					var hcl = hc[l];
					var cixl = hcl[0];
					// for four cells how many candidates
					var tc = getUnique([hci[1], hcj[1], hck[1], hcl[1]]);
					if (tc.length === 5) {
						//console.log("als3", i, j, cixi, cixj, tc);
						// four cells with five candidates
						als.push([tc, [cixi, cixj, cixk, cixl], [hci, hcj, hck, hcl]]);
					}
				}
			}
		}
	}
	return als;
}

function canSeeOtherALS(als0, als1) {
	for (var i=0; i<als0.length; ++i) {
		for (var j=0; j<als1.length; ++j) {
			if (canSeeEachOther(als0[i], als1[j])) return true;
		}
	}
	return false;
}

export function als() {

	var alshints = [];

	// for each house find all ALS
	var als = [];
	for (var i=0; i<9; ++i) {
		var alsr = findALS(Rows[i]);
		als.push(...alsr);
		//console.log("alsr", i, alsr);
		var alsc = findALS(Cols[i]);
		als.push(...alsc);
		//console.log("alsc", i, alsc);
		var alss = findALS(Squares[i]);
		als.push(...alss);
		//console.log("alss", i, alss);
	}

	//console.log("als", als);
	// als: [ [candidates], [cells], [ [cix0, [ac0]], [cix1, [ac1]], ...] ] ]
	// for each pair of ALS find a common candidate that is in the same house
	var alslen = als.length;
	for (var i=0; i<alslen; ++i) {
		var alsi = als[i];
		//if (!includesAll(alsi[1],[10,15])) continue;
		//if (!includesAll(alsi[1],[39,40,41,44])) continue;
		//console.log("alsi", i, alsi);
		for (var j=i+1; j<alslen; ++j) {
			var alsj = als[j];
			if (includesAny(alsi[1],alsj[1])) continue;		// skip overlapping ALS
			// can the ALSs see each other
			// can any of the cells in ALS0 see any of the cells in ALS1
			if (!canSeeOtherALS(alsi[1], alsj[1])) continue;
			//console.log("cansee", i, j, alsi[1], alsj[1]);

			// now look for a restricted candidate
			// a restricted candidate is a candidate in one ALS that must be in the other ALS
			// all the occurances of the candidate in either ALS must be able to see each other
			// first find common candidates
			var comvals = getCommonValues( alsi[0], alsj[0]);
			//console.log("comval", i, j, comvals, alsi, alsj);
			// for each common candidate can all the cells containing the candidate see each other
			for (var cv=0; cv<comvals.length; ++cv) {
				// get the cells containing the value
				var val = comvals[cv];
				var valcells = candidateValueCells(val, alsi[2], alsj[2] )
				var canallsee = canAllSeeEachOther(valcells);
				if (!canallsee) continue;
				//console.log("canallsee", val, comvals, valcells, alsi[2], alsj[2]);
				// at this point val is the required common candidate Z
				var X = val;
				// now we look for the Z value to be used for elimination
				var zvals = comvals.filter(e => e !== X);	// remove X from the common values
				//console.log("xvals", val, xvals, comvals);
				// I think there can be more than on Z val but I am not sure
				var allcells = [];
				allcells.push(...alsi[1]);
				allcells.push(...alsj[1]);
				zvals.forEach((Z) => {
					// get the cells from both ALS containg the value X
					var Zcells = candidateValueCells(Z, alsi[2], alsj[2] );
					var tgts = findTargetsSeenByAll(Z, Zcells, allcells);
					if (tgts) {
						//console.log("als", X, Z, alsi, alsj);
						//console.log("Zcells", Zcells, allcells, tgts);
						var h = {
							type: 'alsXY',
							row: null,
							col: null,
							square: null,
							cells: allcells,
							cells0: alsi[1],
							cells1: alsj[1],
							offset: null,
							value: Z,
							targets: tgts,
							msg: `ALS XY: Cells: ${tgts}, Value: ${Z}`
						}
						//console.log(h.msg);
						alshints.push(h);
					}
				})

			}
		}
	}

	if (alshints.length === 0) return null;
	console.log("als", alshints);
	return alshints;
}

//*****************************************************************************
// lockedCandidates

export function lockedCandidates1() {

	var lc = [];
	for (var s=0; s<9; ++s) {
		//if (s !== 2) continue;	// TEST
		var square = Squares[s];
		for (var v=1; v<10; ++v) {
			var vcnt = vSqs[s][v];	// number of occurances of the value in the square
			if (vcnt > 1 && vcnt < 4) {
				// svc: rcs, value, square, row/col, count, cells
				var cls = findTargets(square, [v], [])
				var srow = sameRow(cls);
				//console.log("vcnt", s, v, vcnt, cls, srow);
				if (srow !== null) {
					var arr = Rows[srow];
					var tgts = findTargets(arr, [v], square);
					//console.log("tgts", tgts);
					if (tgts) lc.push(['r', srow, v, cls, tgts, s])
				} else {
					var scol = sameCol(cls);
					if (scol !== null) {
						var arr = Cols[scol];
						var tgts = findTargets(arr, [v], square);
						if (tgts) lc.push(['c', scol, v, cls, tgts, s])
					}
				}
			}
		}
	}
	//console.log("lc", lc);

	var lchints = [];
	lc.forEach((lh) => {
		var rcs = lh[0];
		var rcsix = lh[1];
		var val = lh[2];
		var cls = lh[3];
		var tgts = lh[4];
		var sq = lh[5];
		//console.log(dir,trc0,cls)

		var h = {
			type: 'locked',
			row: rcs === 'r' ? rcsix : null,
			col: rcs === 'c' ? rcsix : null,
			square: sq,
			cells: cls,
			offset: null,
			value: val,
			targets: tgts,
			msg: `Locked1: Cells: ${tgts}, Value: ${val}`
		}
		lchints.push(h);
	})

	if (lchints.length === 0) return null;
	console.log("lchints", lchints);

	return lchints;
}

export function lockedCandidates2() {
	var locked = [];

	// as far as I can tell, locked candidates type 2 are the same as pointing pairs in a square

	if (locked.length === 0) return null;
	console.log("locked",locked);
	return locked;
}
