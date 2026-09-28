import { cells, findAllBivalueCells } from '/src/hints/hints';
import { cellRow, cellCol, cellSquare } from '/src/utilities/constants';

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
			var vals = findValuePairsInRCS(Rows[r], v);
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
			var vals = findValuePairsInRCS(Cols[c], v);
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
			var vals = findValuePairsInRCS(Squares[s], v);
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

//*****************************************************************************
// XY-Chain

export function XYChain() {
	bvpairs = findAllBivalueCells();
	//console.log("bvpairs",bvpairs)
	var paths = [];

	//bvpairs.forEach((cp) => {
	for (var b=0; b<bvpairs.length; ++b) {
		var cp = bvpairs[b];
		// bvp: [ cix, [ac]]
		//console.log("cp", cp);
		var cix = cp[0];
		//if (cix !== 17) continue;	// TEST
		var val0 = cp[1][0];
		var val1 = cp[1][1];

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
		var tgts = findSeenTargets2(val, es, ee);
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

