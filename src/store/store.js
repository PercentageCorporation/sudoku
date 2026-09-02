import { create } from "zustand";
import { persist } from "zustand/middleware";

export const Cell = {
	value: 0,
	originalValue: 0,
	solutionValue: 0,
	candidates: []
	};

export const cellStore = create(
	persist(
		(set, get) => ({
			cells: [],
			selectedCell: -1,
			selectedValue: -1,
			currentValue: -1,
			gameSolved: false,
			cellsLoaded: false,

			initCells: (values, solutionValues) => {
				const initcells = [];
				for (var i = 0; i < 81; ++i) initcells.push(
					{
						value: values[i],
						originalValue: values[i],
						solutionValue: solutionValues[i],
						candidates: []
					});
				//console.log("initcells:", initcells);
				set({
					cells: initcells,
					currentCell: -1,
					gameSolved: false,
					cellsLoaded: true
				});
			},

			newGame: () => {
				set({
					cells: [],
					selectedCell: -1,
					selectedValue: -1,
					currentValue: -1,
					gameSolved: false,
					cellsLoaded: false
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
					gameSolved: false,
					cellsLoaded: true
				}))
			},

			updateGS: (tf) => {
				set({ gameSolved: tf})
			},

			getCell: (ix) => {
				//console.log("getCell:", ix);
				return get().cells[ix]
			},

			setSelectedValue: (sel) => {
				set({ selectedValue: sel})
			},

			setSelectedCell: (sel) => {
				//console.log("setSelectedCell:", sel);
				set({ selectedCell: sel})
			},

			// cells[(y*9)+x].value = value;
			setCellValue: (ix, value) => {
				set((state) => ({
					cells: state.cells.map((c,iy) => (
						ix === iy ?	{...c, value: value} :	c
					))
				}))
			},

			// cells[(y*9)+x].value = value;
			setCellValues: (values) => {
				set((state) => ({
					cells: state.cells.map((c,ix) => ({
						...c,
						value: values[ix]
					})),
					cellsLoaded: true
				}))
			}
		})
	),
	{
		name: "sudoku-pc", // Use a unique name for each person
		getStorage: () => localStorage, // Default storage
	},
);
