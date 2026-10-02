import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cellStore, useCellActions, useHintStore, useManCellsStore } from "./store/store";
import { getSSGame } from "./utilities/sudoku-solutions";
import LoadGameModal from "/src/components/LoadGameModal";
import GameGrid from "/src/components/GameGrid";
import PlayMenu from "/src/components/PlayMenu";
import Spinner from "/src/components/Spinner";
import { getGame } from "./utilities/games";

export default function App() {
	const { newGame, resetGame, initGame, loadGame, updateCandidates, saveState, restoreState, getLinearText } = useCellActions();
	const { gameLoaded, difficulty, gameId, saved } = cellStore();
	const [ loadSavedGame, setLoadSavedGame ] = useState(false);
	const { resetHint } = useHintStore();
	const navigate = useNavigate();
	console.log("App", gameLoaded, difficulty, gameId);
	//console.log("saved", saved.length);

	useEffect(() => {
		console.log("App UE");
		async function load_game() {
			//const { game, solution, difficulty } = await getSudokuSoluitons();
			const g = getSSGame();
			//const { game, solution, difficulty } = await getGameDosuku();
			//console.log("game:", g.gameid, g.difficulty)
			console.log(g.values, g.solution, g.difficulty, g.gameid);
			initGame(g.values, g.solution, g.difficulty, g.gameid);
		}

		if (!gameLoaded) load_game();
	}, [gameLoaded]);

	function handleNewGame(e) {
		e.preventDefault();
		newGame();
		navigate("/", { replace: true });
	}

	function handleRestartGame(e) {
		e.preventDefault();
		resetHint();
		resetGame();
		navigate("/", { replace: true });
	}

	function handleSaveGame(e) {
		e.preventDefault();
		saveState();
		navigate("/", { replace: true });
	}

	function handleRestoreGame(e) {
		e.preventDefault();
		restoreState();
		resetHint();
		navigate("/", { replace: true });
	}

	function handleRefreshCandidates(e) {
		e.preventDefault();
		updateCandidates();
		navigate("/", { replace: true });
	}

	function handleManualGame(e) {
		e.preventDefault();
		resetGame();
		navigate("/manual");
	}

	function handleLoadGame(e) {
		e.preventDefault();
		setLoadSavedGame(true);
	}

	function loadConfirm(ix) {
		console.log("load game", ix);
		setLoadSavedGame(false);
		var game = getGame(ix);
		console.log("load game", ix, game.description);
		console.log(game.game);
		if (game) {
			console.log("load game", ix, game.description);
			loadGame(game.game, game.solution, game.description);
			//console.log(getManCellsLinear());
			navigate("/", { replace: true });
		}
	}

	function loadCancel() {
		setLoadSavedGame(false);
	}

	function showLinear(e) {
		e.preventDefault();
		var linear = getLinearText();
		//alert(linear);
		console.log(linear);
		var linearspaces = linear.replaceAll('0', ' ');
		console.log(linearspaces);
	}

	if (!gameLoaded) return <Spinner />;

	return (
		<div className="max-w-[412px] mx-2 select-none">
			{ loadSavedGame && <LoadGameModal onConfirm={loadConfirm} onCancel={loadCancel}/> }
			<div className="mx-2 h-12 flex items-center text-lg font-semibold">
				{difficulty === "" ? `Game: ${gameId}` : `Difficulty: ${difficulty} / Game: ${gameId}`}
			</div>
			<div className="">
				<GameGrid />
			</div>
			<div>
				<PlayMenu />
			</div>
			<div className="flex flex-col justify-between mt-4 text-sm">
				<div className="flex flex-row justify-between">
					<button
						type="button"
						onClick={(e) => handleNewGame(e)}
						className="px-4 py-2 bg-orange-300 rounded hover:cursor-pointer"
					>
						New Game
					</button>
					<button
						type="button"
						onClick={(e) => handleLoadGame(e)}
						className="px-4 py-2 bg-orange-300 rounded hover:cursor-pointer"
					>
						Load Game
					</button>
					<button
						type="button"
						onClick={(e) => handleRestartGame(e)}
						className="px-4 py-2 bg-red-300 rounded hover:cursor-pointer"
					>
						Restart Game
					</button>
				</div>
				<div className="flex flex-row justify-between mt-2">
					<button
						type="button"
						onClick={(e) => handleSaveGame(e)}
						className="px-2 py-2 bg-orange-300 rounded hover:cursor-pointer"
					>
						Save Game State
					</button>
					<button
						type="button"
						disabled={saved.length === 0}
						onClick={(e) => handleRestoreGame(e)}
						className="px-2 py-2 bg-red-300 disabled:bg-red-100 rounded enabled:hover:cursor-pointer"
					>
						Restore Game State
					</button>
				</div>
				<div className="flex flex-row justify-between mt-2">
					<button
						type="button"
						onClick={(e) => handleManualGame(e)}
						className="px-4 py-2 mr-4 bg-blue-300 rounded hover:cursor-pointer"
					>
						Manual Game
					</button>
					<button
						type="button"
						onClick={(e) => handleRefreshCandidates(e)}
						className="px-4 py-2 bg-blue-300 rounded hover:cursor-pointer"
					>
						Refresh Candidates
					</button>
				</div>
				<div className="flex flex-row justify-between mt-2">
					<button
						type="button"
						onClick={(e) => showLinear(e)}
						className="px-4 py-2 mr-4 bg-blue-300 rounded hover:cursor-pointer"
					>
						Show Linear
					</button>
				</div>
			</div>
		</div>
	);
}
