import { RCS } from '/src/utilities/constants';
import { includesAny, findSeenTargets2 } from '/src/hints/hints';
import { canSeeEachOther, sameHouse, sameRow3, sameCol3, sameSq3 } from '/src/hints/hints';
import { getConjugatePairs, findAllBivalueCells } from "/src/hints/conjugates";

//*****************************************************************************
// common functions




let chain = [];
let chain1 = [];
let cpairs = [];
let bivals = [];

// check if the cpairs index is alread in the chain
function pairInChain(ix) {
	var clen = chain.length;
	for (var i=0; i<clen; ++i) {
		if (ix === chain[i][0]) return true;
	}
	return false;
}

function endpointsInPath(cix, ep0, ep1) {
	var j = cix;
	while (j >= 0) {
		var cp0 = chain[j][1][0];
		var cp1 = chain[j][2][0];
		if (ep0 === cp0 || ep1 === cp1 || ep1 === cp0 || ep0 === cp1) return true;
		j = chain[j][3];
	}
	return false;
}

// cpx: [cix, [ac]]
function hasCommonCandiate(ac0, ac1) {
	var c = ac0.filter(value => ac1.includes(value))
	if (c.length === 0) return 0;
	return c[0];
}

// find next AIC link
// current link index is cix
// the next link is to cell in the same row/col/sq as ep1
// chain: [ [cvpix, [ep0, [ac0]], [ep1, [ac1]], previous link, weak candidate, strong candidate, [next links]]]
// cvp: [ value, [cix0, [ac0]], [cix1, [ac1]] ]

function findNextAICLink(cvp, cix) {
	var curlink = chain[cix];	// current link in the chain
	var epx = curlink[2][0];	// next endpoint to link from
	var epac = curlink[2][1];	// candiates
	var epz = curlink[1][0];	// other endpoint -- incoming link
	//console.log("nl", cix, epx, curlink);

	var clen = cvp.length;
	// find a link that shares a candidate
	// we can start at 1 because the chain always starts with one entry
	for (var i=1; i<clen; ++i) {
		if (pairInChain(i)) continue;	// no loops
		var cp = cvp[i];
		var cpv = cp[0];		// strong link value
		var cp0 = cp[1];		// cell data
		var cp1 = cp[2];		// cell data
		var ep0 = cp0[0];		// endpoints
		var ep1 = cp1[0];		// endpoints
		var ac0 = cp0[1];
		var ac1 = cp1[1];
		if (epx === ep0 || epx === ep1 || epz === ep0 || epz === ep1) continue;
		// if we already have this pair, skip it
		if (endpointsInPath(cix, ep0, ep1)) continue;
		// look for the next cpair with an enpoint in the same house
		// except the house we came in on
		// can't be in the same house as the incoming link
		// try the first endpoint
		// next links cannot be in the same house as incoming link
		if (sameRow3(epx, epz, ep0) !== null) continue;
		if (sameRow3(epx, epz, ep1) !== null) continue;
		if (sameCol3(epx, epz, ep0) !== null) continue;
		if (sameCol3(epx, epz, ep1) !== null) continue;
		if (sameSq3(epx, epz, ep0) !== null) continue;
		if (sameSq3(epx, epz, ep1) !== null) continue;

		// next link endpoints cannot all be in the same house
		if (sameRow3(epx, ep0, ep1) !== null) continue;
		if (sameCol3(epx, ep0, ep1) !== null) continue;
		if (sameSq3(epx, ep0, ep1) !== null) continue;

		var cc = 0;
		if (canSeeEachOther(epx, ep0) && (cc = hasCommonCandiate(epac, ac0)) !== 0)
			chain.push([i, cp0, cp1, cix, cc, cpv, []]);
		else if (canSeeEachOther(epx, ep1) && (cc = hasCommonCandiate(epac, ac1)) !== 0)
			chain.push([i, cp1, cp0, cix, cc, cpv, []]);
		else
			continue;

		//if (epx === 68) console.log("?", epx, epz, ep0, ep1, epac, ac0, ac1 );

		var lcl = chain.length-1;
		// add the next link
		curlink[6].push(lcl)
		findNextAICLink(cvp, lcl);
	}
}

