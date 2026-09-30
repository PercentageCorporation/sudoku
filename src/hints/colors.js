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


export function colors1() {
	var colors1 = [];

	colorpairs = findConjugatePairs();
	// cpairs: [ value, [cix0, [ac0]], [cix1, [ac1]] ]
	//console.log("cpairs", colorpairs);
	//if (cpairs.length === 0) return null;

	// find all of a value that are part of a conjugate pair
	// valpairs[value]: [cp0, cp1, ... ]
	var redblue = [];
	for (var value=1; value<10; ++value) {
		//if (value !== 3) continue;	// TEST
		var red = [];
		var blue = [];
		var vp = getValuePairs(value);
		if (vp.length === 0) continue;
		//console.log("vp", firstval, vp);
		var firstval = vp[0][1][0];
		var vplen = vp.length;
		if (vplen === 0) {
			redblue.push([value, red, blue]);
			continue;
		}
		red.push(firstval);
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
			if (!added) {
				//console.log(value, red, blue);
				redblue.push([value, red, blue]);
				break;
			}
		}

		// are there any occurances of value in a cell not included in red and blue
		var allvals = findAllCellsWithValue(value);
		var outliers = allvals.filter(f => !red.includes(f) && !blue.includes(f));
		var tgts = [];
		outliers.forEach((o) => {
			var seered = false;
			red.forEach((r) => { if (canSeeEachOtherRC(o,r)) seered = true;})
			var seeblue = false;
			blue.forEach((b) => { if (canSeeEachOtherRC(o,b)) seeblue = true;})
			if (seered && seeblue) tgts.push(o);
		})
		//console.log(value, tgts, red, blue, outliers);
		if (tgts.length > 0) {
			console.log(value, tgts, red, blue, outliers);
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
			colors1.push(h);
		}

	}
	//console.log(redblue);


	if (colors1.length === 0) return null;
	return colors1;

}
