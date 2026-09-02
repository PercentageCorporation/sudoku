import { useEffect } from "react";
import { cellStore } from "./store/store";
import { getNewGame } from "./utilities/utilities";
import GameGrid from "./components/GameGrid";
import Spinner from "./components/Spinner";
import PlayMenu from "./components/PlayMenu";

export default function App() {
  const { cells, newGame, resetGame, initCells, cellsLoaded } = cellStore();
  //console.log("App");

  useEffect(() => {
	  console.log("App UE");
	  if (!cellsLoaded) {
		const {puzzleGrid, solutionGrid} = getNewGame(34);
		//console.log(puzzleGrid, solutionGrid);
		initCells(puzzleGrid, solutionGrid);
    }
  }, []);

  function handleNewGame(e) {
    e.preventDefault();
    newGame();
    window.location.pathname = "/";
  }

  function handleResetGame(e) {
	  e.preventDefault();
	  resetGame();
	  window.location.pathname = "/";
  }

  if (!cellsLoaded) return <Spinner />;

  return (
    <div className="max-w-[412px] mx-2 select-none">
      <div className="mt-4">
        <GameGrid />
      </div>
      <div>
        <PlayMenu />
      </div>
      <div className="flex flex-row mt-4">
        <button
          type="button"
          onClick={(e) => handleNewGame(e)}
          className="px-4 py-2 text-xl font-bold bg-orange-300 rounded hover:cursor-pointer"
        >
          New Game
        </button>
        <button
          type="button"
          onClick={(e) => handleResetGame(e)}
          className="mx-4 px-4 py-2 text-xl font-bold bg-red-300 rounded hover:cursor-pointer"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
}
