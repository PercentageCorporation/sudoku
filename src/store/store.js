import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { findCandidates, validateBoard, validateManBoard } from "../utilities/utilities";
import { RCS, LinearToGrid } from "../utilities/constants";

// export const ManCell = {
// 	value: 0,
// 	selected: false
// };

export const useManCells = () => useManCellsStore((state) => state.cells);

export const useManCellsStore = create (
	persist (
		(set, get) => ({
			cells: new Array(81).fill(0),
			solution: new Array(81).fill(0),
			number: 0,
			description: "",
			manSelectedCell: -1,
			manGameValid: true,
			initialized: false,

			initialize: () => {
				var init = new Array(81).fill(0);
				var solution = new Array(81).fill(0);
				set({
					cells: init,
					solution: solution,
					number: null,
					description: "New Game",
					selectedCell: -1,
					manGameValid: true,
					initialized: true
				})
			},

			loadManCells: (num, descr, cls, solution) => {
				if (!solution) solution = new Array(81).fill(0);
				set({
					cells: cls,
					solution: solution,
					number: num,
					description: descr,
					selectedCell: -1,
					manGameValid: validateManBoard(cls),
					initialized: true
				})
			},

			loadManSolution: (solution) => {
				set({
					solution: solution,
					selectedCell: -1,
					initialized: true
				})
			},

			validateManGame: () => {
				var cls = get().cells
				var val = validateManBoard(cls);
				set({
					manGameValid: val
				})
				return val;
			},

			getManCells: () => {
				return get().cells
			},

			getManSolution: () => {
				return get().solution
			},

			getManCellsLinear: () => {
				var linear = ""
				var cells = get().cells
				for (var i = 0; i < cells.length; ++i) linear += Number(cells[LinearToGrid[i]])
				return linear
			},

			getManCell: (ix) => {
				return get().cells[ix]
			},

			getManSolutionCell: (ix) => {
				var solution = get().solution;
				if (!solution) return null;
				return solution[ix]
			},

			setManCellValue: (ix, value) => {
				set((state) => {
					const cells = [...state.cells]
					cells[ix] = value
					return {
						cells,
						manGameValid: validateManBoard(cells)
					}
				})
			},

			setManSelectedCell: (ix) => {
				set({ selectedCell: ix })
			},

			setManId: (number, description) => {
				set({
					number: number,
					description: description
				})
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

export const useGameStateStore = create(
	persist(
		(set, get) => ({
			selectedCell: -1,
			selectedValue: -1,
			editCandidates: -1,
			showBivalue: false,
			showConjugates: false,
			numbersUsed: [0,0,0,0,0,0,0,0,0,0],

			resetState: () => {
				set({
					selectedCell: -1,
					selectedValue: -1,
					editCandidates: -1,
					showBivalue: false,
					showConjugates: false,
					numbersUsed: [0,0,0,0,0,0,0,0,0,0]
				})
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

			setEditCandidates: (cix) => {
				set({ editCandidates: cix})
			},

			setShowBivalue: (tf) => {
				set({ showBivalue: tf})
			},

			setShowConjugates: (tf) => {
				set({ showConjugates: tf})
			},

			calcNumbersUsed: () => {
				//console.log("calcNumbersUsed");
				var complete = false;
				var nines = 0;
				var selVal = get().selectedValue;
				const used = [0,0,0,0,0,0,0,0,0,0];
				for (var i = 0; i < 81; ++i) {
					const num = cellStore.get().cells[i].value;
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
						gameComplete: 0,
						selectedValue: selVal
					})
			},
		})
	),
	{
		name: 'sudoku-game-state', // Unique name for the storage item
		storage: createJSONStorage(() => sessionStorage), // Use session storage
	}
);

export const Cell = {
	row: 0,
	col: 0,
	square: 0,
	pairity: 0,				// 0-none, 1-grp 1 odd, 2-grp 1 even, 3-grp 2 odd, 4-grp 2 even
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
			saved: [],
			difficulty: "",
			gameId: "",
			gameValid: true,
			gameComplete: 0,
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
						parity: 0,
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
					useGameStateStore.getState().resetState();
					set({
						cells: initcells,
						saved: [],
						difficulty: difficulty,
						gameId: gameid,
						gameValid: validateBoard(initcells),
						gameComplete: 0,
						gameLoaded: true
					});
					//console.log("cells:", get().cells);
				},

				loadGame: (values, solution, gameId) => {
					const initcells = [];
					//console.log("values:", values);
					for (var i = 0; i < 81; ++i) initcells.push(
					{
						row: RCS[i][0],
						col: RCS[i][1],
						square: RCS[i][2],
						parity: 0,
						value: values[i],
						originalValue: values[i],
						solutionValue: solution ? solution[i] : 0,
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
					useGameStateStore.getState().resetState();
					useHintStore.getState().resetHint();
					set({
						cells: initcells,
						saved: [],
						difficulty: "",
						gameId: gameId,
						gameValid: validateBoard(initcells),
						gameComplete: 0,
						gameLoaded: true,
					}),
					useGameStateStore.getState().clearSelectedCell(),
					useGameStateStore.getState().clearSelectedValue(),
					get().actions.resetCandidates()
				},

				newGame: () => {
					useGameStateStore.getState().resetState();
					useHintStore.getState().resetHint();
					set({
						cells: [],
						saved: [],
						selectedCell: -1,
						selectedValue: -1,
						gameComplete: 0,
						gameLoaded: false
					})
				},

				resetGame: () => {
					const parity = 0;
					set((state) => {
						const cells = [...state.cells]
						for (var ix = 0; ix < 81; ++ix) {
							cells[ix] = {...cells[ix], value: cells[ix].originalValue, noncandidates: [], parity }
						}
						return {
							cells,
							gameValid: validateBoard(cells),
							gameComplete: 0,
							gameLoaded: true,
						}
					}),
					useHintStore.getState().resetHint();
					get().actions.resetCandidates()
					useGameStateStore.getState().resetState()
				},

				saveState: () => {
					set((state) => {
						const saved = [...state.cells]
						return { saved }
					})
				},

				restoreState: () => {
					set((state) => {
						if (state.saved != null) {
							console.log("restoreState")
							const cells = [...state.saved]
							return {
								cells,
								gameComplete: 0,
								gameLoaded: true,
							}
						}
					}),
					get().actions.resetCandidates(),
					useGameStateStore.getState().resetState()
				},

				validateGame: () => {
					var cls = get().cells
					var val = validateBoard(cls);
					set ({
						gameValid: val
					})
					return val;
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
						gameComplete: 0,
						selectedValue: selVal
					})
				},

				resetCandidates: () => {
					set((state) => {
						const cells = [...state.cells]
						for (var ix = 0; ix < 81; ++ix) {
							const candidates = findCandidates(ix, cells);
							// remove any noncandidates not in the actual candidates list
							const noncandidates = cells[ix].noncandidates.filter(c => candidates.includes(c));
							const activecandidates = candidates.filter(c => noncandidates.indexOf(c) < 0);
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
							// remove from noncandidates any value not in the actual candidates list
							const noncandidates = cells[ix].noncandidates.filter(c => candidates.includes(c));
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
						// remove any noncandidates not in the actual candidates list
						const noncandidates = cells[ix].noncandidates.filter(c => candidates.includes(c));
						const activecandidates = candidates.filter(c => noncandidates.indexOf(c) < 0);
						cells[ix] = { ...cells[ix], candidates, activecandidates, noncandidates }
						return { cells }
					})
				},

				cellContainsCandidate: (ix, c) => {
					return get().cells[ix].activecandidates.includes(c);
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
					//console.log("gameComplete");
					const cells = get().cells;
					var alt = false;
					var complete = true;
					for (var i=0; i<81; ++i) {
						const c = cells[i];
						if (c.value === 0) {
							complete = false;
							break;
						}
						if (c.solutionValue > 0 && c.value !== c.solutionValue) alt = true;
					}

					var solved = 0;
					if (complete) {
						solved = 1;
						if (alt) solved = 2;
					}

					set({
						gameComplete: complete
					})
					console.log("gameComplete", solved, complete);
					return solved;
				},

				getLinearText: () => {
					var linear = "";
					var cells = get().cells;
					for (let i = 0; i < 81; i++) {
						var val = cells[LinearToGrid[i]].value;
						linear += Number(val);
					}
					return linear;
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
					set({ gameComplete: tf ? 1 : 0})
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

				setCellParity: (ix, parity) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], parity }
						return { cells }
					})
				},

				clearCellParity: (ix) => {
					set((state) => {
						const cells = [...state.cells]
						cells[ix] = { ...cells[ix], parity: 0 }
						return { cells }
					})
				},

				clearParity: () => {
					set((state) => ({
						cells: state.cells.map((c) => ({
							...c,
							parity: 0
						})),
					}))
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
				saved: state.saved,
				difficulty: state.difficulty,
				gameId: state.gameId,
				gameValid: state.gameValid,
				gameComplete: state.gameComplete,
				gameLoaded: state.gameLoaded
			}),
		}
	)
);

