import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cellStore, useCellActions, useHintStore } from "./store/store";
import GameGrid from "./components/GameGrid";
import PlayMenu from "./components/PlayMenu";
import Spinner from "./components/Spinner";
import { getSSGame } from "./utilities/sudoku-solutions";
import { gridToLinearText } from "./utilities/utilities";

export default function App() {
	const { newGame, resetGame, initGame, updateCandidates, saveState, restoreState } = useCellActions();
	const { gameLoaded, difficulty, gameId, cells, saved } = cellStore();
	const { resetHint } = useHintStore();
	const navigate = useNavigate();
	console.log("App", gameLoaded, difficulty, gameId);
	console.log("saved", saved.length);

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

	function showLinear(e) {
		e.preventDefault();
		var linear = gridToLinearText(cells);
		alert(linear);
		console.log(linear);
	}

	if (!gameLoaded) return <Spinner />;

	return (
		<div className="max-w-[412px] mx-2 select-none">
			{`Difficulty: ${difficulty} / Game: ${gameId}`}
			<div>
			</div>
			<div className="mt-4">
				<GameGrid />
			</div>
			<div>
				<PlayMenu />
			</div>
			<div className="flex flex-row justify-between mt-4 text-lg">
				<button
					type="button"
					onClick={(e) => handleNewGame(e)}
					className="px-4 py-2 bg-orange-300 rounded hover:cursor-pointer"
				>
					New Game
				</button>
				<button
					type="button"
					onClick={(e) => handleRestartGame(e)}
					className="mx-4 px-4 py-2 bg-red-300 rounded hover:cursor-pointer"
				>
					Restart Game
				</button>
			</div>
			<div className="flex flex-row justify-between mt-4 text-lg">
				<button
					type="button"
					onClick={(e) => handleSaveGame(e)}
					className="px-4 py-2 bg-orange-300 rounded hover:cursor-pointer"
				>
					Save Game
				</button>
				<button
					type="button"
					disabled={saved.length === 0}
					onClick={(e) => handleRestoreGame(e)}
					className="mx-4 px-4 py-2 bg-red-300 disabled:bg-red-100 rounded enabled:hover:cursor-pointer"
				>
					Restore Game
				</button>
			</div>
			<div className="flex flex-row justify-between mt-4 text-lg">
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
			<div className="flex flex-row justify-between mt-4 text-sm">
				<button
					type="button"
					onClick={(e) => showLinear(e)}
					className="px-4 py-2 mr-4 bg-blue-300 rounded hover:cursor-pointer"
				>
					Show Linear
				</button>
			</div>
		</div>
		);
}
