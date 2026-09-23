import { cellStore, useCellActions } from "/src/store/store";
import {rows, cols, squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS} from '/src/utilities/constants';

var cells = [];

export function runHints() {
	var result;
	cells = cellStore.getState().cells;
	initCounts();


	result = lockedCandidates();
	if (result) return result[0];
	result = singletons();
	if (result) return result[0];
	result = singleCounts();
	if (result) return result[0];
	result = nakedPairs();
	if (result) return result[0];
	result = nakedTriples();
	if (result) return result[0];
	result = findPointingPairsSquare();
	if (result) return result[0];
	result = pointingPairsRowCol();
	if (result) return result[0];
	result = hiddenPairs();
	if (result) return result[0];
	result = hiddenTriples();
	if (result) return result[0];
	result = XWing();
	if (result) return result[0];
	result = XYChain();
	if (result) return result[0];
	result = XYWing();
	if (result) return result[0];
	result = XYZWing();
	if (result) return result[0];
	result = wWing();
	if (result) return result[0];
	result = swordfish();
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
var sCounts2 = [[],[],[],[],[],[],[],[],[],[]];
var rCounts3 = [[],[],[],[],[],[],[],[],[],[]];
var cCounts3 = [[],[],[],[],[],[],[],[],[],[]];
var rCounts23 = [[],[],[],[],[],[],[],[],[],[]];
var cCounts23 = [[],[],[],[],[],[],[],[],[],[]];
var sCounts23 = [[],[],[],[],[],[],[],[],[],[]];
var rCounts2p = [[],[],[],[],[],[],[],[],[],[]];
var cCounts2p = [[],[],[],[],[],[],[],[],[],[]];

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
	// we need columns[rows] containing exactly 2, and rows[columns]
	// we need columns[rows] containing exactly 3, and rows[columns]
	// we need rows/cols/sqs containing 2 or 3 of the value
	rCounts2 = [[],[],[],[],[],[],[],[],[],[]];
	cCounts2 = [[],[],[],[],[],[],[],[],[],[]];
	sCounts2 = [[],[],[],[],[],[],[],[],[],[]];
	rCounts3 = [[],[],[],[],[],[],[],[],[],[]];
	cCounts3 = [[],[],[],[],[],[],[],[],[],[]];
	rCounts23 = [[],[],[],[],[],[],[],[],[],[]];
	cCounts23 = [[],[],[],[],[],[],[],[],[],[]];
	sCounts23 = [[],[],[],[],[],[],[],[],[],[]];
	rCounts2p = [[],[],[],[],[],[],[],[],[],[]];
	cCounts2p = [[],[],[],[],[],[],[],[],[],[]];

	vRowPT = [];
	vColPT = [];
	vSqPT = [];

	// get the value counts for all rows/columns/squares
	for (var i=0; i<9; i++) {
		var rc = rcsCounts(rows[i]);
		var cc = rcsCounts(cols[i]);
		var sc = rcsCounts(squares[i]);
		vRows.push(rc);
		vCols.push(cc);
		vSqs.push(sc);
	}
	//console.log(vRows, vCols, vSqs);

	for (var v=1; v<10; v++) {
		for (var i=0; i<9; i++) {
			var rc = vRows[i][v];
			var cc = vCols[i][v];
			var sc = vSqs[i][v];
			if (rc === 2) rCounts2[v].push(i);
			if (rc === 3) rCounts3[v].push(i);
			if (rc >= 2) rCounts2p[v].push(i);

			if (cc === 2) cCounts2[v].push(i);
			if (cc === 3) cCounts3[v].push(i);
			if (cc >= 2) cCounts2p[v].push(i);

			if (sc === 2) sCounts2[v].push(i);

			if (rc === 2 || rc === 3) rCounts23[v].push(i);
			if (cc === 2 || cc === 3) cCounts23[v].push(i);
			if (sc === 2 || sc === 3) sCounts23[v].push(i);
		}
	}
	//console.log(rCounts2,cCounts2);
	//console.log(rCounts3,cCounts3);
	//console.log(rCounts23,cCounts23);
	//console.log(sCounts2);
}

// count the occurances of the active candidates in a row/col/sq
function rcsCounts(arr) {
	var counts = [0,0,0,0,0,0,0,0,0,0];
	//console.log(row);
	for (var i=0; i<9; ++i) {
		const cix = arr[i];
		const cell = cells[cix];
		if (cell.value > 0) continue;
		const candid = cell.activecandidates;
		//console.log(cix, candid);
		candid.forEach((c) => {counts[c] += 1;});
	}
	return counts;
}

// find cells in the array which contain any of vals, excluding cells in ex
function findTargets(arr,vals,ex) {
	var targets = [];

	for (var i=0; i<9; ++i) {
		var cix = arr[i];
		var cel = cells[cix];
		if (!ex.includes(cix)) {
			if (cel.value === 0 && includesAny(cel.activecandidates, vals)) {
				targets.push(cix);
			}
		}
	}
	if (targets.length === 0) return null;
	return targets;
}

function canSeeEachOther(c0, c1) {
	var rcs0 = RCS[c0];
	var rcs1 = RCS[c1];
	// they must be in the same house
	if (rcs0[0] === rcs1[0]) return true;
	if (rcs0[1] === rcs1[1]) return true;
	if (rcs0[2] === rcs1[2]) return true;
	return false;
}

// determine if cell 0 can be seen by both cell1 and cell2
function canBeSeen(c0, c1, c2) {
	var rcs0 = RCS[c0];
	var rcs1 = RCS[c1];
	var rcs2 = RCS[c2];
	//if (c0 === 73 ) console.log(c0,c1,c2,rcs0,rcs1,rcs2);
	// in the same row as 1 and same col as 2 or vice versa
	if (rcs0[0] === rcs1[0] && rcs0[1] === rcs2[1])	return true;
	if (rcs0[1] === rcs2[1] && rcs0[0] === rcs1[0])	return true;
	// does row/col intersect a square
	// same row as 1 same square as 2 or vice versa
	if (rcs0[0] === rcs1[0] && rcs0[2] === rcs2[2])	return true;
	if (rcs0[0] === rcs2[0] && rcs0[2] === rcs1[2])	return true;
	// same col as 1 same square as 2 or vice versa
	if (rcs0[1] === rcs1[1] && rcs0[2] === rcs2[2])	return true;
	if (rcs0[1] === rcs2[1] && rcs0[2] === rcs1[2])	return true;
	return false;
}

// find seen targets
// targets have to be in the same row/col or row/sq or col/sq
function findSeenTargets(val, c1, c2) {
	var targets = [];
	for (var i=0; i<81; ++i) {
		if (i === c1 || i === c2) continue;
		var seen = canBeSeen( i, c1, c2);
		if (seen) {
			if (cellHasCandidate(i, val)) targets.push(i);
		}
	}
	if (targets.length === 0) return null;
	return targets;
}

// are all values in [b] included in [a]
function includesAll(a,b) {
	return b.every(v => a.includes(v));
}

