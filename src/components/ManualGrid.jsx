import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCellActions, useManCellsStore } from "../store/store";
import Spinner from "./Spinner";
import { LRUD, bstyles } from "../utilities/utilities";
import "/src/styles/borders.css";

function ManualCell({ix}) {
	const { getManCell, selectedCell, setManSelectedCell } = useManCellsStore();
	const cell = getManCell(ix);
	const val = (cell && cell > 0) ? cell : "";
	const cn = (ix === selectedCell) ? " bg-green-300" : "";
	const bs = bstyles[ix];

	function selectCell(e, cix) {
		//console.log("selectCell:", cix);
		setManSelectedCell(cix);
	}

	return (
		<div
			id={ix}
			className={"size-11 " + cn + bs}
			onClick={(e)=>selectCell(e, ix)}
			>
			<div className={"flex justify-center items-center w-full h-full text-3xl font-bold"}>
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
		<div className="grid grid-cols-3 w-full  border-black-300">
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
	const { setManSelectedCell, setManCellValue, getManCells, initialized, initialize} = useManCellsStore();
	const { loadGame } = useCellActions();
	//console.log("ManGrid", selectedCell);

	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	useEffect(() => {
		const handleKeyDown = (e) => {
			const sel = useManCellsStore.getState().selectedCell;
			var char = null;
			var lrud = sel >= 0 ? LRUD[sel] : -1;
			var next = -1;
			const key = e.key;
			if (key.length === 1) char = key[0];

			console.log("key:", key);
			switch (e.key) {
				case "ArrowLeft":
					next = lrud[0];
					//console.log("left", sel, next);
					break;

				case "ArrowRight":
				case " ":
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

		window.addEventListener("keydown", handleKeyDown);
		if (!initialized) initialize();

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	function exit() {
		navigate('/');
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
		console.log("handlePlay", mc);
		loadGame(mc);
		navigate('/');
	}

	return (
		<div className="">
			<div className="px-1 grid grid-cols-3 w-full  border-black-300">
			{
				index.map((y, ix) => { return (<ManualGrid9 key={ix} y={y} />) })
			}
			</div>
			<div className="mx-2 flex flex-row justify-between mt-4">
				<button
					type="button"
					onClick={(e) => handleClear(e)}
					className="px-4 py-2 text-xl font-bold bg-blue-300 rounded hover:cursor-pointer"
					>
					Clear Board
				</button>
				<button
					type="button"
					onClick={(e) => handlePlay(e)}
					className="px-4 py-2 text-xl font-bold bg-blue-300 rounded hover:cursor-pointer"
					>
					Play Game
				</button>
				</div>
			<div className="mx-2 flex flex-row justify-between mt-4">
				<button
					type="button"
					onClick={(e) => exit(e)}
					className="px-4 py-2 text-xl font-bold bg-blue-300 rounded hover:cursor-pointer"
					>
				Return to Game
				</button>
			</div>

		</div>
	);
}
