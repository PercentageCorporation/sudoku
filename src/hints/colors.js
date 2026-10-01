import { canSeeEachOther, canSeeEachOtherRC, findTargets } from './hints';
import { cells, rCounts2, vRows, vCols, vSqs } from '/src/hints/hints';
import { findConjugatePairs, findAllCellsWithValue } from '/src/hints/hints';



var colorpairs;

// find the conjugates for the given cell and value
// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
function findConjugates(val, cix) {
	var mates = [];
	colorpairs.forEach((cp) => {
		if (val === cp[0]) {
			var cix0 = cp[1][0];
			var cix1 = cp[2][0];
			//console.log("fc", val, cix, cix0, cix1);
			if (cix === cix0 ) {
				mates.push(cix1);
			} else if (cix === cix1) {
				mates.push(cix0);
			}
		}
	})
	return mates;
}

function getValuePairs(value) {
	var vpairs = [];
	colorpairs.forEach((cp) => {
		if (value === cp[0]) {
			vpairs.push(cp);
		}
	})
	return vpairs;
}

function anyInSameHouse(arr) {
	var arrlen = arr.length;
	for (var i=0; i<arrlen; ++i) {
		for (var j=i+1; j<arrlen; ++j) {
			if (canSeeEachOther(arr[i], arr[j])) return true;
		}
	}
	return false;
}


export function colors() {
	var colors = [];

	colorpairs = findConjugatePairs();
	// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
	//console.log("cpairs", colorpairs);
	//if (cpairs.length === 0) return null;

	// find all of a value that are part of a conjugate pair
	// valpairs[value]: [cp0, cp1, ... ]
	var redblue = [];
	for (var value=1; value<10; ++value) {
		//if (value !== 7) continue;	// TEST
		var vp = getValuePairs(value);
		var vplen = vp.length;
		if (vplen === 0) continue;
		//console.log("vp", vp);

		for (var vpx=0; vpx<vplen; ++vpx) {
			var firstcell = vp[vpx][1][0];
			//console.log("vpx", vpx, firstcell);
			var red = [];
			var blue = [];

			red.push(firstcell);
			var loop = true;
			while (loop) {
				var added = false;
				red.forEach((r) => {
					// possible next pair must come from the conjugate pair list
					var rc = findConjugates(value, r);
					//console.log("rcr", r, rc);
					rc.forEach((cix) => {
						if (!blue.includes(cix)) {
							blue.push(cix);
							added = true;
						}
					})
				})
				blue.forEach((b) => {
					// possible next pair must come from the conjugate pair list
					var rc = findConjugates(value, b);
					//console.log("rcc", b, rc);
					rc.forEach((cix) => {
						if (!red.includes(cix)) {
							red.push(cix);
							added = true;
						}
					})
				})
				//console.log(value, red, blue);
				// end of the chain
				if (!added) {
					//console.log(value, red, blue);
					redblue.push([value, red, blue]);
					break;
				}
				//console.log("vpend", value, vpx, red, blue);
			}

			if ((red.length + blue.length) < 3) continue;

			var redSame = anyInSameHouse(red);
			var blueSame =  anyInSameHouse(blue);

			if (redSame || blueSame) {
				//console.log("Type II", value, red, redSame, blue, blueSame);
				var cls = redSame ? red : blue;
				var tgts = redSame ? blue : red;
				//console.log(cls, tgts);
				var h = {
					type: 'colorsII',
					rows: null,
					cols: null,
					square: null,
					cells: cls,
					cells0: red,
					cells1: blue,
					offset: null,
					value: value,
					targets: tgts,
					msg: `Colors II: Cells: ${tgts}, Value: ${value}`
				}
				colors.push(h);
				continue;
			}

			// are there any occurances of value in a cell not included in red and blue
			var allvals = findAllCellsWithValue(value);
			var outliers = allvals.filter(f => !red.includes(f) && !blue.includes(f));
			var tgts = [];
			outliers.forEach((o) => {
				var seered = false;
				red.forEach((r) => { if (canSeeEachOther(o,r)) seered = true;})
				var seeblue = false;
				blue.forEach((b) => { if (canSeeEachOther(o,b)) seeblue = true;})
				if (seered && seeblue) tgts.push(o);
			})
			//console.log(value, tgts, red, blue, outliers);
			if (tgts.length > 0) {
				//console.log(value, tgts, red, blue, outliers);
				var cls = [...red,...blue];
				var h = {
					type: 'colorsI',
					rows: null,
					cols: null,
					square: null,
					cells: cls,
					cells0: red,
					cells1: blue,
					offset: null,
					value: value,
					targets: tgts,
					msg: `Colors I: Cells: ${tgts}, Value: ${value}`
				}
				colors.push(h);
			}
			if (colors.length > 0) break;
		}
		if (colors.length > 0) break;
	}

	if (colors.length === 0) return null;
	console.log("colors", colors);
	return colors;

}