// are any of the values in [b] included in [a]
function includesAny(a,b) {
	// if a includes any of b
	return b.some(r => a.includes(r))
}

function cellHasCandidate(cix, z) {
	var c = cells[cix];
	if (c.value > 0) return false;
	if (c.activecandidates.includes(z)) return true;
	return false;
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


function findAllBivalueCells() {
	var bv = [];
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if ( c.value === 0 && ac.length === 2) {
			bv.push([cix, cellRow[cix], cellCol[cix], cellSquare[cix],  ac]);
		}
	}
	bv = bv.sort((a,b) => a[4][0] - b[4][0]);
	bv = bv.sort((a,b) => a[4][1] - b[4][1]);

	return bv;
}

function findAllTrivalueCells() {
	var bv = [];
	for (var cix=0; cix<81; ++cix) {
		var c = cells[cix];
		var ac = c.activecandidates;
		if ( c.value === 0 && ac.length === 3) {
			bv.push([cix, cellRow[cix], cellCol[cix], cellSquare[cix],  ac]);
		}
	}
	return bv;
}

//*****************************************************************************
// lockedCandidates

// get same
function getSameIndices(arr) {
	var rc = [];
	var counts = [0,0,0,0,0,0,0,0,0];
	arr.forEach((rc) => {counts[rc] += 1;});
	counts.forEach((c, ix) => {
		if (c>1) rc.push(ix);
	})
	//if (rc.length === 0) return null;
	return rc;
}

// for the square s and value v find any that are in the same row/col
function getSameRowCol(v, s) {
	var svc = [];
	var sq = squares[s]; // get the square cells
	var sr = [];
	var sc = [];
	var srx = [];
	var scx = [];
	var srcx = [];
	for (var i=0; i<9; ++i) {
		var cix = sq[i];	// cell index in square
		var c = cells[cix];
		if (c.value === 0 && c.activecandidates.includes(v)) {
			sr.push(cellRow[cix]);
			srx.push(cix);
			sc.push(cellCol[cix]);
			scx.push(cix);
			srcx.push([i, cellRow[cix],cellCol[cix],cix])
		}
	}
	//console.log(s, v, sr, srx, srcx);
	// rcs, value, square, row/col, count, cells
	// srcx: ix, row, col, cix
	// look for row pair/triple type 1
	if (sr.length > 1 && sr.every(rc => rc === sr[0])) {	// true if all equal
		svc.push(['r', v, s, sr[0], sr.length, srx]);
		return svc;	// there can be no others
	}
	// look for col pair/triple type 1
	if (sc.length > 1 && sc.every(rc => rc === sc[0])) {	// true if all equal
		svc.push(['c', v, s, sc[0], sc.length, scx]);
		return svc;	// there can be no others
	}
	// // look for row pair/triple type 2
	// if (sr.length > 2 ) {   // true if not all in same row/col
	// 	var si = getSameIndices(sr);	// get the row/col with 2 or 3 of the same value
	// 	si.forEach((sr) =>  {	// for each row
	// 		var srx = [];
	// 		var srt = [];
	// 		srcx.forEach((c) => {
	// 			if (sr === c[1]) {
	// 				srx.push(c);
	// 				srt.push(c[3]);
	// 			}
	// 		})
 //
	// 		// now we need to see if there are any values in the row outside the square
	// 		// if so, that disqualifies us
	// 		var tgts = findTargets(rows[sr], [v], srt);
	// 		if (!tgts) {
	// 			// are there any targets inside the square
	// 			tgts = findTargets(squares[s], [v], srt);
	// 			if (tgts) {
	// 				//console.log("srcxr", v, s, si, srx, srt, tgts )
	// 				//svc.push(['r2', v, s, sr[0], sr.length, srx]);
	// 				//return [svc];
	// 			}
	// 		}
	// 	})
	// }
	// if (sc.length > 2 ) {   // true if not all in same row/col
	// 	var si = getSameIndices(sc);	// get the row/col with 2 or 3 of the same value
	// 	si.forEach((sc) =>  {	// for each col
	// 		var scx = [];
	// 		var sct = [];
	// 		srcx.forEach((c) => {
	// 			if (sc === c[2]) {
	// 				scx.push(c);
	// 				sct.push(c[3]);
	// 			}
	// 		})
 //
	// 		// now we need to see if there are any values in the row outside the square
	// 		var tgts = findTargets(cols[sc], [v], sct);
	// 		if (!tgts) {
	// 			// are there any targets inside the square
	// 			tgts = findTargets(squares[s], [v], sct);
	// 			if (tgts) {
	// 				//console.log("srcxc", v, s, si, scx, sct, tgts )
	// 				//svc.push(['c2', v, s, sr[0], sr.length, srx]);
	// 				//return [svc];
	// 			}
	// 		}
	// 	})
	// }

	return null;
}

function lockedCandidates() {

	// find values that occur 2 or three times in a square
	var v23 = [];
	var v23p = [];
	for (var s=0; s<9; ++s) {
		for (var v=1; v<10; ++v) {
			var vcnt = vSqs[s][v];	// number of occurances of the value in the square
			if (vcnt > 1) {
				// svc: rcs, value, square, row/col, count, cells
				var svcx = getSameRowCol(v, s);
				if (svcx) {
					var svc = svcx[0]
					//console.log("gsr", s, v, vcnt, svc);
					if (vcnt === svc[4]) {
						// if the number in the row/col is the same as the number in the square it could be type 1
						v23.push(svc);
					} else if (vcnt > svc[4]) {
						// if the number in the row/col is 2 or 3 but less then the number in the square it could be type 2
						v23p.push(svc);
					}
				}
			}
		}
	}
	//console.log("v23",v23, v23p);

	var lh = [];
	// for all the candidates check if there are any targets
	v23.forEach((vx) => {
		// rcs, value, square, row/col, count, cells
		var rc = vx[3];	// get the row/col
		var arr = vx[0] === 'r' ? rows[rc] : cols[rc];
		//console.log("vx", rc, arr, vx);
		var tgts = findTargets(arr,[vx[1]],vx[5]);
		if (tgts) {
			// rcs, row/col,  value
			lh.push([vx[0], vx[3], vx[5], [vx[1]], tgts, vx[2]]);
		}
	})
	//console.log("lh",lh);


	var locked = [];
	lh.forEach((lhh) => {
		var rcs = lhh[0];
		var rcsix = lhh[1];
		var cls = lhh[2];
		var val = lhh[3];
		var tgts = lhh[4];
		var sq = lhh[5];
		//console.log(dir,trc0,cls)

		var h = {
			type: 'locked',
			row: rcs === 'r' ? rcsix : null,
			col: rcs === 'c' ? rcsix : null,
			square: sq,
			cells: cls,
			offset: null,
			value: val[0],
			targets: tgts,
			msg: `Locked1: Cells: ${tgts}, Value: ${val[0]}`
		}
		locked.push(h);
	})

	if (locked.length === 0) return null;
	console.log("locked",locked);
	return locked;
}

