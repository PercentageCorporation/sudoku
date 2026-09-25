import { useState, useEffect } from "react";
import { getGameList } from "../utilities/games";

export default function SaveGameModal({ onConfirm, onCancel }) {

	useEffect(() => {

	}, [])

	function handleConfirm() {
		var element = document.getElementById("game-descr");
		if (!element) return;
		var description = element.value;
		console.log('handleConfirm');
		if (onConfirm) onConfirm(description);
	}

	function handleCancel() {
		console.log('handleCancel');
		if (onCancel) onCancel();
	}

	//console.log(editCandidates, candidates);
	return (
		<div>
			<div id="save-game-modal" className="modal-overlay" >
				<div className="modal">
					<div className="flex flex-col w-full">
						<div className='text-lg font-bold'>Enter Game Description</div>
						<input id="game-descr"
							type="text"
							className="w-full mt-2 px-2 text-lg border-1"
						/>
					</div>
					<div className="modal-actions">
						<button id="confirm-ok"
							className="modal-btn modal-confirm"
							onClick={handleConfirm}
							>
							Confirm
						</button>
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
