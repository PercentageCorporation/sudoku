import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS } from '/src/utilities/constants';
import { findTargets, findInternalTargets, includesAll, includesAny } from '/src/hints/hints';
import { cells, vRows, vCols, vSqs } from '/src/hints/hints';


// if the cells are in the same row, return the row number
function sameRow(cls) {
	var clen = cls.length;
	for (var i=0; i<clen; ++i) {
		for (var j=i+1; j<clen; ++j) {
			if (RCS[cls[i]][0] !== RCS[cls[j]][0]) return null;
		}
	}
	return RCS[cls[0]][0];
}

function sameCol(cls) {
	var clen = cls.length;
	for (var i=0; i<clen; ++i) {
		for (var j=i+1; j<clen; ++j) {
			if (RCS[cls[i]][1] !== RCS[cls[j]][1]) return null;
		}
	}
	return RCS[cls[0]][1];
}

function sameSql(cls) {
	var clen = cls.length;
	for (var i=0; i<clen; ++i) {
		for (var j=i+1; j<clen; ++j) {
			if (RCS[cls[i]][2] !== RCS[cls[j]][2]) return null;
		}
	}
	return RCS[cls[0]][2];
}

function sameRow2(c0, c1) {
	if (RCS[c0][0] === RCS[c1][0]) return RCS[c0][0];
	return null;
}

function sameRow3(c0, c1, c2) {
	if (RCS[c0][0] !== RCS[c1][0]) return null;
	if (RCS[c0][0] !== RCS[c2][0]) return null;
	return RCS[c0][0];
}

function sameCol2(c0, c1) {
	if (RCS[c0][1] === RCS[c1][1]) return RCS[c0][1];
	return null;
}

function sameCol3(c0, c1, c2) {
	if (RCS[c0][1] !== RCS[c1][1]) return null;
	if (RCS[c0][1] !== RCS[c2][1]) return null;
	return RCS[c0][1];
}

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

//*****************************************************************************
// lockedCandidates

export function lockedCandidates1() {

	var lc = [];
	for (var s=0; s<9; ++s) {
		var square = Squares[s];
		for (var v=1; v<10; ++v) {
			var vcnt = vSqs[s][v];	// number of occurances of the value in the square
			if (vcnt > 1 && vcnt < 4) {
				// svc: rcs, value, square, row/col, count, cells
				var cls = findTargets(square, [v], [])
				//console.log("vcnt", s, v, vcnt, cls);
				var srow = sameRow(cls);
				if (srow) {
					var arr = Rows[srow];
					var tgts = findTargets(arr, [v], square);
					if (tgts) lc.push(['r', srow, v, cls, tgts, s])
				} else {
					var scol = sameCol(cls);
					if (scol) {
						var arr = Cols[scol];
						var tgts = findTargets(arr, [v], square);
						if (tgts) lc.push(['c', scol, v, cls, tgts, s])
					}
				}
			}
		}
	}
	console.log("lc", lc);

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
