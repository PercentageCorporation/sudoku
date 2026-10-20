import { Rows, Cols, Squares, RCS } from '/src/utilities/constants';
import { cells, findTargetsInHouses, includesAll, sameRow2, sameCol2, sameRow3, sameCol3 } from '/src/hints/hints';
import { getBivaluePairs } from "/src/hints/conjugates";

//*****************************************************************************

export function suedecoq() {
	var result = suedecoqII();
	if (result) return result;

	var result = suedecoqI();
	if (result) return result;

	return null;
}

function suedecoqI() {
		// for each bivalue cell try to find two other non-diagonal cells containing a total of 4 candidates
	// which include the candidates from the bivalue cell
	let bivals = getBivaluePairs();

	for (const bp of bivals) {
		// get the bivalue characteristics
		let bpix = bp[0];
		let bpac = bp[1];
		let bpac0 = bpac[0];
		let bpac1 = bpac[1];
		let bprow = RCS[bpix][0];
		let bpcol = RCS[bpix][1];
		let bpsq = RCS[bpix][2];
		let sqarr = Squares[bpsq];
		// search for the intersection cells
		// two cells in the square in the same row or column with a total of four candidates
		for (let i=0; i<9; ++i) {
			let cixi = sqarr[i];
			if (cixi === bpix) continue;	// skip the other block cell
			if (cells[cixi].value > 0) continue;
			for (let j=i+1; j<9; ++j) {
				let cixj = sqarr[j];
				if (cixj === bpix) continue;	// skip the other block cell
				if (cells[cixj].value > 0) continue;

				// get all of the candidates
				let aci = cells[cixi].activecandidates;
				let acj = cells[cixj].activecandidates;
				let sqac = new Set();
				aci.forEach(c => sqac.add(c))
				acj.forEach(c => sqac.add(c))
				if (sqac.size !== 4) continue;	// we are looking for four

				// are the bivalue candidates included in the collection
				if (!sqac.has(bpac0)) continue;
				if (!sqac.has(bpac1)) continue;

				// the intersection cells must be in the same row/col
				let row = sameRow2(cixi, cixj);
				let col = sameCol2(cixi, cixj);
				if (!row && !col) continue;		// diagonal
				// cannot be in same row/col as bivalue cell
				if (row && row === bprow) continue;
				if (col && col === bpcol) continue;

				// found intersection cells
				console.log("sdc", bpix, cixi, cixj, sqac);
				// look for the other bivalue we need

				// get the other bivalue candidates we are looking for
				let allac = Array.from(sqac);
				let bpxac = allac.filter(x => !bpac.includes(x));
				if (bpxac.length !== 2) continue;	// not sure I need this
				console.log("next", bpxac);

				// get the row/col we need to search
				if (row)
					var arr = Rows[row];
				else
					var arr = Cols[col];

				// search the row/col for a matching bivalue cell
				let cix = null;
				for (const ix of arr) {
					if (ix === cixi || ix === cixj) continue;	// skip the intersection cells
					if (bpsq === RCS[ix][2]) continue;			// cannot be in the intersection square
					if (cells[ix].value > 0) continue;
					let acx = cells[ix].activecandidates;
					if (acx.length !== 2) continue;
					if (!includesAll(bpxac, acx)) continue;
					cix = ix;
					break;
				}
				if (!cix) continue;	// no luck

				console.log("FOUND", cixi, cixj, bpix, cix, bpac, bpxac, allac);
				// look for cells in the square containing any of the square bivalue candidates
				let tgtss = findTargetsInHouses(bpac, [-1,-1,bpsq], [cixi, cixj, bpix])
				// look for cells in the row/col containing any of the alternate bivalue candidates
				let house = row ? [row,-1,-1] : [-1,col,-1];
				let tgtsrc = findTargetsInHouses(bpxac, house, [cixi, cixj, cix])

				console.log("tgts", tgtss, bpac, tgtsrc, bpxac);
				if (tgtss || tgtsrc) {
					let targets = tgtss ? [...tgtss] : [];
					if (tgtsrc) targets = [...targets, ...tgtsrc];
					let values = allac;
					let targetlist = [];
					if (tgtss) targetlist.push([tgtss, bpac]);
					if (tgtsrc) targetlist.push([tgtsrc, bpxac]);

					let h = {
						type: 'sdc',
						rows: null,
						cols: null,
						square: null,
						cells0: [cixi, cixj],
						cells1: [bpix, cix],
						values: values,
						targets: targets,
						targetlist: targetlist,
						msg: `SuedeCoq I: Cells: ${targets}, Value: ${values}`
					}
					return [h];
				}
			}
		}
	}

	return null;
}

//*****************************************************************************