// construct the list of path cells from the links
// going from bottom up
// chain: [ [cvpix, [ep0, [ac0]], [ep1, [ac1]], previous link, weak candidate, strong candidate, [next links]]]
function getAICPaths(chain) {
	// link: [ val, cix, prevlink, [nextlinks] ]
	var paths = [];
	var end = chain.length - 1;
	if (end === 0) return paths;

	for (var i=end; i >= 0; --i) {
		// find the first link with the start value
		var path = [];
		// follow the path up
		var j = i;
		while (j >= 0) {
			var linkj = chain[j];
			path.push(j);
			j = linkj[3];	// back up the chain
			//console.log("prev link", j, chain[j]);
		}
		// the long enough and odd number of links
		var plen = path.length;
		if (plen >= 3 && (plen % 2) === 1) {
			// check if the endpoint values match
			var pv0 = chain[path[0]][5];
			var pv1 = chain[path[plen-1]][5];
			if (pv0 === pv1) {
				path.reverse();
				var cpath = [];
				path.forEach((p) => {
					cpath.push([chain[p][1],chain[p][2],chain[p][4],chain[p][5]]);
				})
				paths.push(cpath);
			}
		}
	}
	return paths;
}

// find conjugate pairs of any of  the given values with an endpoint in common
function findCommonEnpointWithValue(ep, eprcs, altcan) {
	var epic = [];
	var cvplen = cpairs.length;
	for (var cv1=0; cv1<cvplen; ++cv1) {
		var cp1 = cpairs[cv1];
		var cpval = cp1[0];
		var cep0 = cp1[1][0];
		var cep1 = cp1[2][0];
		if (ep === cep0 || ep === cep1) continue;	// skip ourselves
		if (!altcan.includes(cpval)) continue;	// must have a matching candidate

		if (canSeeEachOther(ep, cep0)) {
			var rcs0 = commonHouse(ep, cep0);
			if (!inCommonHouse(eprcs, rcs0)) {
				epic.push([cv1, cpval, cep0, cep1]);
				//console.log("cep0", cv1, ep, cep0, cep1, cpval, altcan);
				continue;
			}
		} else if (canSeeEachOther(ep, cep1)) {
			var rcs1 = commonHouse(ep, cep1);
			if (!inCommonHouse(eprcs, rcs1)) {
				epic.push([cv1, cpval, cep1, cep0]);
				//console.log("cep1", cv1, ep, cep1, cep0, cpval, altcan);
				continue;
			}
		}
	}
	return epic;
}

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


// chain link: [[ep0, [eac0]]. [ep1, [eac1]], invalue, outvalue, 's', prev link, [next links]];

