import { RCS } from '/src/utilities/constants';
import { includesAny, findSeenTargets2 } from '/src/hints/hints';
import { canSeeEachOther, findTargetsSeenByAll, sameHouse, sameRow3, sameCol3, sameSq3 } from '/src/hints/hints';
import { getConjugatePairs, findAllBivalueCells } from "/src/hints/conjugates";
import { cellStore } from '/src//store/store';

//*****************************************************************************
// common functions




let chain = [];
let chain1 = [];
let cpairs = [];
let bivals = [];

// find cpairs of same value with common endpoint
// bival: [ cix, [ac]] ]
//
function findCommonBivalueCell(ep, eprcs, value) {
	var bvp = [];
	// for each conjugate pair start the chains with their endpoints
	var bvplen = bivals.length;
	for (var bv=0; cv<bvplen; ++bv) {
		var bp = bivals[bv];
		var bep = bp[0];
		if (ep === bep) continue;	// skip ourselves
		if (!bp[1].includes(value)) continue;

		var valout = bp[1][0] === value ? bp[1][1] : bp[1][0];

	}
	return bvp;
}

// chain link: [ ep, ac, invalue, outvalue, 'sw', prev link, [next links]];

function endpointsInPath(ep0, ep1) {
	var j = chain1.length - 1;
	while (j >= 0) {
		var cp0 = chain1[j][0];
		if (ep0 === cp0 || ep1 === cp0) return true;
		j = chain1[j][5];
	}
	return false;
}

function endpointInPath(ep) {
	var j = chain1.length - 1;
	while (j >= 0) {
		var cp0 = chain1[j][0];
		if (ep === cp0) return true;
		j = chain1[j][5];
	}
	return false;
}

function inCommonHouse(rcs0, rcs1) {
	if (rcs0[0] > 0 && rcs1[0] > 0 && rcs0[0] === rcs1[0]) return true;
	if (rcs0[1] > 0 && rcs1[1] > 0 && rcs0[1] === rcs1[1]) return true;
	if (rcs0[2] > 0 && rcs1[2] > 0 && rcs0[2] === rcs1[2]) return true;
	return false;
}

// do the cells share a house
function getCommonHouse(c0, c1) {
	var rcs = [-1,-1,-1];
	var rcs0 = RCS[c0];
	var rcs1 = RCS[c1];
	if (rcs0[0] === rcs1[0]) rcs[0] = rcs0[0];
	if (rcs0[1] === rcs1[1]) rcs[1] = rcs0[1];
	if (rcs0[2] === rcs1[2]) rcs[2] = rcs0[2];
	if (rcs[0] === -1 && rcs[1] === -1 && rcs[2] === -1) return null;
	return rcs;
}

// find cpairs of same value with common endpoint
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
function findCommonConjugatePairs(ep, vals) {
	var ccp = [];
	// for each conjugate pair start the chains with their endpoints
	var cvplen = cpairs.length;
	for (var cv=0; cv<cvplen; ++cv) {
		var cp = cpairs[cv];
		var value = cp[0];
		if (!vals.includes(value)) continue;
		var cep0 = cp[1][0];
		var cep1 = cp[2][0];
		if (ep === cep0) {
			ccp.push([value, cep1, cp[1], cp[2]]);
		} else if (ep === cep1) {
			ccp.push([value, cep0, cp[2], cp[1]]);
		}
	}
	return ccp;
}

// find cpairs of a vaue contained in vals, with an endpoint that can be seen
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
function findSeenConjugatePairs(ep, vals) {
	var ccp = [];
	// for each conjugate pair start the chains with their endpoints
	var cvplen = cpairs.length;
	for (var cv=0; cv<cvplen; ++cv) {
		var cp = cpairs[cv];
		var value = cp[0];
		if (!vals.includes(value)) continue;
		//var numvals = vals.length;
		var cep0 = cp[1][0];
		var cep1 = cp[2][0];
		// no endpoints in common
		if (ep === cep0  || ep === cep1) continue;	// skip ourselves
		// try for a weak link to a strong link
		if (canSeeEachOther(ep, cep0)) {
			ccp.push([value, cep0, cp[1], cp[2]]);
		} else if (canSeeEachOther(ep, cep1)) {
			ccp.push([value, cep1, cp[2], cp[1]]);
		}
	}
	return ccp;
}

