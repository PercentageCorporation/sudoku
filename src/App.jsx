import { useEffect } from "react";
import { useNavigate } from  "react-router-dom";
import { cellStore, useCellActions, useManCellsStore } from "./store/store";
import GameGrid from "./components/GameGrid";
import PlayMenu from "./components/PlayMenu";
import Spinner from "./components/Spinner";
import { getSSGame, getSudokuSoluitons } from "./utilities/sudoku-solutions";
import { getGameDosuku } from "./utilities/sudokuApi";

export default function App() {
  const { newGame, resetGame, initGame, loadGame } = useCellActions();
  const { gameLoaded, difficulty, gameId } = cellStore();
  const { getManCells } = useManCellsStore();
  const navigate = useNavigate();
  console.log("App", gameLoaded);

  useEffect(() => {
    console.log("App UE");
    async function load_game() {
		//const { game, solution, difficulty } = await getSudokuSoluitons();
		const g = getSSGame();
		//const { game, solution, difficulty } = await getGameDosuku();
		console.log("game:", g.gameid, g.difficulty)
		//console.log(game, solution, difficulty);
		initGame(g.values, g.solution, g.difficulty, g.gameid);
    }

    if (!gameLoaded) load_game();
  }, [gameLoaded]);

  function handleNewGame(e) {
    e.preventDefault();
	newGame();
    navigate("/");
  }

  function handleRestartGame(e) {
    e.preventDefault();
    resetGame();
	navigate("/");
  }

  function handleManualGame(e) {
	  e.preventDefault();
	  resetGame();
	  navigate("/manual");
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
      <div className="flex flex-row justify-between mt-4">
        <button
          type="button"
          onClick={(e) => handleNewGame(e)}
          className="px-4 py-2 text-xl font-bold bg-orange-300 rounded hover:cursor-pointer"
        >
          New Game
        </button>
        <button
          type="button"
          onClick={(e) => handleRestartGame(e)}
          className="mx-4 px-4 py-2 text-xl font-bold bg-red-300 rounded hover:cursor-pointer"
        >
          Restart Game
        </button>
      </div>
      <div className="flex flex-row justify-between mt-4">
        <button
          type="button"
          onClick={(e) => handleManualGame(e)}
          className="px-4 py-2 text-xl font-bold bg-blue-300 rounded hover:cursor-pointer"
        >
          Manual Game
        </button>
      </div>
    </div>
  );
}
