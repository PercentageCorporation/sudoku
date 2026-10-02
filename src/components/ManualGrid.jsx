import "/src/styles/borders.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCellActions, useManCellsStore, useHintStore } from "/src/store/store";
import { LRUD, bstyles } from "/src/utilities/constants";
import LoadGameModal from "/src/components/LoadGameModal";
import { deleteGame, getGame, saveGame, linearTextToGrid } from "../utilities/games";
import SaveGameModal from "./SaveGameModal";
import ConfirmModal from "./ConfirmModal";
import SeedGameModal from "./SeedGameModal";

function ManualCell({ix}) {
	const { getManCell, getManSolutionCell, selectedCell, setManSelectedCell } = useManCellsStore();
	const cell = getManCell(ix);
	const solution = getManSolutionCell(ix);
	const val = (cell && cell > 0) ? cell : null;
	const sol = (solution && solution > 0) ? solution : null;
	const cn = (ix === selectedCell) ? " bg-green-300" : "";
	const bs = bstyles[ix];
	const cix = ix;
	function selectCell(e, cix) {
		//console.log("selectCell:", cix);
		setManSelectedCell(cix);
	}

	return (
		<div
			id={ix}
			className={"relative z-0 size-11 " + cn + bs}
			onClick={(e)=>selectCell(e, ix)}
			>
			<div className="flex pl-0.5 text-[10px]">
				{cix}
			</div>
			<div className="absolute right-0 bottom-0 pr-0.5 text-[10px]">
				{sol}
			</div>
			<div className="flex justify-center items-center text-3xl font-bold absolute inset-0">
				{val}
			</div>
		</div>
	);
}

function ManualGrid9({y}) {
	//console.log("Grid9:", y);
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	return (
		<>
		<div className="grid grid-cols-3 w-full border-black-300 ">
		{
			index.map((x, ix) => {
				const cellIx = (y*9) + x;
				return (<ManualCell key={ix} ix={cellIx} />)
			})
		}
		</div>
		</>
	);
}

