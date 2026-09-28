import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS } from '/src/utilities/constants';
import { findTargets, findInternalTargets, includesAll, includesAny, cellHasCandidate } from '/src/hints/hints';
import { rCounts2, rCounts2p, rCounts3, cCounts2, cCounts2p, cCounts3 } from '/src/hints/hints';
import { cells, vRows, vCols, vSqs } from '/src/hints/hints';


//*****************************************************************************
// common functions

function findTriplesByRow(rows) {
	const triples = [];

	for (let r1 = 0; r1 < rows.length - 2; r1++) {
		const [row1, cols1] = Rows[r1];

		for (let r2 = r1 + 1; r2 < rows.length - 1; r2++) {
			const [row2, cols2] = Rows[r2];

			for (let r3 = r2 + 1; r3 < rows.length; r3++) {
				const [row3, cols3] = Rows[r3];

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
		const [col1, rows1] = Cols[c1];

		for (let c2 = c1 + 1; c2 < cols.length - 1; c2++) {
			const [col2, rows2] = Cols[c2];

			for (let c3 = c2 + 1; c3 < cols.length; c3++) {
				const [col3, rows3] = Cols[c3];

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
	var row = Rows[r];
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
	var col = Cols[c];
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
	var c1r = Cols[c1];
	var c2r = Cols[c2];
	var c3r = Cols[c3];
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
	var r1c = Rows[r1];
	var r2c = Rows[r2];
	var r3c = Rows[r3];
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
	var row = Rows[r];
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
	var col = Cols[c];
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
		var row = Rows[rx];
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
		var col = Cols[cx];
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
		var sq = Squares[cx];
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

//*****************************************************************************
// Swordfish

export function swordfish() {

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
									var cix = Cols[p[0]][p[1][0]];
									cls.push(cix);
									cix = Cols[p[0]][p[1][1]];
									cls.push(cix);
								})
								var tgts = [];
								vrc.forEach((v) => {
									v[2].forEach((v2) => {
										var cx = Cols[v[0]][v2];
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
									var cix = Rows[p[0]][p[1][0]];
									cls.push(cix);
									cix = Rows[p[0]][p[1][1]];
									cls.push(cix);
								})
								var tgts = [];
								vrc.forEach((v) => {
									v[2].forEach((v2) => {
										var cx = Rows[v[0]][v2];
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

