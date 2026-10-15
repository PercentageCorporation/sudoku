import { findAllBivalueCells, getConjugatePairs } from '/src/hints/conjugates';

export function forcingChains() {

	let bvpairs = findAllBivalueCells();
	// bvpairs: [ [cix, [ac]], [cix, [ac]], ...]
	//console.log("bvpairs",bvpairs)
	let cpairs = getConjugatePairs();
	//cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
	//console.log("cpairs", cpairs);

	// calculate the number of strong links attached to each cell
	//let stronglinks = Array.from({ length: 81 }, () => []),
	let stronglinks = Array(81).fill(0);

	let cplen = cpairs.length;
	for( let cx=0; cx<cplen; ++cx) {
		let cp = cpairs[cx];
		stronglinks[cp[1][0]]++;
		stronglinks[cp[2][0]]++;
	}

	let bvlen = bvpairs.length;
	for( let bx=0; bx<bvlen; ++bx) {
		let bp = bvpairs[bx];
		stronglinks[bp[0]]++;
	}

	console.log(stronglinks);
	let strongs = [];
	for( let i=0; i<81; ++i) {
		if (stronglinks[i] > 0) strongs.push([i, stronglinks[i]]);
	}
	strongs.sort((a, b) => b[1] - a[1])
	console.log(strongs);


	let forced = [];
	if (forced.length === 0) return null;
	console.log("forced",forced);
	return forced;

}
