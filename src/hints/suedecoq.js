import { Rows, Cols, Squares, cellRow, cellCol, cellSquare, sqRowCells, sqColCells, sqRows012, sqCols012, RCS } from '/src/utilities/constants';
import { cells, findTargets, findInternalTargets, includesAll, includesAny, sameRow, sameCol } from '/src/hints/hints';
import { getBivaluePairs } from "/src/hints/conjugates";

//*****************************************************************************

export function suedecoq() {

	// for each bivalue cell try to find two other non-diagonal cells containing a total of 4 candidates
	// which include the candidates from the bivalue cell
	let bivals = getBivaluePairs();

	for (const bp of bivals) {
		let bpix = bp[0];
		let bpac = bp[1];
		let bpac0 = bpac[0];
		let bpac1 = bpac[1];
		let bprow = RCS[bpix][0];
		let bpcol = RCS[bpix][1];
		let bpsq = RCS[bpix][2];
		let sqarr = Squares[bpsq];
		for (let i=0; i<9; ++i) {
			let cixi = sqarr[i];
			if (cixi === bpix) continue;
			if (cells[cixi].value > 0) continue;
			let aci = cells[cixi].activecandidates;
			for (let j=i+1; j<9; ++j) {
				let cixj = sqarr[j];
				if (cixj === bpix) continue;
				if (cells[cixj].value > 0) continue;
				let acj = cells[cixj].activecandidates;
				let sqac = new Set();
				aci.forEach(c => sqac.add(c))
				acj.forEach(c => sqac.add(c))
				if (sqac.size !== 4) continue;
				// do we have the candidates
				if (!sqac.has(bpac0)) continue;
				if (!sqac.has(bpac1)) continue;
				// check that they are not in the same row/col
				let row = sameRow([cixi, cixj]);
				let col = sameCol([cixi, cixj]);
				if (!row && !col) continue;		// diagonal
				if (row && row === bprow) continue;
				if (col && col === bpcol) continue;
				// got something
				console.log("sdc", bpix, cixi, cixj, sqac);
				// get the other bivalue we need
				let allac = Array.from(sqac);
				let bpxac = allac.filter(x => !bpac.includes(x));
				if (bpxac.length !== 2) continue;	// not sure I need this
				console.log("next", bpxac);
				// get the row/col we need to search
				if (row)
					var arr = Rows[row];
				else
					var arr = Cols[col];

				let cix = null;
				for (const ix of arr) {
					if (cells[ix].value > 0) continue;
					let acx = cells[ix].activecandidates;
					if (acx.length !== 2) continue;
					if (!includesAll(bpxac, acx)) continue;
					cix = ix;
					break;
				}
				if (!cix) continue;

				console.log("FOUND", cixi, cixj, bpix, cix, bpxac, allac);
				// eliminate bpac from Square

				// eliminate acx from row/col


			}
		}



	}



	return null;
}