function endpointsInPath1(ep0, ep1) {
	var j = chain1.length - 1;
	while (j >= 0) {
		var cp0 = chain1[j][0][0];
		var cp1 = chain1[j][1][0];
		if (ep0 === cp0 || ep1 === cp1 || ep1 === cp0 || ep0 === cp1) return true;
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

function findAllPossibleNextLinks(curlink) {
	var nl = [];
	var curlink = chain[clix];	// current link in the chain
	var epz = curlink[0][0];	// incoming link endpoint
	var epx = curlink[1][0];	// next endpoint to link from
	var epac = curlink[1][1];	// candiates
	var outac = curlink
	var ws = curlink[4];
	var nextstrong = (ws === 'w');	// if incoming link is weak, the next link must be strong

	// conjugate pairs are valid next links for weak or strong
	var eprcs = getCommonHouse(epx, epz);	// get the house of the current cpair
	var ccp = findCommonConjugatePairs(epx, epz,  eprcs, [value]);


}

// find cpairs of same value with common endpoint
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
//
function findCommonConjugatePairs(epx, epz, eprcs, vals) {
	var ccp = [];
	// for each conjugate pair start the chains with their endpoints
	var cvplen = cpairs.length;
	for (var cv=0; cv<cvplen; ++cv) {
		var cp = cpairs[cv];
		var value = cp[0];
		if (!vals.includes(value)) continue;
		var numvals = vals.length;
		var cep0 = cp[1][0];
		var cep1 = cp[2][0];
		if ((epx === cep0 && epz === cep1) || (epx === cep1 && epz === cep0)) continue;	// skip ourselves
		// try for a weak link to a strong link
		if (canSeeEachOther(epx, cep0)) {
			//console.log("cansee0", epx, cep0, cep1);
			var rcs0 = getCommonHouse(epx, cep0);
			if (numvals === 1 && epx === cep0) {
				ccp.push([value, epx, cp[2], cp[1]]);
				//console.log("push0a", value, epx, cp[1], cp[2]);
			} else if (!inCommonHouse(eprcs, rcs0)) {
				ccp.push([value, epx, cp[1], cp[2]]);
				//console.log("push0b", value, epx, cp[1], cp[2]);
			}
			//console.log("ccp0", cv, ep, cep0, cep1, value);
		} else if (canSeeEachOther(epx, cep1)) {
			//console.log("cansee1", epx, cep1, cep0);
			var rcs1 = getCommonHouse(epx, cep1);
			if (numvals === 1 && epx === cep1) {
				ccp.push([value, epx, cp[1], cp[2]]);
				//console.log("push1a", value, epx, cp[1], cp[2]);
			} else if( !inCommonHouse(eprcs, rcs1)) {
				ccp.push([value, epx, cp[2], cp[1]]);
				//console.log("push1b", value, epx, cp[2], cp[1]);
			}
			//console.log("ccp1", cv, epx, cep1, cep0, value);
		}
	}
	return ccp;
}

function nextLink1(clix) {
	var curlink = chain1[clix];	// current link in the chain
	var epz = curlink[0][0];	// incoming link endpoint
	var epx = curlink[1][0];	// next endpoint to link from
	var epac = curlink[1][1];	// candiates
	var outval = curlink[3];	// next value for strong link
	var ws = curlink[4];
	var nextstrong = (ws === 'w');	// if incoming link is weak, the next link must be strong

	// if the incoming link is weak, the next link must be a strong link, either a cp or bv with the same candidate
	// conjugate pairs are valid next links for weak or strong
	var eprcs = getCommonHouse(epx, epz);	// get the house of the current cpair
	var ccp = findCommonConjugatePairs(epx, epz, eprcs, [outval]);
	//console.log("ccps", epx, epz, eprcs, outval);
	//console.log("ccp", ccp);
	ccp.forEach((cp) => {
		// cp: [ val, link ep, tgt ep0, tgt ep1]
		if (!endpointsInPath1(cp[2][0], cp[3][0])) {
			var link = [cp[2], cp[3], cp[0], cp[0], 's', clix, []];
			var nl = chain1.length;
			chain1[clix][6].push(nl);
			chain1.push(link);
			//console.log("nextlink", nl, link);
			nextLink1(nl);
		}
	})

	if (!nextstrong) {
		// we can look for a weak link at this point
		// so do we have any weak link to a strong link, either a cp or bv
		var ccp = findCommonConjugatePairs(epx, epz, eprcs, epac);
		//console.log("wccps", epx, epz, eprcs, epac);
		//console.log("wccp", ccp);
		ccp.forEach((cp) => {
			// cp: [ val, link ep, tgt ep0, tgt ep1]
			if (!endpointsInPath1(cp[2][0], cp[3][0])) {
				var link = [cp[2], cp[3], cp[0], cp[0], 's', clix, []];
				var nl = chain1.length;
				chain1[clix][6].push(nl);
				chain1.push(link);
				//console.log("wnextlink", nl, link);
				nextLink1(nl);
			}
		})
	}
	//console.log("NL RETURN");

}

// construct the list of path cells from the links
// going from bottom up
// chain: [ [ [ep0, [ac0]], [ep1, [ac1]], inval, outval, linktype, prev link, [next links]]]
function getAICPaths1(chain1) {
	// link: [ val, cix, prevlink, [nextlinks] ]
	var paths = [];
	var end = chain1.length - 1;
	if (end === 0) return paths;

	for (var i=end; i >= 0; --i) {
		// find the first link with the start value
		var path = [];
		// follow the path up
		var j = i;
		while (j >= 0) {
			var linkj = chain1[j];
			path.push(j);
			j = linkj[5];	// back up the chain
			//console.log("prev link", j, chain[j]);
		}
		// the long enough and odd number of links
		var plen = path.length;
		if (plen >= 3 && (plen % 2) === 1) {
			// check if the endpoint values match
			var pv0 = chain1[path[0]][2];
			var pv1 = chain1[path[plen-1]][3];
			if (pv0 === pv1) {
				path.reverse();
				var cpath = [];
				path.forEach((p) => {
					cpath.push([chain1[p][0][0],chain1[p][1][0],chain1[p][2],chain1[p][3]]);
				})
				paths.push(cpath);
			}
		}
	}
	return paths;
}


// chain: [ [cvpix, [ep0, [ac0]], [ep1, [ac1]], previous link, weak candidate, strong candidate, [next links]]]
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
export function loops() {
	var loops = [];
	cpairs = getConjugatePairs();
	//cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
	//console.log("cpairs", cpairs);

	bivals = findAllBivalueCells();
	//console.log("bivals", bivals);



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

		// make the first link
		chain1 = [];	// reset the chain
		var link = [[sep0, sac0], [sep1, sac1], valstart, valstart, 's', -1, []];
		//console.log("firstlink", link);
		chain1.push(link);
		nextLink1(0);
		var pathsa = getAICPaths1(chain1);
		//console.log("pathsa", pathsa);

		// make the alternate link
		chain1 = [];	// reset the chain
		var link = [[sep1, sac1], [sep0, sac0], valstart, valstart, 's', -1, []];
		//console.log("firstlink", link);
		chain1.push(link);
		nextLink1(0);
		var pathsb = getAICPaths1(chain1);
		//console.log("pathsb", pathsb);


		var paths = [...pathsa, ...pathsb];
		if (paths.length === 0) continue;
		console.log("paths", paths);
		// get the endpoints and value

		for (var ap=0; ap<paths.length; ++ap) {
			var p = paths[ap]
			var plen = p.length;
			var ep0 = p[0][0];
			var ep1 = p[plen-1][1];
			var val = p[0][2];
			// the endpoints cannot be in the same house
			console.log("cep", val, ep0, ep1);
			if (sameHouse(ep0, ep1) !== null) continue;

			//console.log("cep", val, ep0, ep1);
			var tgts = findSeenTargets2(val, ep0, ep1);
			if (!tgts) continue;

			// collect the alternating link cells and the full path
			var fullpath = [];
			var parity1 = [];
			var parity2 = [];
			p.forEach((px) => {
				fullpath.push(px[0], px[1]);
				parity2.push(px[0]);
				parity1.push(px[1]);
			})

			console.log("eps", val, ep0, ep1, tgts, fullpath, parity1, parity2, p);

			// if targets are in the chain I think something is wrong
			if (includesAny(fullpath, tgts)) continue;
			//if (val === 2) continue; // TEST
			//console.log("aictargets", val, ep0, ep1, tgts);
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
		if (loops.length > 0) break;
	}

	if (loops.length === 0) return null;
	console.log("loops", loops);
	return loops;
}
//*****************************************************************************
// loops

// chain: [ [cvpix, [ep0, [ac0]], [ep1, [ac1]], previous link, weak candidate, strong candidate, [next links]]]
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
export function loops1() {
	var loops = [];
	cpairs = getConjugatePairs();
	//cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
	//console.log("cpairs", cpairs);

	//bivals = findAllBivalueCells();
	//console.log("bivals", bivals);



	// for each conjugate pair start the chains with their endpoints
	var cvplen = cpairs.length;
	for (var cv=0; cv<cvplen; ++cv) {
		var cp = cpairs[cv];
		// pick a starting endpoint

		var valstart = cp[0];  // starting value for which there is only one in a conjugate pair
		var sep0 = cp[1];
		var sep1 = cp[2];

		// we need a strong link to start so start with a conjugate pair
		// try the first endpoint and see what happens
		chain = [];
		chain.push([0, sep0, sep1, -1, 0, valstart, []]);
		//console.log("chain start 0", value, chain);
		findNextAICLink(cpairs, 0);
		//console.log("chain end0", cv, chain);
		var aic0paths = getAICPaths(chain);

		// try the other endpoint
		chain = [];
		chain.push([0, sep1, sep0, -1, 0, valstart, []]);
		//console.log("chain start 0", value, chain);
		findNextAICLink(cpairs, 0);
		//console.log("chain end1", cv, chain);
		var aic1paths = getAICPaths(chain);

		var aicpaths = [...aic0paths, ...aic1paths];
		if (aicpaths.length === 0) continue;
		//console.log("aicpaths", aicpaths);
		// get the endpoints and value

		for (var ap=0; ap<aicpaths.length; ++ap) {
			var p = aicpaths[ap]
			var plen = p.length;
			var ep0 = p[0][0][0];
			var ep1 = p[plen-1][1][0];
			// the endpoints cannot be in the same house
			if (sameHouse(ep0, ep1) !== null) continue;

			//console.log("aicep", val, ep0, ep1);
			var val = p[0][3];
			var tgts = findSeenTargets2(val, ep0, ep1);
			if (!tgts) continue;

			// collect the alternating link cells and the full path
			var fullpath = [];
			var parity1 = [];
			var parity2 = [];
			p.forEach((px) => {
				fullpath.push(px[0][0], px[1][0]);
				parity2.push(px[0][0]);
				parity1.push(px[1][0]);
			})

			//console.log("eps", val, ep0, ep1, tgts, fullpath, parity1, parity2, p);

			// if targets are in the chain I think something is wrong
			if (includesAny(fullpath, tgts)) continue;
			if (val === 2) continue; // TEST
			//console.log("aictargets", val, ep0, ep1, tgts);
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
		if (loops.length > 0) break;
	}


	if (loops.length === 0) return null;
	console.log("loops", loops);
	return loops;

}