function suedecoqII() {
	// for each bivalue cell try to find three other non-diagonal cells containing a total of 4 candidates
	// which include the candidates from the bivalue cell
	let bivals = getBivaluePairs();

	for (const bp of bivals) {
		// get the bivalue characteristics
		let bpix = bp[0];
		let bpac = bp[1];
		let bpac0 = bpac[0];
		let bpac1 = bpac[1];
		let bprow = RCS[bpix][0];
		let bpcol = RCS[bpix][1];
		let bpsq = RCS[bpix][2];
		let sqarr = Squares[bpsq];
		// search for the intersection cells
		// three cells in the square in the same row or column with a total of five candidates
		for (let i=0; i<9; ++i) {
			let cixi = sqarr[i];
			if (cixi === bpix) continue;	// skip the other block cell
			if (cells[cixi].value > 0) continue;
			for (let j=i+1; j<9; ++j) {
				let cixj = sqarr[j];
				if (cixj === bpix) continue;	// skip the other block cell
				if (cells[cixj].value > 0) continue;
				for (let k=j+1; k<9; ++k) {
					let cixk = sqarr[k];
					if (cixk === bpix) continue;	// skip the other block cell
					if (cells[cixk].value > 0) continue;

					// get all of the candidates
					let aci = cells[cixi].activecandidates;
					let acj = cells[cixj].activecandidates;
					let ack = cells[cixk].activecandidates;
					let sqac = new Set();
					aci.forEach(c => sqac.add(c))
					acj.forEach(c => sqac.add(c))
					ack.forEach(c => sqac.add(c))
					if (sqac.size !== 5) continue;	// we are looking for four

					// are the bivalue candidates included in the collection
					if (!sqac.has(bpac0)) continue;
					if (!sqac.has(bpac1)) continue;

					// the intersection cells must be in the same row/col
					let row = sameRow3(cixi, cixj, cixk);
					let col = sameCol3(cixi, cixj, cixk);
					if (!row && !col) continue;		// diagonal
					// cannot be in same row/col as bivalue cell
					if (row && row === bprow) continue;
					if (col && col === bpcol) continue;

					// found intersection cells
					console.log("sdcII", bpix, cixi, cixj, cixk, sqac);
					// look for the other bivalue we need

					// get the other candidates we are looking for
					let allac = Array.from(sqac);
					let bp3ac = allac.filter(x => !bpac.includes(x));	// there are three possible candidates
					console.log("next", bp3ac);

					// get the row/col we need to search
					if (row)
						var arr = Rows[row];
					else
						var arr = Cols[col];

					// search the row/col for a matching bivalue cell
					let cix = null;
					let acx = null;
					for (const ix of arr) {
						if (ix === cixi || ix === cixj) continue;	// skip the intersection cells
						if (bpsq === RCS[ix][2]) continue;			// cannot be in the intersection square
						if (cells[ix].value > 0) continue;
						acx = cells[ix].activecandidates;
						if (acx.length !== 2) continue;
						if (!includesAll(bp3ac, acx)) continue;
						cix = ix;
						break;
					}
					if (!cix) continue;	// no luck
					// we have an extra candidate, which is it
					let xc = bp3ac.filter(x => !acx.includes(x));	// there are three possible candidates
					let xc0 = [xc[0]]
					let xc1 = [xc[0]]
					bpac.forEach(c => xc0.push(c));	// combine extra candidate for target search
					acx.forEach(c => xc1.push(c));	// combine extra candidate for target search
					console.log("FOUND II", cixi, cixj, bpix, cix, xc, xc0, xc1, bp3ac, allac);

					// look for cells in the square containing any of the square bivalue candidates
					let tgtss = findTargetsInHouses(xc0, [-1,-1,bpsq], [cixi, cixj, cixk, bpix])
					// look for cells in the row/col containing any of the alternate bivalue candidates
					let house = row ? [row,-1,-1] : [-1,col,-1];
					let tgtsrc = findTargetsInHouses(xc1, house, [cixi, cixj, cixk, cix])

					console.log("tgts", tgtss, xc0, tgtsrc, xc1);
					if (tgtss || tgtsrc) {
						let targets = tgtss ? [...tgtss] : [];
						if (tgtsrc) targets = [...targets, ...tgtsrc];
						let values = allac;
						let targetlist = [];
						if (tgtss) targetlist.push([tgtss, xc0]);
						if (tgtsrc) targetlist.push([tgtsrc, xc1]);

						let h = {
							type: 'sdc',
							rows: null,
							cols: null,
							square: null,
							cells0: [cixi, cixj, cixk],
							cells1: [bpix, cix],
							values: values,
							targets: targets,
							targetlist: targetlist,
							msg: `SuedeCoq II: Cells: ${targets}, Value: ${values}`
						}
						return [h];
					}
				}
			}
		}
	}

	return null;
}
