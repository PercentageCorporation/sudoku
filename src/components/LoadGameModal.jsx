import { useState, useEffect } from "react";
import { getGameList } from "../utilities/games";

export default function LoadGameModal({ onConfirm, onCancel }) {
	const [gameList, setGameList] = useState([]);

	useEffect(() => {
		var games = getGameList();
		console.log("game list", games);
		setGameList(games);

	}, [])

	//console.log('ConfirmModal', open);
	function handleCancel() {
		console.log('handleCancel');
		if (onCancel) onCancel();
	}

	function handleSelect(e, ix) {
		e.preventDefault();
		console.log("game selected", ix);
		if (onConfirm) onConfirm(ix);
	}

	//console.log(editCandidates, candidates);
	return (
		<div>
			<div id="confirm-modal" className="modal-overlay" >
				<div className="modal">
					<div className="flex flex-col w-full">
						<div className='text-lg font-bold'>Select Game</div>

						<ul className="flex flex-col p-2 rounded-md bg-blue-200">
						{gameList.map((g, ix) => {
							const sel = false;
							//console.log("hasTag:",tag,rem);
							return (
								<li key={ix}
								onClick={(e)=>handleSelect(e,g[0])}
								className={`flex justify-between items-center border mb-1 px-2 rounded-md  ${sel ? 'bg-blue-600' : 'bg-blue-300'} hover:bg-blue-400`} >
								<div className="">
									{g[0]} : {g[1]}
								</div>
								</li>
							)
						})
						}
						</ul>
					</div>
					<div className="modal-actions">
						<button id="confirm-cancel"
							onClick={handleCancel}
							className="modal-btn modal-cancel">
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
