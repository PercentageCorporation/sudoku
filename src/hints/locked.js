import { Rows, Cols, Squares, RCS } from '/src/utilities/constants';
import { findTargets } from '/src/hints/hints';
import { vSqs, sameRow, sameCol } from '/src/hints/hints';

//*****************************************************************************
// lockedCandidates

export function lockedCandidates1() {

	var lc = [];
	for (var s=0; s<9; ++s) {
		if (s !== 2) continue;	// TEST
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