export default function ManualGrid() {
	const navigate = useNavigate();
	const { initialized, initialize } = useManCellsStore();
	const { number: manNumber, description: manDescription } = useManCellsStore();
	const { setManSelectedCell, setManCellValue, getManCells, getManSolution, setManId, loadManCells, loadManSolution, getManCellsLinear } = useManCellsStore();
	const { resetHint } = useHintStore();
	const { loadGame } = useCellActions();

	const [ loadSavedGame, setLoadSavedGame ] = useState(false);
	const [ seedGame, setSeedGame ] = useState(false);
	const [ saveManGame, setSaveManGame ] = useState(false);
	const [ addSolution, setAddSolution ] = useState(false);
	const [ deleteId, setDeleteId ] = useState(null);
	//console.log("ManGrid", selectedCell);

	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	const modalOpen = loadSavedGame || saveManGame || deleteId !== null;

	function handleKeyDown(e)  {
		const sel = useManCellsStore.getState().selectedCell;
		var char = null;
		var lrud = sel >= 0 ? LRUD[sel] : -1;
		var next = -1;
		const key = e.key;
		if (key.length === 1) char = key[0];

		//console.log("key:", key);
		switch (e.key) {
			case " ":
				if (sel >= 0) setManCellValue(sel, 0);
				next = lrud[1];
			//console.log("right", sel, next);
			break;

			case "ArrowLeft":
				next = lrud[0];
				//console.log("left", sel, next);
				break;

			case "ArrowRight":
				next = lrud[1];
				//console.log("right", sel, next);
				break;

			case "ArrowUp":
				next = lrud[2];
				//console.log("up", sel, next);
				break;

			case "ArrowDown":
				next = lrud[3];
				//console.log("down", sel, next);
				break;

			case "Home":
				next = 0;
				break;

			case "End":
				next = 80;
				break;

			case "Tab":
				// ignore
				break;

			default:
				if (char && char >= '0' && char <= '9') {
					const val = Number(char);
					//console.log("KeyDown:", sel, val);
					if (sel >= 0) {
						setManCellValue(sel, val)
						next = lrud[1];
					}

				}
				break;
		}
		if (next >= 0) setManSelectedCell(next);
	};

	useEffect(() => {
		if (!modalOpen) {addEventListener("keydown", handleKeyDown)};
		if (!initialized) initialize();

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [modalOpen]);

	function returnToGame(e) {
		e.preventDefault();
		navigate('/');
	}

	function handleSaveGame(e, description) {
		e.preventDefault();
		setSaveManGame(true);
	}

	function handleClear(e) {
		e.preventDefault();
		console.log("handleClear");
		initialize();
	}

	function handlePlay(e) {
		e.preventDefault();
		console.log("handlePlay");
		const mc = getManCells();
		const sc = getManSolution();
		//console.log("handlePlay", mc);
		loadGame(mc, sc,  manDescription);	// load live game
		resetHint();
		navigate('/');
	}

	function handleLoadGame(e) {
		e.preventDefault();
		setLoadSavedGame(true);
	}

	function handleSaveGame(e) {
		e.preventDefault();
		setSaveManGame(true);
	}

	function handleDeleteGame(e) {
		e.preventDefault();
		if (!manNumber) return;
		var content =	`${manNumber} : ${manDescription}`;
		setDeleteId({number: manNumber, title: "Delete Game", content: content})
	}

	function handleSeedGame(e) {
		e.preventDefault();
		setSeedGame(true)
	}

	function handleReadGame(e) {
		e.preventDefault();
		var input = document.createElement('input');
		input.type = 'file';
		input.onchange = e => {
			// getting a hold of the file reference
			var filename = e.target.value.split('\\').pop().split('/').pop().split('.')[0];
			console.log("filename:", filename);
			var file = e.target.files[0];
			// setting up the reader
			var reader = new FileReader();
			reader.readAsText(file,'UTF-8');
			// here we tell the reader what to do when it's done reading...
			reader.onload = readerEvent => {
				var gamecells = readerEvent.target.result; // this is the content!
				if (gamecells.length != 81) {
					alert("Import not correct length");
					return;
				}
				var grid = linearTextToGrid(gamecells);
				console.log(grid);
				loadManCells("", filename, grid, null);
				useManCellsStore.persist.rehydrate();
				navigate("/manual");
			}
		}
		input.click();
	}

	function handleExportGames(e) {
		e.preventDefault();
		var filename = "sudoku.games";
		var lcgames = localStorage.getItem('sudoku-games');
		var file = new Blob([lcgames], {type: 'text/plain'});
		var a = document.createElement("a"),
			url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0); 	}

	function handleAddSolution(e) {
		e.preventDefault();
		setAddSolution(true);
	}

	function solutionCancel() {
		setAddSolution(false);
	}

	function solutionConfirm(solution) {
		console.log("seedGame");
		console.log(solution);
		setAddSolution(false);
		var grid = linearTextToGrid(solution);
		console.log(grid);
		loadManSolution(grid);
		useManCellsStore.persist.rehydrate();
		navigate("/manual");

		setAddSolution(false);
	}

	function loadConfirm(ix) {
		console.log("load game", ix);
		setLoadSavedGame(false);
		var game = getGame(ix);
		console.log("load game", ix, game.description);
		console.log(game.game);
		if (game) {
			console.log("load game", ix, game.description);
			loadManCells(game.number, game.description, game.game, game.solution);
			useManCellsStore.persist.rehydrate();
			//console.log(getManCellsLinear());
		}
		navigate("/manual");
	}

	function loadCancel() {
		setLoadSavedGame(false);
	}

	function saveConfirm(description) {
		//lcSaveGame(description);
		setSaveManGame(false);
		var cls = getManCells();
		var solution = getManSolution();
		console.log("save game", description, cls, solution);

		var number = saveGame(description, cls, solution);
		setManId(number, description);
		useManCellsStore.persist.rehydrate();
	}

	function saveCancel() {
		setSaveManGame(false);

	}

	function deleteConfirm() {
		deleteGame(deleteId.number);
		initialize();
		setDeleteId(null);
	}

	function deleteCancel() {
		setDeleteId(null);
	}

	function seedConfirm(gamecells) {
		console.log("seedGame");
		console.log(gamecells);
		setSeedGame(false);
		var grid = linearTextToGrid(gamecells);
		console.log(grid);
		loadManCells("", "Imported Game", grid, null);
		useManCellsStore.persist.rehydrate();
		navigate("/manual");
	}

	function seedCancel() {
		setSeedGame(false);
	}

	return (
		<div className="max-w-[412px] mx-2 ">
			<div>
			{ seedGame && <SeedGameModal title="Paste Game" onConfirm={seedConfirm} onCancel={seedCancel}/> }
			{ addSolution && <SeedGameModal title="Paste Solution" onConfirm={solutionConfirm} onCancel={solutionCancel}/> }
			{ loadSavedGame && <LoadGameModal onConfirm={loadConfirm} onCancel={loadCancel}/> }
			{ saveManGame && <SaveGameModal description={manDescription} onConfirm={saveConfirm} onCancel={saveCancel}/> }
			{ deleteId && <ConfirmModal title={deleteId.title} content={deleteId.content} onConfirm={deleteConfirm} onCancel={deleteCancel}/> }
			</div>
			<div className="mx-2 h-12 flex items-center text-lg font-semibold">
				{manNumber ? `${manNumber} : ${manDescription}` :  `${manDescription}`}
			</div>
			<div className="px-1 grid grid-cols-3 w-full border-black-300 bg-white">
			{
				index.map((y, ix) => { return (<ManualGrid9 key={ix} y={y} />) })
			}
			</div>
			<div className="mt-4 text-sm font-normal">
				<div className="mx-2 flex flex-row justify-between mt-4">
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleClear(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Clear Board
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handlePlay(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Play Game
					</button>
				</div>
				<div className="mx-2 flex flex-row justify-between mt-4">
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => returnToGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Return to Game
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleSeedGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Seed Game
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleReadGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Read Game
					</button>
				</div>
				<div className="mx-2 flex flex-row justify-between mt-4">
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleSaveGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Save Game
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleLoadGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Load Saved Game
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleDeleteGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Delete Game
					</button>
				</div>
				<div className="mx-2 flex flex-row justify-between mt-4">
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleExportGames(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Export Games
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleImportGame(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Import Games
					</button>
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleAddSolution(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Add Solution
					</button>
				</div>
				<div className="mx-2 flex flex-row justify-between mt-4">
					<button
						type="button"
						tabIndex={-1}
						onClick={(e) => handleNumberGrid(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
						>
						Number Grid
					</button>
				</div>
			</div>
		</div>
	);
}