// link: [ ep, ac, incoming candidate, outgoing candidate, weak/strong, previous link,  [next links]]
function nextLink(clix) {
	//if (clix > 20) return;
	var curlink = chain1[clix];	// current link in the chain
	var ep = curlink[0];	// incoming link endpoint
	var epac = curlink[1];	// candiates
	var epval = curlink[2];
	var wsin = curlink[4];	// weak/strong
	var nextstrong = (wsin === 'w');	// if incoming link is weak, the next link must be strong
	//console.log("thislink", clix, ep, nextstrong, curlink)
	//if (ep === 59) console.log("************************************");

	if (nextstrong) {
		// if the next link must be strong it must be to a cp with a common endpoint and value (or to the other candidate of a bv)
		var ccp = findCommonConjugatePairs(ep, [epval]);
		ccp.forEach((cp) => {
			//console.log("strong ccp", ccp);
			// cp: value, cep1, cpa, cpb]
			var cep0 = cp[2][0];
			var cac0 = cp[2][1];
			var lnkval = cp[0];
			if (!endpointInPath(cep0)) {
				// only one link since the previous link has an endpoint in common
				var nl = chain1.length;
				var link = [cep0, cac0, lnkval, 0, 's', clix, []];
				chain1[clix][6].push(nl);
				chain1.push(link);
				//console.log("pl1", link);
				nextLink(nl);
			}
		})
	} else {
		// if the incoming link is strong, the next link can be either weak or strong
		// conjugate pairs or bivalue cells are valid next links for weak or strong

		// look for weak links to conjugate pairs or common conjugate pairs
		var lac = epac.filter(ac => ac !== epval);	// next link cannot include incoming value
		//console.log("lac", lac);
		var ccp = findCommonConjugatePairs(ep, lac);
		//console.log("weak ccp", ep, lac, ccp);
		// strong link to next endpoint
		ccp.forEach((cp) => {
			// cp: value, cep1, cpa, cpb]
			var cep = cp[1];	// next endpoint
			var cac = cp[2][1];
			var lnkval = cp[0];
			//console.log("ccp", ep, cep, lac, cp);
			if (!endpointInPath(cep)) {
				//console.log("ccp", ep, cep, lac, cp);
				// the first link is to the alternate candidate in the same cell
				var nl = chain1.length;
				chain1[clix][6].push(nl);
				var link = [ep, epac, lnkval, 0, 'w', clix, [nl]];
				chain1.push(link);

				// the next link is the other endpoint of the cp
				var link = [cep, cac, lnkval, 0, 's', nl, []];
				chain1.push(link);

				//console.log("pl2", clix, nl, link);
				//console.log("pl2", chain1[clix]);
				nextLink(nl);
			}
		})

		// or we can look for a weak link to a strong link such as a cp or bv
		var scp = findSeenConjugatePairs(ep, [epval] );
		//console.log("weak scp", ep, epval, scp);
		//console.log("ccp", ccp);
		// weak link to strong link
		scp.forEach((cp) => {
			// cp: value, cep1, cpa, cpb]
			var cep0 = cp[2][0];
			var cac0 = cp[2][1];
			var cep1 = cp[3][0];
			var cac1 = cp[3][1];
			var lnkval = cp[0];
			if (!endpointsInPath(cep0, cep1)) {
				//console.log("scp", ep, cep0, cep1, lac, cp);
				// adding two links for the pair
				var nl = chain1.length;
				var link = [cep0, cac0, epval, 0, 'w', clix, [nl]];
				chain1[clix][6].push(nl);
				chain1.push(link);
				//console.log("pl3a", link);

				var link = [cep1, cac1, lnkval, 0, 's', nl, []];
				chain1.push(link);
				//console.log("pl3b", link);
				nextLink(nl+1);
			}
		})
	}

	//console.log("NL RETURN");

}