//*****************************************************************************
// nakedTriples


// for each row/col/square find the candidate triples
function findTriplesNP(arr) {
	const triples = [];

	var ijk = [];
	for (var i=0; i<9; i++) {
		var cixi = arr[i];
		var ci = cells[cixi];
		if (ci.value > 0) continue;

		var aci = ci.activecandidates;
		if (aci.length === 3) {
			for (var j=0; j<9; j++) {
				if (i === j) continue;
				var cixj = arr[j];
				var cj = cells[cixj];
				if (cj.value > 0) continue;
				var acj = cj.activecandidates;
				if (acj.length !== 2 && acj.length !== 3) continue

					// are all of the acj values included in aci
					var inc = includesAll(aci, acj);
				if (!inc) continue;

				// found two candidates, look for a third
				for (var k=0; k<9; k++) {
					if (i === k || j === k) continue;
					var cixk = arr[k];
					var ck = cells[cixk];
					if (ck.value > 0) continue;
					var ack = ck.activecandidates;
					if (ack.length !== 2 && ack.length !== 3) continue;

					// are all of the ack values included in aci
					var inc = includesAll(aci, ack);
					if (!inc) continue;

					// we might have a triple, but I do not yet know what to check for
					// if two of the candidates are pairs, they cannot be the same pair
					// since [aci] is of length three, we need to compare [acj] anc [ack]
					if (acj.length === 2 && ack.length === 2 && includesAll(acj, ack)) continue;	// too bad

					var ijkkey = [i,j,k].sort().join('');
					if (ijk.includes(ijkkey)) continue;
					//console.log("nt", ijkkey, [cixi,aci], [cixj,acj], [cixk,ack])
					ijk.push(ijkkey);

					var cls = [cixi, cixj, cixk];
					var vs = new Set();
					aci.forEach(vs.add, vs)
					acj.forEach(vs.add, vs)
					ack.forEach(vs.add, vs)
					var vals = Array.from(vs).sort((a,b) => a-b);
					var tgts = findTargets(arr, vals, cls);
					if (tgts) triples.push([cls, vals, tgts]);
				}
			}
		}
	}

	return triples;
}

function findAllTargets(rcs,vals) {
	var targets = [];
	for (var i=0; i<9; i++) {
		var cix = rcs[i];
		var c = cells[cix];
		if (c.value === 0 && includesAny(c.activecandidates, vals)) targets.push(cix);
	}
	return targets;
}

function nakedTriples() {

	var triples = [];

	for (var i=0; i<9; i++) {
		var rt = findTriplesNP(rows[i])
		if (rt.length > 0) rt.forEach((t) => triples.push(['r', i].concat(t)));
		var ct = findTriplesNP(cols[i])
		if (ct.length > 0) ct.forEach((t) => triples.push(['c', i].concat(t)));
		var st = findTriplesNP(squares[i])
		if (st.length > 0) st.forEach((t) => triples.push(['s', i].concat(t)));
	}

	//console.log("np triples",triples)
	var nakedTriples = [];
	triples.forEach((npt) => {
		var rcs = npt[0];
		var rcsix = npt[1];
		var cls = npt[2];
		var vals = npt[3];
		var tgts = npt[4]
		//console.log(dir,trc0,cls)

		var h = {
			type: 'nakedTriple',
			row: rcs === 'r' ? rcsix : null,
			col: rcs === 'c' ? rcsix : null,
			square: rcs === 's' ? rcsix : null,
			cells: cls,
			offset: null,
			values: vals,
			targets: tgts,
			msg: `Naked Triple: Cells: ${tgts}, Values: ${vals}`
		}
		nakedTriples.push(h);
	})


	if (nakedTriples.length === 0) return null;
	console.log("nakedTriples",nakedTriples)
	return nakedTriples;
}


//*****************************************************************************
// hiddenPairs

// get the indices of the row/col/sq that have values with a count of two
// this uses the xCounts2 arrays
function pairIndices(arr) {
	var pairs = [];
	for (var i=1; i<10; i++) if (arr[i] === 2) pairs.push(i);
	if (pairs.length < 2) return null;
	return pairs;
}

function hasPairs(arr, vals) {
	var indices = [];
	for (var i=0; i<9; i++) {
		var cix = arr[i];
		var c = cells[cix];
		if (c.value > 0) continue;
		var ac = c.activecandidates;
		if (includesAll(ac, vals)) indices.push([i,cix]);
	}
	if (indices.length === 2) return indices;
	return null;
}

// determine all the possible pairs from the values in[pp]
function possiblePairs(pp) {
	var pplen = pp.length;
	if (pplen < 2) return [];
	if (pplen === 2) return [pp];
	var ppp = [];
	for (var i=0; i<pp.length; i++) {
		for (var j=i+1; j<pp.length; j++) {
			ppp.push([pp[i],pp[j]]);
		}
	}
	return ppp;
}

function hiddenPairs() {

	// for each row/col/sq find those with at least two values of count two
	var rpc = [];	// two value candidates
	var cpc = [];	// two value candidates
	var spc = [];	// two value candidates
	for (var i=0; i<9; i++) {
		var rvc = pairIndices(vRows[i]);
		if (rvc) rpc.push([i,rvc])
		var cvc = pairIndices(vCols[i]);
		if (cvc) cpc.push([i,cvc])
		var svc = pairIndices(vSqs[i]);
		if (svc) spc.push([i,svc])
	}
	//console.log(rpc,cpc,spc);

	// for each pair candidate, see if the pairs line upin the row/col/square

	var hpc = [];
	rpc.forEach((rp) => {
		var r = rp[0];
		var rpp = possiblePairs(rp[1]);
		rpp.forEach((rpx) => {
			var hp = hasPairs(rows[r], rpx);
			if (hp) {
				hpc.push(['r', r, rpx, hp]);
			}
		})
	})
	cpc.forEach((cp) => {
		var c = cp[0];
		var cpp = possiblePairs(cp[1]);
		cpp.forEach((cpx) => {
			var hp = hasPairs(cols[c], cpx);
			if (hp) {
				hpc.push(['c', c, cpx, hp]);
			}
		})
	})
	spc.forEach((sp) => {
		var s = sp[0];
		var spp = possiblePairs(sp[1]);
		spp.forEach((spx) => {
			var hp = hasPairs(squares[s], spx);
			if (hp) {
				hpc.push(['s', s, spx, hp]);
			}
		})
	})

	var hpTargets = [];
	hpc.forEach((hp) => {
		var rcs = hp[0];		// house type rcs
		var ix = hp[1];		// house rcs index
		var vals = hp[2];
		var cls = [hp[3][0][1],hp[3][1][1]];	// pair cells
		var tgts = findInternalTargets(cls,vals);
		if (tgts) {
			hpTargets.push([rcs,ix,cls,tgts[1],tgts[0]]);
		}
	})
	//console.log("hpc", hpc);

	var hiddenPairs = [];
	hpTargets.forEach((hp) => {
		var rcs = hp[0];
		var cls = hp[2];
		var vals = hp[3];
		var tgts = hp[4]
		//console.log(dir,trc0,cls)

		var h = {
			type: 'hiddenPair',
			rows: rcs === 'r' ? rcs : null,
			cols: rcs === 'c' ? rcs : null,
			square: rcs === 's' ? rcs : null,
			cells: cls,
			offset: null,
			values: vals,
			targets: tgts,
			msg: `Hidden Pair: Cells: ${tgts}, Values: ${vals}`
		}
		hiddenPairs.push(h);
	})

	if (hiddenPairs.length === 0) return null;
	console.log("hiddenPairs",hiddenPairs)
	return hiddenPairs;
}

