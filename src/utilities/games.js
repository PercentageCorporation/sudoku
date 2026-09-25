



export function getGameList() {
	var gameList = [];
	var lcgames = localStorage.getItem('sudoku-games');
	if (!lcgames) return [];
	var games = JSON.parse(lcgames);
	var ngames =  games.games.length;
	if (ngames === 0) return [];
	games.games.forEach((g) => {
		var num = g.number;
		var descr = g.description;
		gameList.push([num,descr]);
	})
	return gameList;
}

export function getGame(ix) {
	var lcgames = localStorage.getItem('sudoku-games');
	if (!lcgames) return null;
	var games = JSON.parse(lcgames);
	var ngames =  games.games.length;
	if (ngames === 0) return null;
	var retGame = null;
	games.games.forEach((g) => {
		var gnum = g.number;
		console.log("getGame", ix, g.description);
		if (gnum === ix) {
			retGame = g;
		}
	})
	return retGame;

}

export function saveGame(description, cells) {

	var lcgames = localStorage.getItem('sudoku-games');
	if (!lcgames) {lcgames = `{"games": []}`;};
	var games = JSON.parse(lcgames);

	var ngames =  games["games"].length;
	console.log("saved games", ngames);
	var newgame = {
		number: ngames + 1,
		description: description,
		game: cells
	}
	games["games"].push(newgame);
	//console.log(games);
	var sgames = JSON.stringify(games);
	//console.log(sgames);

	localStorage.setItem('sudoku-games', sgames);
	console.log("game saved")
	return newgame.number;
}

export function deleteGame(ix) {
	console.log("delete game", ix);
	var lcgames = localStorage.getItem('sudoku-games');
	if (!lcgames) return null;
	var games = JSON.parse(lcgames);
	console.log("delete game", ix, games);
	var ngames =  games.length;
	if (ngames === 0) return null;
	games.games = games.games.filter((g) => g.number != ix);
	var sgames = JSON.stringify(games);
	//console.log(sgames);

	localStorage.setItem('sudoku-games', sgames);
	console.log("game deleted",games)

}

