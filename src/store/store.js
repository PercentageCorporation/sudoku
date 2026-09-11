import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { findCandidates } from "../utilities/utilities";
import { RCS } from "../utilities/constants";

// export const ManCell = {
// 	value: 0,
// 	selected: false
// };

export const useManCells = () => useManCellsStore((state) => state.cells);

export const useManCellsStore = create (
	persist (
		(set, get) => ({
			cells: [],
			selectedCell: 0,
			initialized: false,

			initialize: () => {
				var init = [];
				for (var i = 0; i < 81; ++i) init.push(0);
				set({
					cells: init,
					selectedCell: 0,
					initialized: true
				})
			},

			getManCells: () => {
				return get().cells
			},

			getManCell: (ix) => {
				return get().cells[ix]
			},

			setManCellValue: (ix, value) => {
				set((state) => {
					const cells = [...state.cells]
					cells[ix] = value
					return { cells }
				})
			},

			setManSelectedCell: (ix) => {
				set({ selectedCell: ix })
			},

		}),
		{
			name: 'sudoku-game', // Unique name for the storage item
			storage: createJSONStorage(() => sessionStorage), // Use session storage
		}
	)
);

export const Hint = {
	type: null,
	cell: -1,
	row: -1,
	col: -1,
	sq: -1,
	msg: ""
	};

export const useHint = () => useHintStore((state) => state.hint);

export const useHintStore = create (
	(set, get) => ({
		hint: {...Hint},

		getHint: () => {
			return get().hint;
		},

		setHint: (h) => {
			set({ hint: h})
		},

		setHintMsg: (msg) => {
			set({ hint: {...get().hint, msg } })
		},

		resetHint: () => {
			set({ hint: {...Hint}})
		},

	})
);


export const Cell = {
	row: 0,
	col: 0,
	square: 0,
	value: 0,
	originalValue: 0,
	solutionValue: 0,
	candidates: [],
	noncandidates: [],
	activecandidates: [],
};

export const useCells = () => cellStore((state) => state.cells);
export const useCellActions = () => cellStore((state) => state.actions);