function filterShortest(arrays) {
	const map = new Map();

	for (const arr of arrays) {
		const start = arr[0];
		const end = arr[arr.length - 1];

		const key = start < end
		? `${start},${end}`
		: `${end},${start}`;

		if (!map.has(key) || arr.length < map.get(key).length) {
			map.set(key, arr);
		}
	}

	return [...map.values()];
}

// construct the list of path cells from the links
// going from bottom up
// chain: [ [ ep, ac, inval, outval, linktype, prev link, [next links] ] ]
function getAICPaths(chain1) {
	// link: [ val, cix, prevlink, [nextlinks] ]
	var paths = [];
	var end = chain1.length - 1;
	if (end === 0) return paths;

	var startval = chain1[0][2]

	for (var i=end; i >= 0; --i) {
		// find the first link with the start value
		if (chain1[i][6].length > 0) continue;
		if (chain1[i][2] !== startval) continue;	// the end must match the start
		//console.log("endchain", i, startval);
		var path = [];
		// follow the path up
		var j = i;
		while (j >= 0) {
			var linkj = chain1[j];
			path.push(j);
			j = linkj[5];	// back up the chain
			//console.log("prev link", j);
		}
		// long enough and odd number of links
		var plen = path.length;
		if (plen >= 3) {
			// check if the endpoint values match
			path.reverse();
			var cpath = [];
			path.forEach((p) => {
				cpath.push([chain1[p][0],chain1[p][2],chain1[p][3]]);
			})
			paths.push(cpath);
		}
	}

	return paths;
}

//*****************************************************************************
// loops AIC Type 1


// chain: [ ep, ac, incoming candidate, outgoing candidate, incoming link weak/strong, previous link,  [next links]]]
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
export function loops() {
	var loops = [];
	cpairs = getConjugatePairs();
	//cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
	//console.log("cpairs", cpairs);

	bivals = findAllBivalueCells();
	//console.log("bivals", bivals);
	// we need to start with a strong link so we might as well use a cp
	// for each conjugate pair start the chains with their endpoints
	// bv: [ cix, [ac]]
	var bvlen = bivals.length;
	for (var bv=0; bv<bvlen; ++bv) {
		var bp = bivals[bv];
		var bvep = bp[0]
		var bvac = bp[1];
		if (bvep !== 24) continue;	// TEST
		//console.log("bp", bp);

		// make the first link
		chain1 = [];	// reset the chain
		var link = [bvep, bvac,  bvac[0], 0, 'x', -1, [1]];
		chain1.push(link);
		var link = [bvep, bvac,  bvac[1], 0, 's', 0, []];
		chain1.push(link);
		nextLink(1);

		//console.log("chain0", chain1);
		var pathsa = getAICPaths(chain1);
		//console.log("pathsa", pathsa);
		var spaths = filterShortest(pathsa);
		//console.log("spaths0", spaths);
		loops = processPaths(spaths);
		if (loops.length > 0) break;

		// make the alternate link
		chain1 = [];	// reset the chain
		var link = [bvep, bvac,  bvac[1], 0, 'x', -1, [1]];
		chain1.push(link);
		var link = [bvep, bvac,  bvac[0], 0, 's', 0, []];
		chain1.push(link);
		nextLink(1);

		//console.log("chain1", chain1);
		var pathsb = getAICPaths(chain1);
		//console.log("pathsb", pathsb);
		var spaths = filterShortest(pathsb);
		//console.log("spaths1", spaths);
		loops = processPaths(spaths);
		if (loops.length > 0) break;
	}

	if (loops.length > 0) {
		console.log("loops", loops);
		return loops;
	}

	// we need to start with a strong link so we might as well use a cp
	// for each conjugate pair start the chains with their endpoints
	var cvplen = cpairs.length;
	for (var cv=0; cv<cvplen; ++cv) {
		//if (cv !== 24) continue;	// TEST
		var cp = cpairs[cv];
		//console.log("cp", cp);
		// pick a starting endpoint

		var valstart = cp[0];  // starting value for which there is only one in a conjugate pair
		//if (valstart !== 5) continue;	// TEST
		var sep0 = cp[1][0];
		var sac0 = cp[1][1]
		var sep1 = cp[2][0];
		var sac1 = cp[2][1];

		//if (sep0 !== 75 && sep1 !== 75) continue;
		// make the first link
		chain1 = [];	// reset the chain
		var link = [sep0, sac0,  valstart, 0, 'x', -1, [1]];
		chain1.push(link);
		var link = [sep1, sac1,  valstart, 0, 's', 0, []];
		chain1.push(link);
		nextLink(1);
		//console.log("chain1", cv, chain1);
		var chainx = [...chain1];
		var pathsa = getAICPaths(chain1);
		//console.log("pathsa", cv, pathsa);

		// make the alternate link
		chain1 = [];	// reset the chain
		chain1 = [];	// reset the chain
		var link = [sep1, sac1,  valstart, 0, 'x', -1, [1]];
		chain1.push(link);
		var link = [sep0, sac0,  valstart, 0, 's', 0, []];
		chain1.push(link);
		nextLink(1);
		var chainx = [...chainx,...chain1];
		var pathsb = getAICPaths(chain1);
		//console.log("pathsb", cv, pathsb);


		var paths = [...pathsa, ...pathsb];
		if (paths.length === 0) continue;
		var spaths = filterShortest(paths);
		//console.log("spaths", spaths);
		// get the endpoints and value

		loops = processPaths(spaths);
		if (loops.length > 0) break;
	}

	if (loops.length === 0) return null;
	console.log("loops", loops);
	return loops;
}

