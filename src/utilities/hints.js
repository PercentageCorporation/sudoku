import { cellStore, useCellActions } from "/src/store/store";
import {rows, cols, squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012} from '/src/utilities/constants';

var cells = [];

export function runHints() {
	var result;
	cells = cellStore.getState().cells;
	initCounts();

	result = singletons();
	if (result) return result[0];
	result = singleCounts();
	if (result) return result[0];
	result = findNakedPairs();
	if (result) return result[0];
	result = findPointingPairsSquare();
	if (result) return result[0];
	result = pointingPairsRowCol();
	if (result) return result[0];
	//result = findNakedTriples();
	//if (result) return result[0];
	result = hiddenPairs();
	if (result) return result[0];
	result = hiddenTriples();
	if (result) return result[0];
	result = XWing();
	if (result) return result[0];
	result = XYZWing();
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
		candid.map((c) => {
			counts[c] += 1;
		});
	}
	return counts;
}

// get the activecandidate counts for the row/col/square
function rowCounts(r) {
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

//*****************************************************************************

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

// are all values in [b] included in [a]
function includesAll(a,b) {
	return b.every(v => a.includes(v));
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
	console.log(rpc,cpc,spc);

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
	console.log("hpc", hpc);

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

function removeSingles(ap) {
	for (var value=1; value<10; ++value) {
		if (vc[value] > 3 || vc[value] < 2) {
			for (var i=0; i<ptlen; i++) {
				pt[i][1] = pt[i][1].filter(v => v != value);
			}
		}
	}
}

function countTheHouse(house) {
	var vc = [0,0,0,0,0,0,0,0,0,0];
	// count the values in each cell
	var hlen = house.length;
	// count the candidate values
	for (var i=0; i<hlen; i++) {
		house[i][1].map((v) => {vc[v] += 1});
	}
	return vc;
}

// house[]: [row/col/sq, [candidates]]
function collectHouseValues(house) {
	var hv = new Set();
	house.forEach((h) => {
		h[1].forEach(hv.add, hv)
	})
	return Array.from(hv).sort();
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
		pt[i][1].map((v) => {vc[v] += 1});
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
	console.log("pt", ptlen, pt);
	// we have a candidate house

	var triples = [];

	if (ptlen === 3) {
		// possible valid triple
		var hv = collectHouseValues(pt);			// the collection of all values in the house cells
		var hc = countTheHouse(pt);					// counts of the values in the candidate cells
		var hi = [pt[0][0], pt[1][0], pt[2][0]];	// indices of the candidate cells
		var tcc = checkForTripleCounts(hc);
		if (tcc) {
			console.log("hicv", hi, hc, hv, pt);
			console.log("tcc3", 0, 1, 2, pt[0][0], pt[1][0], pt[2][0], tcc, pt);
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
				console.log("valid3");
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
					pt[i][1].map((v) => {tc[v] += 1});
					pt[j][1].map((v) => {tc[v] += 1});
					pt[k][1].map((v) => {tc[v] += 1});
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
							console.log("valid3p");
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
	console.log("triples", triples);
	return triples;
}

function includesAny(a,b) {
	// if a includes any of b
	return b.some(r => a.includes(r))
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
		var rc = rowPairsTriples(i);
		var cc = colPairsTriples(i);
		var sc = sqPairsTriples(i);
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

//*****************************************************************************

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


function firstSingleValue(arr) {
	for (var i=1; i<10; ++i)
		if (arr[i] == 1)
			return i;
	return 0;
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
	return targets;

}
// return an array of cells which contain naked pairs
function findNakedPairs() {
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

	console.log("np:", np);

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
			var tgts = findTargets(rows[rcsix], cls, vals);
			if (tgts.length > 0) npHints.push(['row', rcsix, cls, vals, tgts]);
		} else if (rcs === 'c') {
			var tgts = findTargets(cols[rcsix], cls, vals);
			if (tgts.length > 0) npHints.push(['col', rcsix, cls, vals, tgts]);
		} else if (rcs === 's') {
			var tgts = findTargets(squares[rcsix], cls, vals);
			if (tgts.length > 0) npHints.push(['square', rcsix, cls, vals, tgts]);
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

function findAllPairs(p) {
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

		xyPairs = findAllPairs(xy);
		xzPairs = findAllPairs(xz);
		yzPairs = findAllPairs(yz);

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
			var msg = "Naked Triple: ";
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
		var ccc1 = cellContainsCandidate(r1x, v);
		var ccc2 = cellContainsCandidate(r2x, v);
		var ccc3 = cellContainsCandidate(r3x, v);
		// all or nothing
		if (!(ccc1 && ccc2 && ccc3)) return null;
		cic.push([r1x,r2x,r3x]);
	}

	//console.log("cic", v, cic);
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
	//console.log("cir23", v, ric);
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
	//console.log("cic23", v, cic);
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
				//console.log("cic", v, rCounts3[v], cicr);
			}
		}
		if (cCounts3[v].length === 3) {
			var cicc = rowsInCommon(cCounts3[v][0],cCounts3[v][1],cCounts3[v][2], v);
			if (cicc) {
				//console.log("cic", v, cCounts3[v], cicc);
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
					//console.log("cicr23", v, t, cicr23, cls, tgtcols, tgts);
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
					//console.log("cicc23", v, t, cicc23, cls, tgtrows, tgts);
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
								sfcandidates.push([v, tgts, cls])
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
								sfcandidates.push([v, tgts, cls])
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