export const cellStore = create(
	persist(
		(set, get) => ({
			cells: [],
			selectedCell: -1,
			selectedValue: -1,
			currentValue: -1,
			editCandidates: -1,
			difficulty: "",
			gameId: "",
			numbersUsed: [0,0,0,0,0,0,0,0,0,0],
			gameComplete: false,
			gameLoaded: false,

			actions: {
				initGame: (values, solutionValues, difficulty, gameid) => {
					const initcells = [];
					//console.log("values:", values);
					for (var i = 0; i < 81; ++i) initcells.push(
						{
						row: RCS[i][0],
						col: RCS[i][1],
						square: RCS[i][2],
						value: values[i],
						originalValue: values[i],
						solutionValue: solutionValues[i],
						candidates: [],
						noncandidates: [],
						activecandidates: [],
						});
					for (i = 0; i < 81; ++i) {
						const c = findCandidates(i, initcells);
						initcells[i].candidates = c;
						initcells[i].activecandidates = c;
						};
					//console.log("initcells:", initcells);
					set({
						cells: initcells,
						selectedValue: -1,
						selectedCell: -1,
						currentValue: -1,
						editCandidates: -1,
						difficulty: difficulty,
						gameId: gameid,
						gameComplete: false,
						numbersUsed: [0,0,0,0,0,0,0,0,0,0],
						gameLoaded: true
					});
					//console.log("cells:", get().cells);
				},

				loadGame: (values) => {
					const initcells = [];
					//console.log("values:", values);
					for (var i = 0; i < 81; ++i) initcells.push(
					{
						row: RCS[i][0],
						col: RCS[i][1],
						square: RCS[i][2],
						value: values[i],
						originalValue: values[i],
						solutionValue: 0,
						candidates: [],
						noncandidates: [],
						activecandidates: [],
						selected: false
					});
					for (i = 0; i < 81; ++i) {
						if (initcells[i].value === 0) {
							initcells[i].candidates = findCandidates(i, initcells);
							initcells[i].activecandidates = initcells[i].candidates;
						}
					};
					set({
						cells: initcells,
						selectedCell: -1,
						selectedValue: -1,
						currentValue: -1,
						difficulty: "",
						gameComplete: false,
						gameLoaded: true,
						hint: {...Hint}
					})
				},

				newGame: () => {
					set((state) => ({
						cells: [],
						selectedCell: -1,
						selectedValue: -1,
						currentValue: -1,
						gameComplete: false,
						gameLoaded: false
					}))
				},

				resetGame: () => {
					set((state) => ({
						cells: state.cells.map((c,ix) =>
						ix === ix ?	{...c, ...{value: c.originalValue}} : c
						),
						selectedCell: -1,
						selectedValue: -1,
						currentValue: -1,
						gameComplete: false,
						gameLoaded: true
					})),
					get().actions.clearSelectedCell()
					get().actions.clearSelectedValue()
					get().actions.resetCandidates()
				},

				calcNumbersUsed: () => {
					//console.log("calcNumbersUsed");
					var complete = false;
					var nines = 0;
					var selVal = get().selectedValue;
					const used = [0,0,0,0,0,0,0,0,0,0];
					for (var i = 0; i < 81; ++i) {
						const num = get().cells[i].value;
						if (num > 0) used[num] += 1;
						if (used[num] === 9) nines += 1;
					};
					used[0] = nines;
					if (nines == 9) {
						selVal = -1;
						complete = true;
					}
					set({
						numbersUsed: used,
						gameComplete: complete,
						selectedValue: selVal
					})
				},

				resetCandidates: () => {
					set((state) => {
						const noncandidates = [];
						const cells = [...state.cells]
						for (var ix = 0; ix < 81; ++ix) {
							const candidates = findCandidates(ix, cells);
							const activecandidates = candidates;
							cells[ix] = { ...cells[ix], candidates, activecandidates, noncandidates }
						}
						return { cells }
					})
				},

				updateCandidates: () => {
					set((state) => {
						const cells = [...state.cells]
						for (var ix = 0; ix < 81; ++ix) {
							const candidates = findCandidates(ix, cells);
							const noncandidates = cells[ix].noncandidates.filter(c => candidates.indexOf(c) < 0);
							const activecandidates = candidates.filter(c => noncandidates.indexOf(c) < 0);
							cells[ix] = { ...cells[ix], candidates, activecandidates, noncandidates }
						}
						return { cells }
					})
				},

				updateCellCandidates: (ix) => {
					set((state) => {
						const cells = [...state.cells]
						const candidates = findCandidates(ix, cells);
						const noncandidates = [];
						const activecandidates = candidates;
						cells[ix] = { ...cells[ix], candidates, activecandidates, noncandidates }
						return { cells }
					})
				},

				getActiveCandidates: (ix) => {
					return get().cells[ix].activecandidates;
				},

				getNonCandidates: (ix) => {
					return get().cells[ix].noncandidates;
				},

				setNonCandidates: (ix, noncandidates) => {
					set((state) => {
						const cells = [...state.cells]
						const activecandidates = cells[ix].candidates.filter(c => noncandidates.indexOf(c) < 0);
						cells[ix] = { ...cells[ix], noncandidates, activecandidates }
						return { cells }
					})
				},

				addNonCandidate: (ix, value) => {
					set((state) => {
						const cells = [...state.cells]
						if (!cells[ix].noncandidates.includes(value)) {
							const noncandidates = [...cells[ix].noncandidates, value]
							const activecandidates = cells[ix].candidates.filter(c => noncandidates.indexOf(c) < 0);
							cells[ix] = {
								...cells[ix],
								noncandidates,
								activecandidates
							}
						}
						return { cells }
					})
				},

				removeNonCandidate: (ix, value) => {
					set((state) => {
						const cells = [...state.cells]
						if (cells[ix].noncandidates.includes(value)) {
							const noncandidates = cells[ix].noncandidates.filter(v != value)
							const activecandidates = cells[ix].candidates.filter(c => noncandidates.indexOf(c) < 0);
							cells[ix] = {
								...cells[ix],
								noncandidates,
								activecandidates
							}
						}
						return { cells }
					})
				},

				// -1: still in progress
				//  0: finished
				//  1: finished, alternate solution
				checkGameSolved: () => {
					console.log("gameComplete");
					const cells = get().cells;
					var alt = false;
					var solved = true;
					for (var i=0; i<81; ++i) {
						const c = cells[i];
						if (c.value === 0) {
							solved = false;
							break;
						}
						if (c.solutionValue > 0 && c.value !== c.solutionValue) alt = true;
					}

					var s = 0;
					if (!solved) {
						s = 1;
						if (alt) s = 2;
					}

					set({
						gameComplete: s
					})
				},

				getCells: () => {
					return get().cells
				},

				getCell: (ix) => {
					return get().cells[ix]
				},

				showCell: (ix) => {
					const c = get().cells[ix];
					console.log("showCell:", ix, c);
				},

				setGameSolved: (tf) => {
					set({ gameComplete: tf})
				},

				setEditCandidates: (cix) => {
					set({ editCandidates: cix})
				},

				setSelectedValue: (sel) => {
					set({ selectedValue: sel})
				},

				clearSelectedValue: () => {
					set({ selectedValue: -1})
				},

				setSelectedCell: (sel) => {
					set({ selectedCell: sel})
				},

				clearSelectedCell: () => {
					set({ selectedCell: -1})
				},

				setCellCandidates: (ix, candidates) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], candidates }
						return { cells }
					})
				},

				clearCellSelected: (ix) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], selected: false }
						return { cells }
					})
				},

				setCellValue: (ix, value) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], value }
						return { cells }
					}),
					get().actions.updateCandidates()
				},

				clearCellValue: (ix) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], value: 0 }
						get().actions.updateCandidates()
						return { cells }
					})
				},

				// cells[(y*9)+x].value = value;
				setCellValues: (values) => {
					set((state) => ({
						cells: state.cells.map((c,ix) => ({
							...c,
							value: values[ix]
						})),
						gameLoaded: true
					}))
				},

				setDifficulty: (d) => {
					set({ difficulty: d})
				},

				getDifficulty: () => {
					return get().difficulty
				},

				setGameId: (d) => {
					set({ gameId: d})
				},

				getGameId: () => {
					return get().gameId
				},

			}
		}),
		{
			name: "sudoku-pc", // Use a unique name for each person
			partialize: (state) => ({ 
				cells: state.cells,
				selectedValue: state.selectedValue,
				currentValue: state.currentValue,
				editCandidates: state.editCandidates,
				numbersUsed: state.numbersUsed,
				gameComplete: state.gameComplete,
				gameLoaded: state.gameLoaded
			}),
		}
	)
);