function findLoopTargets(path) {
	var targets = [];
	var plen = path.length;
	for (var i=1; i<plen-1; i+=2) {
		var pi = path[i];
		var pj = path[i+1];
		var val = pj[1];
		var epi = pi[0];
		var epj = pj[0];
		var cls = [epi, epj];
		if (epi === epj) {
			var wvals = [pi[1],pj[1]];
			var eac = cellStore.getState().actions.getActiveCandidates(epi);
			var tac = eac.filter(ac => !wvals.includes(ac));
			console.log("tc", epi, wvals, eac, tac)
			if (tac.length > 0) targets.push([[epi], tac]);
		} else {
			var tgts = findTargetsSeenByAll(val, cls, cls);
			if (tgts) targets.push([[tgts],[val]]);
		}
	}
	// do the endpoints
	cls = [path[0][0], path[plen-1][0]];
	var tgts = findTargetsSeenByAll(path[0][1], cls, cls);
	if (tgts) targets.push([[tgts],[val]]);

	return targets;
}

function processPaths(spaths) {
	var loops = [];

	for (var ap=0; ap<spaths.length; ++ap) {
		var p = spaths[ap]
		//console.log("path", p);
		var plen = p.length;
		var ep0 = p[0][0];
		var ep1 = p[plen-1][0];
		var val = p[0][1];
		// the endpoints cannot be in the same house
		//console.log("cep", val, ep0, ep1);
		if (sameHouse(ep0, ep1) !== null) {
			// if in same house check for loop
			console.log("LOOP *************************");
			console.log("path", p);
			var tgts = findLoopTargets(p);
			console.log("tgts", ep0, ep1, tgts);
			continue;
		}

		//console.log("cep", val, ep0, ep1);
		var tgts = findSeenTargets2(val, ep0, ep1);
		if (!tgts) continue;

		// collect the alternating link cells and the full path
		var fullpath = [];
		var parity1 = [];
		var parity2 = [];
		var tf = false;
		p.forEach((px) => {
			fullpath.push(px[0]);
			if (tf)
				parity2.push(px[0]);
			else
				parity1.push(px[0]);
			tf = !tf;
		})

		// if targets are in the chain I think something is wrong
		if (includesAny(fullpath, tgts)) continue;
		//if (val === 2) continue; // TEST
		console.log("aic", fullpath);;
		console.log("path", p);

		var h = {
			type: 'aicI',
			rows: null,
			cols: null,
			square: null,
			cells: [ep0, ep1],
			parity1: parity1,
			parity2: parity2,
			offset: null,
			value: val,
			targets: tgts,
			msg: `AIC I: Cells: ${tgts}, Value: ${val}`
		}
		loops.push(h);
		break;
	}

	return loops;
}
