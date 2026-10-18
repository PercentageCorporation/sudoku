import { cellStore } from "/src/store/store";
import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, LinearToGrid } from "/src/utilities/constants";

const INVALID = -1;
const ALLINVALID = -2;
const UNKNOWN = 0;
const VALID = 1;
const SOLVED = 2;
const ELIMINATION = 4;

//******************************************************************************

let bv1 = 0;
let bv2 = 0;

let gamecandidates = null;
//let explorechain = [];

export function biforce() {
	let cells = cellStore.getState().cells;
	let state  = Array.from(cells, c => c.value);
	gamecandidates = Array.from(cells, c => c.activecandidates);

	let level = 0;

	console.log("explore0");
	//explorechain = [];
	let result = explore(state, level);
	console.log("explore", result);

	if (result === SOLVED) {
		if (bv1 === 0 && bv2 === 0) return null;
		console.log("SOLVED ****", bv1, bv2);
		let h = makeForcingHintSolved(bv1, bv2);
		return [h];
	}
	if (result === INVALID) {
		if (bv1 === 0 && bv2 === 0) return null;
		console.log("INVALID ****", bv1, bv2);
		let h = makeForcingHintInvalid(result = bv1, bv2);
		return [h];
	}
	if (result === ALLINVALID) {
		if (bv1 === 0 && bv2 === 0) return null;
		console.log("ALL INVALID ****", bv1, bv2);
		let h = makeForcingHintInvalid(result, bv1, bv2);
		return [h];
	}

	return null;
}

function makeForcingHintSolved(tgt, value) {
	let h = {
		type: 'forcedS',
		rows: null,
		cols: null,
		square: null,
		cells: [tgt],
		parity1: null,
		parity2: null,
		offset: null,
		value: value,
		target: tgt,
		msg: `ForcedBVS: Cell: ${tgt}, Value: ${value}`
	}

	return h;
}

function makeForcingHintInvalid(result, tgt, value) {
	let vals = (result === ALLINVALID) ? [value] : value;

	let h = {
		type: 'forcedI',
		rows: null,
		cols: null,
		square: null,
		cells: [tgt],
		parity1: null,
		parity2: null,
		offset: null,
		values: vals,
		target: tgt,
		msg: `ForcedBVI: Cell: ${tgt}, Value: ${vals}`
	}

	return h;
}

export function cellsToLinearText(cls) {
	var linear = "";
	for (let i = 0; i < 81; i++) {
		var val = cls[LinearToGrid[i]];
		linear += (val === 0) ? " " : Number(val);
	}
	//console.log(values);
	console.log("/"+linear+"/");
	return linear;
}

function explore(state, level) {
	++level;
	do {
		var statecandidates = recomputeCandidates(state);
	} while (applySingles(state, statecandidates));

	let result = hasContradiction(state, statecandidates);
	if (result === INVALID) return INVALID;
	if (result === SOLVED) {
		console.log("SOLVED ****", level);
		return SOLVED;
	}

	const cix = chooseStartingCell(statecandidates);
	if (cix < 0) return UNKNOWN;
	const cell = state[cix];
	const cellcandidates = statecandidates[cix];

	let hasUnknown = false;

	for (const value of cellcandidates) {
		const next = structuredClone(state);
		next[cix] = value;
		//explorechain.push([cix, value]);
		console.log("explore", cix, value, cellcandidates, level);
		const child = explore(next, level);
		console.log("explorex", child);

		if (child.status === ELIMINATION) {
			return child;
		}
		if (child.status === SOLVED) {
			console.log("SOLVED ****", level, cix, cellcandidates, value);
			return child;
		}
		if (child.status === INVALID) {
			// This candidate is impossible in the current state.
			return {
				status: ELIMINATION,
				cell: cix,
				value,
				level,
				state: structuredClone(state)
			};
		}

		if (child.status === UNKNOWN) hasUnknown = true;
	}

	return {status: hasUnknown ? UNKNOWN : INVALID};
}

function applySingles(state, can) {
	let applied = false;
	for( let i=0; i<81; ++i) {
		if (can[i] !== null && can[i].length === 1) {
			state[i] = can[i][0]
			applied = true;
		}
	}
	return applied;
}

function chooseStartingCell(can) {
	for( let i=0; i<81; ++i) {
		if (can[i] !== null && can[i].length === 2) return i;
	}
	// no 2s, go for 3s
	for( let i=0; i<81; ++i) {
		if (can[i] !== null && can[i].length === 3) return i;
	}
	return -1;
}

function hasContradiction(state, can) {
	let count = 0;
	if (!validateAllHouseCandidates(state, can)) return INVALID;	// invalid
	if (!validateAllHouseCells(state)) return INVALID;	// invalid
	for( let i=0; i<81; ++i) {
		if (state[i] === 0) ++count;	// count unsolved cells
	}
	if  (count === 0) return SOLVED;

	return VALID;
}

function validateAllHouseCandidates(state, can) {
	for (var i=0; i<9; ++i) {
		if (!validHouseCandidates(state, can, Rows[i])) return false;
		if (!validHouseCandidates(state, can, Cols[i])) return false;
		if (!validHouseCandidates(state, can, Squares[i])) return false;
	}
	return true;
}

function validHouseCandidates(state, can, arr) {
	let svals = new Set();
	for (var i=0; i<9; ++i) {
		const cix = arr[i];
		if (state[cix] > 0) continue;
		const ac = can[cix];
		if (ac.length === 0) return false;
		if (ac.length === 1) {
			let val = ac[0];
			if (svals.has(val)) return false;
			svals.add(val);
		}
	}
	return true;
}

function validateAllHouseCells(state) {
	for (var i=0; i<9; ++i) {
		if (!validHouseCells(state, Rows[i])) return false;
		if (!validHouseCells(state, Cols[i])) return false;
		if (!validHouseCells(state, Squares[i])) return false;
	}
	return true;
}

function validHouseCells(state, arr) {
	let svals = new Set();
	for (var i=0; i<9; ++i) {
		const cix = arr[i];
		let val = state[cix];
		if (val > 0 ) {
			if (svals.has(val)) return false;
			svals.add(val);
		}
	}
	return true;
}

function recomputeCandidates(cls) {
	let can = Array.from({ length: 81 }, () => []);

	for (let ix=0; ix<81; ++ix) {
		if (cls[ix] !== 0)
			can[ix] = null;
		else {
			let fc = findCandidates(cls, ix);
			// we cannot add candidates, only remove them
			can[ix] = fc.filter(c => gamecandidates[ix].includes(c));
		}
	}

	return can;
}

function findCandidates(cls, ix) {

	let values = [1,2,3,4,5,6,7,8,9];
	const rowix = cellRow[ix];
	const colix = cellCol[ix];
	const sqix = cellSquare[ix];

	Rows[rowix].map(rix => {
		const rv = cls[rix];
		if (rv > 0) values = values.filter(v => v !== rv);
	})
	Cols[colix].map(cix => {
		const cv = cls[cix];
		if (cv > 0) values = values.filter(v => v !== cv);
	})
	Squares[sqix].map(six => {
		const sv = cls[six];
		if (sv > 0) values = values.filter(v => v !== sv);
	})

	return values;
}