//*****************************************************************************
// hiddenTriples

// compare two arrays to see if they contain exactly the same values
function compareArrays(a,b) {
	return(a.length === b.length && a.every((element, index) => element === b[index]));
}

// create a unique indes for the triple value a,b,c
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

function rcsPairsTriples(arr) {
	var pt = [];
	for (var j=0; j<9; j++) {
		var cix = arr[j];
		var cell = cells[cix];
		var ac = cell.activecandidates;
		if (cell.value > 0 || ac.length === 0) continue;
		//var pandt = findPairsTriples(ac);
		pt.push([j,ac]);
	}
	return Array.from(pt).sort((a,b) => a-b);
}

function countTheHouse(house) {
	var vc = [0,0,0,0,0,0,0,0,0,0];
	// count the values in each cell
	var hlen = house.length;
	// count the candidate values
	for (var i=0; i<hlen; i++) {
		house[i][1].forEach((v) => {vc[v] += 1});
	}
	return vc;
}

// house[]: [row/col/sq, [candidates]]
function collectHouseValues(house) {
	var hv = new Set();
	house.forEach((h) => {
		h[1].forEach(hv.add, hv)
	})
	return Array.from(hv).sort((a,b) => a-b);
}

function packTheHouse(house) {
	var inHouse = structuredClone(house);
	//var inHouse = house;
	var updated = false;

	var hlen = inHouse.length;
	// count candidates in the house
	var vc = countTheHouse(inHouse);
	// eliminate any values with a count greater than 0 but not equal to 2 or 3
	//console.log(vc);
	for (var value=1; value<10; ++value) {
		if (vc[value] === 1 || vc[value] > 3) {
			//console.log("value removed",value, vc[value])
			for (var i=0; i<hlen; i++) {
				inHouse[i][1] = inHouse[i][1].filter(v => v != value);
			}
			updated = true;
		}
	}

	// remove any cells with one (or less) candidates
	var hx = [];
	for (var i=0; i<hlen; i++) {
		if (inHouse[i][1].length >= 2)
			hx.push([inHouse[i][0],inHouse[i][1]]);
		else
			updated = true;	// we skipped one
	}
	inHouse = hx;
	return {updated: updated, house:inHouse};
}

function checkForTripleCounts(cnts) {
	var c2 = 0;
	var c3 = 0;
	var vals = [];
	for (var value=1; value<10; ++value) {
		if (cnts[value] === 2) {
			++c2;
			vals.push(value);
		}
		else if (cnts[value] === 3) {
			++c3;
			vals.push(value);
		}
	}

	if ((c2 + c3) !== 3) return null;
	return {
		twos: c2,
		threes: c3,
		values: vals
	};
}

// for the cells in a row/col/square find any triples
function findHiddenTriple(ptIn) {
	var ptInlen = ptIn.length;
	var pt = structuredClone(ptIn);
	//console.log("ptIn", ptIn);
	// pt[]: [row/col/sq, [candidates]]
	var vc = [0,0,0,0,0,0,0,0,0,0];
	// count the values in each cell and collect the indices
	var ptlen = pt.length;
	var ptIx = [];
	for (var i=0; i<ptlen; i++) {
		//console.log("map", pt[i][1]);
		pt[i][1].forEach((v) => {vc[v] += 1});
		ptIx.push(pt[i]);
	}

	// run the value elimination process
	var updated = false;
	var hx;
	do {
		var pack = packTheHouse(pt);
		updated = pack.updated;
		hx = pack.house;
		//console.log(updated, pt, hx);
		pt = hx;
		//console.log("pack", count, updated, pack);
	} while (updated === true);

	var ptlen = pt.length;
	if (ptlen < 3) return null;	// not enough cells
	//console.log("pt", ptlen, pt);
	// we have a candidate house

	var triples = [];

	if (ptlen === 3) {
		// possible valid triple
		var hv = collectHouseValues(pt);			// the collection of all values in the house cells
		var hc = countTheHouse(pt);					// counts of the values in the candidate cells
		var hi = [pt[0][0], pt[1][0], pt[2][0]];	// indices of the candidate cells
		var tcc = checkForTripleCounts(hc);
		if (tcc) {
			//console.log("hicv", hi, hc, hv, pt);
			//console.log("tcc3", 0, 1, 2, pt[0][0], pt[1][0], pt[2][0], tcc, pt);
			// we have a possible triple
			// check if any of the triple values occur outside of the triple
			// the triple candidate values are [hc]
			// the triple candidate indices are
			var valid = true;
			for (var i=0; i<ptInlen; i++) {
				// only check the candidtate cells
				if (!hi.includes(ptIn[i])) continue;
				if (includesAny(ptIn[i], hv)) valid = false;
			}
			if (valid) {
				//console.log("valid3");
				//console.log("hv", hc, hv, pt);
				//console.log("tcc3", 0, 1, 2, pt[0][0], pt[1][0], pt[2][0], tcc, pt);
				triples.push([pt[0][0], pt[1][0], pt[2][0]],tcc.values);
			}
		}

	} else { // ptlen > 3
		// count the values for each group of three
		//console.log("pt", ptlen, pt);
		for (var i=0; i<ptlen; i++) {
			for (var j=i+1; j<ptlen; j++) {
				for (var k=j+1; k<ptlen; k++) {
					// count the values in each cell
					var tc = [0,0,0,0,0,0,0,0,0,0];
					pt[i][1].forEach((v) => {tc[v] += 1});
					pt[j][1].forEach((v) => {tc[v] += 1});
					pt[k][1].forEach((v) => {tc[v] += 1});
					//console.log("tc", i, j, k, tc);
					var tcc = checkForTripleCounts(tc);
					if (tcc) {
						//console.log("tcc", i, j, k, pt[i][0], pt[j][0], pt[k][0], tcc, pt);
						// now if any of the tcc.values are in cells outside of [i,j,k] then this is not a valid triple
						var hi = [i,j,k];		// indices of the candidate cells
						var hv = tcc.values;	// values in the candidate cells
						var valid = true;
						for (var l=0; l<ptInlen; l++) {
							// skip the candidate cells
							if (hi.includes(ptIn[l])) continue;
							if (includesAny(ptIn[l], hv)) valid = false;
						}

						if (valid) {
							//console.log("valid3p");
							//console.log("tcc", i, j, k, pt[i][0], pt[j][0], pt[k][0], tcc, pt);
							//triples.push([[pt[i], pt[j], pt[k]],tcc.values]);
							triples.push([pt[i][0], pt[j][0], pt[k][0]],tcc.values);
						}
					}
				}
			}
		}
	}


	if (triples.length === 0) return null;
	//console.log("triples", triples);
	return triples;
}



