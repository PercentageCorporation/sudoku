import { useEffect } from "react";
import Spinner from "./Spinner";

function ManualCell({ix}) {
	//console.log("Cell:", ix, selectedCell, cn);
	function selectCell(e, ix) {
		console.log("selectCell:", ix);
	}

	return (
		<div
			id={ix}
			className="border border-black-100 size-11 "
			onClick={(e)=>selectCell(e, ix)}
			>
			<div className="flex justify-center items-center w-full h-full text-3xl font-bold">
			{"#"}
			</div>
		</div>
	);
}

function ManualGrid9({y}) {
	//console.log("Grid9:", y);
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	return (
		<>
		<div className="grid grid-cols-3 w-full border border-black-300">
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
	//console.log("GameGrid");
	const index = [0, 1, 2, 3, 4, 5, 6, 7, 8];

	useEffect(() => {
		const handleKeyDown = (e) => {
			switch (e.key) {
				case "ArrowLeft":
					console.log("left");
					break;

				case "ArrowRight":
					console.log("right");
					break;

				case "ArrowUp":
					console.log("up");
					break;

				case "ArrowDown":
					console.log("down");
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	function handleKey(e) {
		e.preventDefault();
		console.log("key press")
	}

	return (
		<div className="">
			<input type="text" onKeyDown={handleKey} />
			<div
				className="grid grid-cols-3 w-full border border-black-900"
				>
			{
				index.map((y, ix) => { return (<ManualGrid9 key={ix} y={y} />) })
			}
			</div>
			</div>
	);
}
