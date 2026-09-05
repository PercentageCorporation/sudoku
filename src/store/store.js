import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { findCandidates } from "../utilities/utilities";

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
	value: 0,
	originalValue: 0,
	solutionValue: 0,
	candidates: [],
	noncandidates: [],
	selected: false,
};

export const useCells = () => cellStore((state) => state.cells);
export const useCellActions = () => cellStore((state) => state.actions);

export const cellStore = create(
	persist(
		(set, get) => ({
			cells: [],
			selectedValue: -1,
			currentValue: -1,
			editCandidates: -1,
			difficulty: "",
			numbersUsed: [0,0,0,0,0,0,0,0,0,0],
			gameComplete: false,
			gameLoaded: false,

			actions: {
				initGame: (values, solutionValues, difficulty) => {
					const initcells = [];
					//console.log("values:", values);
					for (var i = 0; i < 81; ++i) initcells.push(
						{
						value: values[i],
						originalValue: values[i],
						solutionValue: solutionValues[i],
						candidates: [],
						noncandidates: [],
						selected: false
						});
					for (i = 0; i < 81; ++i) {
						initcells[i].candidates = findCandidates(i, initcells);
						};
					//console.log("initcells:", initcells);
					set({
						cells: initcells,
						selectedValue: -1,
						currentValue: -1,
						editCandidates: -1,
						difficulty: difficulty,
						gameComplete: false,
						numbersUsed: [0,0,0,0,0,0,0,0,0,0],
						gameLoaded: true
					});
					//console.log("cells:", get().cells);
				},

				newGame: () => {
					set({
						cells: [],
						selectedCell: -1,
						selectedValue: -1,
						currentValue: -1,
						difficulty: "",
						gameComplete: false,
						gameLoaded: false,
						hint: {...Hint}
					})
				},

				loadGame: (values) => {
					const initcells = [];
					//console.log("values:", values);
					for (var i = 0; i < 81; ++i) initcells.push(
					{
						value: values[i],
						originalValue: values[i],
						solutionValue: 0,
						candidates: [],
						noncandidates: [],
						selected: false
					});
					for (i = 0; i < 81; ++i) {
						initcells[i].candidates = findCandidates(i, initcells);
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
					}))
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

				updateCandidates: () => {
					set((state) => {
						const cells = [...state.cells]
						for (var ix = 0; ix < 81; ++ix) {
							const candidates = findCandidates(ix, cells);
							cells[ix] = { ...cells[ix], candidates }
						}
						return { cells }
					})
				},

// 				updateCandidates: () => {
// 					const cptr = get().cells;
// 					for (var ix = 0; ix < 81; ++ix) {
// 						const candid = findCandidates(ix, cptr);
// 						set((state) => ({
// 							cells: state.cells.map((c,iy) => (
// 								ix === iy ?	{...c, candidates: candid} :	c
// 							))
// 						}))
// 					};
// 				},
//
				getNonCandidates: (ix) => {
					return get().cells[ix].noncandidates;
				},

				setNonCandidates: (ix, noncandidates) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], noncandidates }
						return { cells }
					})
				},

				addNonCandidate: (ix, value) => {
					set((state) => {
						const cells = [...state.cells]
						if (!cells[ix].noncandidates.includes(value)) {
							cells[ix] = {
								...cells[ix],
								noncandidates: [...cells[ix].noncandidates, value]
							}
						}
						return { cells }
					})
				},

				removeNonCandidate: (ix, value) => {
					set((state) => {
						const cells = [...state.cells]
						if (cells[ix].noncandidates.includes(value)) {
							cells[ix] = {
								...cells[ix],
								noncandidates: [...cells[ix].noncandidates.filter(v != value)]
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
					//console.log("getCell:", ix);
					return get().cells[ix]
				},

				setGameSolved: (tf) => {
					set({ gameComplete: tf})
				},

				setEditCandidates: (cix) => {
					set({ editCandidates: cix})
				},

				clearSelected: () => {
					set((state) => ({
						cells: state.cells.map((c) => ({
							...c, selected: false
						}))
					}))
				},

				getSelected: () => {
					var selected = [];
					const { cells } = get();
					for (var i=0; i<81; ++i) {
						const c = cells[i];
						if (c.selected) selected.push(i);
					}
					return selected;
				},

				setSelectedValue: (sel) => {
					set({ selectedValue: sel})
				},

				setCellCandidates: (ix, candidates) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], candidates }
						return { cells }
					})
				},

				setCellSelected: (ix) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], selected: true }
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
				}
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