// find any values in the cells that are not in the vals list
function findInternalTargets(cls,vals) {
	var tgts = new Set();
	var tgtvals = new Set();
	cls.forEach((cix) => {
		var c = cells[cix];
		if (c.value === 0) {
			c.activecandidates.forEach((ac) => {
				if (!vals.includes(ac)) {
					tgts.add(cix);
					tgtvals.add(ac);
				}
			})
		}
	})

	if (tgts.size === 0) return null;
	return [Array.from(tgts).sort(),Array.from(tgtvals).sort()];
}

function hiddenTriples() {

	// for each row/col/square calculate the possible triples/pairs for each cell;
	for (var i=0; i<9; i++) {
		var rc = rcsPairsTriples(rows[i]);
		var cc = rcsPairsTriples(cols[i]);
		var sc = rcsPairsTriples(squares[i]);
		vRowPT.push([i, rc]);
		vColPT.push([i, cc]);
		vSqPT.push([i, sc]);
	}
	//console.log(vRowPT, vColPT, vSqPT);

	// for each row/col/square find candidate houses
	var rowC = [];
	var colC = [];
	var sqC = [];
	var ht;
	for (var i=0; i<9; i++) {
		if (vRowPT[i][1].length > 2) {
			if (i !== 6) continue;	// TEST
			//console.log("row",i);
			ht = findHiddenTriple(vRowPT[i][1]);
			if (ht) rowC.push([i,ht[0],ht[1]]);
		}
		if (vColPT[i][1].length > 2) {
			if (i !== 9) continue;	// TEST
				//console.log("col",i);
			ht = findHiddenTriple(vColPT[i][1]);
			if (ht) colC.push([i,ht[0],ht[1]]);
		}
		if (vSqPT[i][1].length > 2) {
			if (i !== 9) continue;	// TEST
				//console.log("sq",i);
			ht = findHiddenTriple(vSqPT[i][1]);
			if (ht) sqC.push([i,ht[0],ht[1]]);
		}
	}

	var targets = [];
	rowC.forEach((rc) => {
		var r = rc[0];
		var row = rows[r];
		var cls = [ row[rc[1][0]],row[rc[1][1]],row[rc[1][2]] ];
		var vals = rc[2];
		var tgtvals = findInternalTargets(cls, vals);
		if (tgtvals) {
			// have targets
			//console.log("r",r,cls,tgtvals[1],tgtvals[0]);
			targets.push(["r",r,cls,tgtvals[1],tgtvals[0]]);
		}
	})

	colC.forEach((cc) => {
		var c = cc[0];
		var col = cols[c];
		var cls = [ col[cc[1][0]],col[cc[1][1]],col[cc[1][2]] ];
		var vals = cc[2];
		var tgtvals = findInternalTargets(cls, vals);
		if (tgtvals) {
			// have targets
			//console.log("c",c,cls,tgtvals[1],tgtvals[0]);
			targets.push(["c",c,cls,tgtvals[1],tgtvals[0]]);
		}
	})

	sqC.forEach((sc) => {
		var s = sc[0];
		var sq = squares[s];
		var cls = [ sq[sc[1][0]],sq[sc[1][1]],sq[sc[1][2]] ];
		var vals = sc[2];
		var tgtvals = findInternalTargets(cls, vals);
		if (tgtvals) {
			// have targets
			//console.log("s",s,cls,tgtvals[1],tgtvals[0]);
			targets.push(["s",s,cls,tgtvals[1],tgtvals[0]]);
		}
	})

	//console.log("targets",targets);

	var triples = [];
	targets.forEach((tgt) => {
		var dir = tgt[0];
		var rcs = tgt[1];
		var cls = tgt[2];
		var vals = tgt[3];
		var tgts = tgt[4]
		//console.log(dir,trc0,cls)

		var h = {
			type: 'hiddenTriple',
			rows: rcs === 'r' ? rcs : null,
			cols: rcs === 'c' ? rcs : null,
			square: rcs === 's' ? rcs : null,
			cells: cls,
			offset: null,
			values: vals,
			targets: tgts,
			msg: `Hidden Triple: Cells: ${tgts}, Values: ${vals}`
		}
		triples.push(h);

	})

	// convert targets to hints

	if (triples.length === 0) return null;
	console.log("triples",triples);
	return triples;
}

//*****************************************************************************
// pointingPairsSquare

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
				var vc = sqCounts[sqix];	// number of times value occurs in the row
				var targets = getSquareValueCells(value, sqix);	// number of times the value occurs in the square
				//console.log("sqix",value, r, sqix, vc, targets, sqCounts);

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

//*****************************************************************************
// singleCounts


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

