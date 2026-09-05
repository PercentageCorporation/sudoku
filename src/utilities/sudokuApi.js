

// https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{difficulty}}}
const SUDOKU_API = "https://sudoku-api.vercel.app/api/dosuku";

export async function apiGetGame() {
	const url = SUDOKU_API;
	var response = await fetch(url,
		{
			method: 'GET', // or 'POST'
			mode: 'cors', // Enable CORS
			headers: {
				'Content-Type': 'application/json' // Specify content type
			}
		}
	);
	console.log("response: ", response);
	const json = await response.json();
	console.log("sudoku: ", json);
	return json;
}

export async function getGameDosuku() {
	var game = [];
	var solution = [];
	const json = await apiGetGame();
	//console.log(json);

	var board = json.newboard.grids[0].value;
	var solved = json.newboard.grids[0].solution;
	var difficulty = json.newboard.grids[0].difficulty;
	//console.log(board,solved);

	for (let rx = 0; rx < 9; rx+=3) {
		for (let s = 0; s < 9; s+=3) {
			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 3; col++) {
					var x = rx+row;
					var y = s+col;
					//console.log(x,y);
					game.push(board[x][y])
				}
			}
		}
	}

	for (let rx = 0; rx < 9; rx+=3) {
		for (let s = 0; s < 9; s+=3) {
			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 3; col++) {
					var x = rx+row;
					var y = s+col;
					//console.log(x,y);
					solution.push(solved[x][y])
				}
			}
		}
	}

	//console.log(game, solution);

	return {game, solution, difficulty}
}