function singleCounts() {
	var singleCounts = [];
	for (var i=0; i<9; ++i) {
		var hassv = hasSingleValueHint(rows[i])
		if (hassv) {
			hassv.row = i;
			hassv.msg = `Single: Row: ${i+1}, Cell:  ${hassv.cells}, Value: ${hassv.value}`
			singleCounts.push(hassv)
		}
		var hassv = hasSingleValueHint(cols[i])
		if (hassv) {
			hassv.col = i;
			hassv.msg = `Single: Column: ${i+1}, Cell:  ${hassv.cells}, Value: ${hassv.value}`
			singleCounts.push(hassv)
		}
		var hassv = hasSingleValueHint(squares[i])
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
function singletons() {
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

//*****************************************************************************
// nakedPairs

// find pairs in the row/col/sq array and record the index of where they were found;
function findPairs(arr) {
	var px = [];
	outer: for (var i=0; i<9; ++i) {
		var cii = arr[i];
		var ci = cells[cii];
		//console.log(i, cix,  arr, ci);
		var aci = ci.activecandidates;
		if (ci.value === 0 && aci.length === 2) {
			for (var j=i+1; j<9; ++j) {
				var cij = arr[j];
				var cj = cells[cij];
				var acj = cj.activecandidates;
				if (cj.value === 0 && acj.length === 2) {
					if ((aci[0] === acj[0] && aci[1] === acj[1]) || (aci[0] === acj[1] && aci[1] === acj[0])) {
						px.push([[i,j],[cii,cij],aci]);
						// by definition for a valid game there can be at most two matching pairs in a house
						continue outer;	// skip the rest of the row/col/sq
					}
				}
			}
		}
	}

	return px;
}

// return an array of cells which contain naked pairs
function nakedPairs() {
	var np = [];

	// for each row/col/sq find a pair and look for another
	for (var i=0; i<9; ++i) {
		var rp = findPairs(rows[i])
		if (rp.length > 0) np.push(['r',i,rp[0][0],rp[0][1],rp[0][2]]);
		var cp = findPairs(cols[i])
		if (cp.length > 0) np.push(['c',i,cp[0][0],cp[0][1],cp[0][2]]);
		var sp = findPairs(squares[i])
		if (sp.length > 0) np.push(['s',i,sp[0][0],sp[0][1],sp[0][2]]);
	}

	//console.log("np:", np);

	// for each pair check if there are any elimination targets
	var npHints = [];
	// for each pair, count the number of occurances in the row
	// np: rcs, index, rcs, [cri], cells, vals
	for (var i=0; i<np.length; ++i) {
		var npi = np[i];
		var rcs = npi[0];
		var rcsix = npi[1];
		var cls = npi[3];
		var vals = npi[4];

		if (rcs === 'r') {
			var tgts = findTargets(rows[rcsix], vals, cls);
			if (tgts) npHints.push(['row', rcsix, cls, vals, tgts]);
		} else if (rcs === 'c') {
			var tgts = findTargets(cols[rcsix], vals, cls);
			//console.log("ct", rcsix, cls, vals, tgts);
			if (tgts) npHints.push(['col', rcsix, cls, vals, tgts]);
		} else if (rcs === 's') {
			var tgts = findTargets(squares[rcsix], vals, cls);
			if (tgts) npHints.push(['square', rcsix, cls, vals, tgts]);
		}
	}

	console.log("npHints", npHints);

	var nakedPairs = [];

	npHints.forEach((nph) => {
		console.log("nph", nph);
		var dir = nph[0];
		var cls = nph[2];
		var vals = nph[3];
		var tgts = nph[4];
		var msg = `Naked Pair: Cells:  ${cls}, Values: ${vals}`;

		var h = {
			type: "nakedPair",
			direction: dir,
			row: null,
			col: null,
			square: null,
			cells: cls,
			offset: null,
			values: vals,
			targets: tgts,
			msg: msg
		};

		nakedPairs.push(h);
	})

	console.log("nakedPairs", nakedPairs);
	if (nakedPairs.length === 0) return null;
	return nakedPairs;
}


//*****************************************************************************
// pointingPairsRowCol

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

	//console.log("ppCandidates", ppCandidates)
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

//*****************************************************************************
// X-Wing

function XWing() {
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

//*****************************************************************************
// XYZ-Wing

function getCommonValue(ac1, ac2) {
	// find the common value
	return ac1.filter(item => ac2.includes(item));
}

function XYZWing() {
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
		var sqcells = squares[sq];
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
// XY-Wing

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
	var c0x = rows[p0r][p1c];
	var c1x = rows[p1r][p0c];
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

function XYWing() {
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

				var cix0 = rows[pi[1]][pj[2]];
				var cix1 = rows[pj[1]][pi[2]];
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
// Swordfish

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

			for (let c3 = c2 + 1; c3 < cols.length; c3++) {
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

// for each cell in row r that has the candidate value v check if it is in one of the columns in [c]
// return cir for those that are in the columns and cxx for those that are not
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
		var ccc1 = cellHasCandidate(c1x, v);
		var ccc2 = cellHasCandidate(c2x, v);
		var ccc3 = cellHasCandidate(c3x, v);
		// all or nothing
		if (!(ccc1 && ccc2 && ccc3)) return null;
		ric.push([c1x,c2x,c3x]);
	}

	//console.log("ric", v, ric);
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
		var ccc1 = cellHasCandidate(r1x, v);
		var ccc2 = cellHasCandidate(r2x, v);
		var ccc3 = cellHasCandidate(r3x, v);
		// all or nothing
		if (!(ccc1 && ccc2 && ccc3)) return null;
		cic.push([r1x,r2x,r3x]);
	}

	//console.log("cic", v, cic);
	return cic;
}

// get the column number for the row containing the value v
function getRowColumnsWithValue(r, v) {
	var columns = [];
	var cls = [];
	var row = rows[r];
	for (var i=0; i<9; i++) {	// for each column
		var cix = row[i];
		var hasValue = cellHasCandidate(cix, v);
		if (hasValue) {
			columns.push(i)
			cls.push(cix);
		}
	}
	return [columns,cls];
}

// get the row number for the row containing the value v
function getColumnRowsWithValue(c, v) {
	var colrows = [];
	var cls = [];
	var col = cols[c];
	for (var i=0; i<9; i++) {	// for each column
		var cix = col[i];
		var hasValue = cellHasCandidate(cix, v);
		if (hasValue) {
			colrows.push(i)
			cls.push(cix);
		}
	}
	return [colrows,cls];
}

// check if the rows have columns in common
// r1 must have 3 columns, r2 and r3 can have two or three columns;
// r2 and r3 must have the same columns as r1
// returns col number and cells in common
function columnsInCommon3(r1, r2, r3, v) {
	var r1cols = getRowColumnsWithValue(r1, v);
	var r2cols = getRowColumnsWithValue(r2, v);
	var r3cols = getRowColumnsWithValue(r3, v);

	if (!includesAll(r1cols[0],r2cols[0])) return false;
	if (!includesAll(r1cols[0],r3cols[0])) return false;

	//console.log("cic3", v, r1, r2, r3, r1cols, r2cols, r3cols);
	return [r1cols, r2cols, r3cols];
}

// check if the colums have rows in common
// c1 must have 3 columns, c2 and c3 can have two or three columns;
// c2 and c3 must have the same columns as c1
// returns row number and cells in common
function rowsInCommon3(c1, c2, c3, v) {
	var c1rows = getColumnRowsWithValue(c1, v);
	var c2rows = getColumnRowsWithValue(c2, v);
	var c3rows = getColumnRowsWithValue(c3, v);

	if (!includesAll(c1rows[0],c2rows[0])) return false;
	if (!includesAll(c1rows[0],c3rows[0])) return false;

	//console.log("ric3", v, c1, c2, c3, c1rows, c2rows, c3rows);
	return [c1rows, c2rows, c3rows];
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

function findSquareTargets(c, v, ex) {
	var targets = [];
	c.forEach((cx) => {
		var sq = squares[cx];
		for (var i=0; i<9; i++) {
			var cix = sq[i];
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

	var sfcandidates = [];

	// first we need to find any rows/colums with exacty three rows of three values (if any)
	// for each value in rCounts3 count the rows of three

	// first check rows/cols with three of the same value
	for (var v=1; v<10; v++) {
		if (rCounts3[v].length === 3) {
			var cicr = columnsInCommon(rCounts3[v][0],rCounts3[v][1],rCounts3[v][2], v);
			if (cicr) {
				console.log("cicr", v, rCounts3[v], cicr);
			}
		}
		if (cCounts3[v].length === 3) {
			var cicc = rowsInCommon(cCounts3[v][0],cCounts3[v][1],cCounts3[v][2], v);
			if (cicc) {
				console.log("cicc", v, cCounts3[v], cicc);
			}
		}
	}

	// next check rows/cols with three of the value against rows/cols with two or three of the value
	for (var v=1; v<10; v++) {
		//if (v !== 4) continue;	// TESTING
		if (rCounts3[v].length === 0) continue;		// skip if there are no rows with three of the value

		var rows3= rCounts3[v];
		var rows2p= rCounts2p[v];
		// get rows of 2 or more not including the rows of 3
		rows2p = rows2p.filter( ( el ) => !rows3.includes( el ) );

		rows3.sort((a,b) => a-b);
		rows2p.sort((a,b) => a-b);
		//console.log("rows", rows3, rows2p);

		var triples = makeTriples(rows3, rows2p);
		//console.log("triples", rows3, rows2p, triples);

		// for each row of three find other rows
		triples.forEach((t) => {
			//console.log("cicr23 chk", v, t);

			var cicr3 = columnsInCommon3(t[0],t[1],t[2], v);
			if (cicr3) {
				var cls = [];
				var tgtcols = cicr3[0][0];
				cicr3.forEach((ci) => {
					cls = cls.concat(ci[1]);
				})
				cls.sort((a,b) => a-b);
				// find targets in cols
				var tgts = findColumnTargets(tgtcols, v, cls);
				//console.log("cicr3", v, t, cls, tgtcols, tgts, cicr3);
				if (tgts.length > 0) {
					//console.log("cicr3", v, t, cls, tgtcols, tgts, cicr3);
					sfcandidates.push([v, tgts, cls]);
				}

			}
		})
	}

	for (var v=1; v<10; v++) {
		if (v !== 4) continue;	// TESTING
		if (cCounts3[v].length === 0) continue;

		var cols3= cCounts3[v];
		var cols2p= cCounts2p[v];
		// get cols of 2 or more not including the cols of 3
		cols2p = cols2p.filter( ( el ) => !cols3.includes( el ) );

		cols3.sort((a,b) => a-b);
		cols2p.sort((a,b) => a-b);
		//console.log("cols", cols3, cols2p);

		var triples = makeTriples(cols3, cols2p);
		//console.log("triples", cols3, cols2p, triples);

		// for each row of three find other rows
		triples.forEach((t) => {
			//console.log("cicr23 chk", v, t);

			var ric3 = rowsInCommon3(t[0],t[1],t[2], v);
			if (ric3) {
				var cls = [];
				var tgtrows = ric3[0][0];
				ric3.forEach((ri) => {
					cls = cls.concat(ri[1]);
				})
				cls.sort((a,b) => a-b);
				//console.log("ric3", v, t, cls, tgtrows, tgts, ric3);
				// find targets in cols
				var tgts = findRowTargets(tgtrows, v, cls);
				if (tgts.length > 0) {
					//console.log("ric3", v, t, cls, tgtrows, tgts, ric3);
					sfcandidates.push([v, tgts, cls]);
				}

			}
		})
	}


	// now we need to find any rows/colums with two of the value
	// for each row of two, find other rows of two
	for (var v=1; v<10; v++) {
		//if (v != 8) continue;	// TESTING

		var r2 = rCounts2[v];	// each row of 2
		//console.log("twocounts", rCounts2[v],cCounts2p[v]);
		if (r2.length === 0) continue;

		// for each group o three rows
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
					var vc = cCounts2p[v];	// cols that contain two or more of the value
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
						//console.log("pt", pt);
						// pt: [row,[col,col]
						if (pt.length > 0) {
							pt.forEach((ptx) => {
								var cls = [];
								ptx.forEach((p) => {
									//console.log("p", p);
									var cix = cols[p[0]][p[1][0]];
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
								if (tgts.length > 0) sfcandidates.push([v, tgts, cls])
							})
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
					var vr = rCounts2p[v];	// rows that contain value
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
							pt.forEach((ptx) => {
								var cls = [];
								ptx.forEach((p) => {
									var cix = rows[p[0]][p[1][0]];
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
								if (tgts.length > 0) sfcandidates.push([v, tgts, cls])
							})
						}
					}
				}
			}
		}
	}

	//console.log("sfcandidates",sfcandidates);
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

//*****************************************************************************
// W-Wing

function wWing() {
	var wwings = [];

	//console.log("wwing", rCounts2, cCounts2 );

	var bvp = findAllBivalueCells();
	//console.log("bvp", bvp);

	var bvpp = [];
	var bvplen = bvp.length;
	var i = 0;
	while (i<bvplen) {
		var bvpi = bvp[i]
		var bxrcsi = [bvp[i][0],bvp[i][1],bvp[i][2],bvp[i][3]];
		var bvppi = [bvp[i][4], [bxrcsi]];
		for (var j=i+1; j<bvplen; ++j) {
			if ((bvp[i][4][0] === bvp[j][4][0]) && (bvp[i][4][1] === bvp[j][4][1])) {
				var bxrcsj = [bvp[j][0],bvp[j][1],bvp[j][2],bvp[j][3]];
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

	//console.log("bvpp", bvpp);

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

//*****************************************************************************
// XY-Chain

// find all occurances of the value in the row/col/sq
function findValuePairsInRCS(arr, val) {
	var cls = [];
	for (var i=0; i<9; ++i) {
		const cixi = arr[i];
		const celli = cells[cixi];
		if (celli.value > 0) continue;
		var aci = celli.activecandidates;
		if (!aci.includes(val)) continue;
		// found one, look for another
		for (var j=i+1; j<9; ++j) {
			const cixj = arr[j];
			const cellj = cells[cixj];
			if (cellj.value > 0) continue;
			var acj = cellj.activecandidates;
			if (!acj.includes(val)) continue;
			// found two
			cls.push([i, cixi, aci],[j, cixj, acj]);
		}
	}
	return cls;
}

function findConjugatePairs() {
	// find conjugate pairs
	// if a value only appears twice in a row/col it is a strong link conjugate pair

	// for each row for each value of count 2 get their cell info
	var cpairs = [];
	for (var v=1; v<10; ++v) {
		var vrows = rCounts2[v];
		//console.log(v, vrows);
		vrows.forEach((r) => {
			// vals [ [col1, cell1, ac1] [col2, cell2, ac2] ]
			var vals = findValuePairsInRCS(rows[r], v);
			if (vals.length === 2) {
				var ac1 = vals[0][2]
				var ac2 = vals[1][2]
				var cel1 = vals[0][1];
				var cel2 = vals[1][1];
				var col1 = RCS[cel1][1];
				var col2 = RCS[cel2][1];
				var sq1 = RCS[cel1][2];
				var sq2 = RCS[cel2][2];
				var rcs1 = [r, col1, sq1, cel1, ac1];
				var rcs2 = [r, col2, sq2, cel2, ac2];
				cpairs.push([v, rcs1, rcs2]);
			}
		})

		var vcols = cCounts2[v];
		//console.log(v, vcols);
		vcols.forEach((c) => {
			// vals [ [row1, cell1, ac1] [row2, cell2, ac2] ]
			var vals = findValuePairsInRCS(cols[c], v);
			if (vals.length === 2) {
				var ac1 = vals[0][2]
				var ac2 = vals[1][2]
				var cel1 = vals[0][1];
				var cel2 = vals[1][1];
				var row1 = RCS[cel1][0];
				var row2 = RCS[cel2][0];
				var sq1 = RCS[cel1][2];
				var sq2 = RCS[cel2][2];
				var rcs1 = [row1, c, sq1, cel1, ac1];
				var rcs2 = [row2, c, sq2, cel2, ac2];
				cpairs.push([v, rcs1, rcs2]);
			}
		})

		var vsqs = sCounts2[v];
		//console.log(v, vsqs);
		vsqs.forEach((s) => {
			// vals [ [off1, cell1, ac1] [off2, cell2, ac2] ]
			var vals = findValuePairsInRCS(squares[s], v);
			if (vals.length === 2) {
				var ac1 = vals[0][2]
				var ac2 = vals[1][2]
				var cel1 = vals[0][1];
				var cel2 = vals[1][1];
				var row1 = RCS[cel1][0];
				var row2 = RCS[cel2][0];
				var col1 = RCS[cel1][1];
				var col2 = RCS[cel2][1];
				var rcs1 = [row1, col1, s, cel1, ac1];
				var rcs2 = [row2, col2, s, cel2, ac2];
				cpairs.push([v, rcs1, rcs2]);
			}
		})
	}
	//console.log("cpairs", cpairs);

	// remove duplicates
	var ncp = [];
	cpairs.forEach((a) => {
		// find entry in new array
		var found = false;
		for (var i=0; i<ncp.length; ++i) {
			var b = ncp[i];
			if (a[0] === b[0] && a[1][3] === b[1][3] && a[2][3] === b[2][3]) found = true;
			if (found) break;
		}
		if (!found) ncp.push(a);
	})

	//console.log("ncp", ncp);
	return ncp;
}

var bvpairs;

// links: [ cix, prevlink, [nextlinks] ]
// check link chain to see if we already have this cell
function haveCellInLinks(links, cix) {
	var curlink = links.length -1;
	while (curlink >= 0) {
		if (links[curlink][1] === cix) return true;
		--curlink;
	}
	return false;
}

function cellsInSameHouse(c0,c1) {
	if (cellRow[c0] === cellRow[c1]) return true;	// same row
	if (cellCol[c0] === cellCol[c1]) return true;	// same col
	if (cellSquare[c0] === cellSquare[c1]) return true;	// same sq
	return false;
}

var links = [];

function findLink(curlinkix, nextval, endval ) {
	// link: [ val, cix, prevlink, [nextlinks] ]
	var curlink = links[curlinkix];
	var curcix = curlink[1];	// current link cell index
//	console.log("link", curlinkix, curcix, nextval, endval, curlink);
//	console.log("links", links);

	var outval = 0;

	// look for a cell containint one of the curent link values
	for (var i=0; i<bvpairs.length; ++i) {
		var bvx = bvpairs[i];
		var bvix = bvx[0];
		if (curcix === bvix) continue;	// skip ourselves if same cell
		// see if this cell has the candidate value
		var bvcell = cells[bvix];
		if (bvcell.value > 0) continue;
		var bvac = bvcell.activecandidates;
		if (!bvac.includes(nextval)) continue;	// not what we are looking for
		if (!cellsInSameHouse(curcix, bvix)) continue;	// not in the same house
		// check to see if we already have this cell in the links
		if (haveCellInLinks(links,bvix)) continue;	// not a candidate

		// which value is the candidate
		if ( bvac[0] === nextval) {
			// [0] is the candidate so look for [1] next
			outval = bvac[1];
		} else {
			outval = bvac[0];
		}
		//console.log("bv", bvix, bvac, nextval, outval);

		// create a new link
		var nextlink = links.length;
		//console.log("curlink before", structuredClone(curlink), nextlink);
		(links[curlinkix][3]).push(nextlink);
		//console.log("curlink after", structuredClone(curlink));
		var newlink = [outval, bvix, curlinkix, [] ];
		links.push(newlink);
		// if the next value is the one we are looking for we are done
		if (outval === endval) return;		// end of chain ??
		findLink(links.length-1, outval, endval);
	}

}

function linkPaths() {
	// link: [ val, cix, prevlink, [nextlinks] ]
	var paths = [];
	var end = links.length - 1;
	for (var i=end; i >= 0; --i) {
		var path = [];
		if (links[i][3].length === 0) {
			// follow the path up
			var endval = links[i][0];
			var val = -1;
			var j = i;
			while (j >= 0) {
				val = links[j][0];
				path.push(links[j][1]);
				j = links[j][2];
			}
			// the start and end values must match
			if (val === endval) {
				path.reverse();
				paths.push([val, path]);
			}
		}
	}
	return paths;
}


function XYChain() {
	bvpairs = findAllBivalueCells();
	//console.log("bvpairs",bvpairs)
	var paths = [];

	//bvpairs.forEach((cp) => {
	for (var b=0; b<bvpairs.length; ++b) {
		var cp = bvpairs[b];
		//console.log("cp", cp);
		var cix = cp[0];
		//if (cix !== 17) continue;	// TEST
		var val0 = cp[4][0];
		var val1 = cp[4][1];

		//console.log("links1", cix, val0, val1)

		links = [];
		var link0 = [val1, cix, -1, []];
		links.push(link0);
		//links.push(structuredClone(link0));
		findLink(0, val0, val1);
		if (links.length > 2) {
			//console.log("linksout0", val0, structuredClone(links));
			var paths0 = linkPaths(links);
			//console.log("paths0", paths0)
			paths0.forEach(p => paths.push(p));
		}
//		console.log("links1", val0, val1)
		links = [];
		var link1 = [val0, cix, -1, []];
		links.push(link1);
		//links.push(structuredClone(link1));
		findLink(0, val1, val0);
		if (links.length > 2) {
			//console.log("linksout1", val1, structuredClone(links));
			var paths1 = linkPaths(links);
			//console.log("paths1", paths1)
			paths1.forEach(p => paths.push(p));
		}
	}

	paths = paths.sort((a,b) => a[0] - b[0]);
	console.log("paths", structuredClone(paths));

	var xytargets = [];
	paths.forEach((p) => {
		var val = p[0];
		var es = p[1][0];
		var end = p[1].length - 1;
		var ee = p[1][end];
		var tgts = findSeenTargets(val, es, ee);
		//console.log(val, es, ee, tgts);
		if (tgts) xytargets.push([val, p[1], tgts])
	})
	xytargets = xytargets.sort((a,b) => b[2].length - a[2].length);
	console.log("xytargets", xytargets);

	var xychain = [];
	xytargets.forEach((t) => {
		var val = t[0];
		var cls = t[1];
		var tgts = t[2];

		var h = {
			type: 'xyChain',
			rows: null,
			cols: null,
			square: null,
			cells: cls,
			offset: null,
			value: val,
			targets: tgts,
			msg: `XY-Chain: Cells: ${tgts}, Value: ${val}`
		}
		xychain.push(h);

	})

	if (xychain.length === 0) return null;
	console.log("xychain", xychain);
	return xychain;

}
