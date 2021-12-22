//
// Copyright nilswinter 2020-2021. License: AGPL
// _____________________________________________

"use strict";

import "/resources/remoshock.js"
import "./stay-ruleset.js";
import { GamepadManager } from "./gamepad.js";


/**
 * user interface
 */
export class UserInterface {
	#MAX_BUTTONS = 13;
	#gamepadManager;
	#ruleset;
	active = false;

	/**
	 * @param appConfig key/value - configuration for the app
	 * @param mapping   string    - button mapping for ↖️⬆️↗️⬅️🔄➡️↙️⬇️↘️YXBA
	 */
	constructor(appConfig, mapping) {
		this.#gamepadManager = new GamepadManager(this, mapping);
		let rulesetClass = window.rulesets[appConfig.ruleset];
		this.#ruleset = new rulesetClass(appConfig, this, this.#gamepadManager);
		document.getElementById("start").addEventListener("click", () => {
			this.start();
		});
		document.getElementById("stop").addEventListener("click", () => {
			this.stop();
		});
	}

	/**
	 * event handler
	 */
	onGamepadReady() {
		this.#showConfiguredGamepad();
		setInterval(() => {
			this.#gameloop();
		}, 1);
		document.getElementById("start").classList.remove("hidden");
		document.getElementById("complianceStatus").innerText = "";
	}

	/**
	 * configures the gamepad on screen by hiding missing buttons
	 */
	#showConfiguredGamepad() {
		for (let i = 0; i < this.#MAX_BUTTONS; i++) {
			document.getElementById("b" + i).classList.add("hidden");
		}
		for (let button of this.#gamepadManager.buttons) {
			document.getElementById("b" + button.uiIndex).classList.remove("hidden");
		}
	}

	/**
	 * indicates the button state on the user interface
	 */
	displayButtonState() {
		for (let button of this.#gamepadManager.buttons) {
			if (button.isPressed()) {
				document.getElementById("t" + button.uiIndex).classList.add("pressed");
			} else {
				document.getElementById("t" + button.uiIndex).classList.remove("pressed");
			}
			if (button.desiredButtonStatus) {
				document.getElementById("b" + button.uiIndex).classList.add("desired");
			} else {
				document.getElementById("b" + button.uiIndex).classList.remove("desired");
			}
		}
	}

	/**
	 * starts the game
	 */
	start() {
		document.getElementById("start").classList.add("hidden")
		document.getElementById("stop").classList.remove("hidden")
		this.showInformation("");
		this.active = true;
		this.#ruleset.start();
	}

	/**
	 * ends the game
	 */
	stop() {
		this.active = false;
		this.#ruleset.stop();
		document.getElementById("start").classList.remove("hidden")
		document.getElementById("stop").classList.add("hidden")
		this.showInformation("inactive");
	}

	/**
	 * updates the status information
	 *
	 * @param message message to show
	 */
	showInformation(message) {
		document.getElementById("complianceStatus").innerText = message;
	}

	/**
	 * indicates a status
	 *
	 * @param indication status to indicate (e. g. "punishing")
	 */
	indicate(indication) {
		let body = document.getElementsByTagName("body")[0];
		body.classList.add(indication);
	}

	/**
	 * stops indicating a status
	 *
	 * @param indication status to no longer indicate (e. g. "punishing")
	 */
	stopIndicating(indication) {
		let body = document.getElementsByTagName("body")[0];
		body.classList.remove(indication);
	}

	/**
	 * updates the display of button status.
	 * Note: game logic is implemented in rulesets.js
	 */
	#gameloop() {
		if (!this.#gamepadManager.changesPressent()) {
			return;
		}
		this.displayButtonState();
	}
}


async function init() {
	globalThis.remoshock = new Remoshock();
	await remoshock.init();
	console.log(remoshock.config);
	// let buttonMapping = "    * 7- * 6- * 6+ * 7+ *, 3 2 1 0";   // xbox
	let buttonMapping = "2 5- 1 4- * 4+ 3 5+ 0"; // select: 8, start: 9;  // DDR

	// TODO: support multiple sections
	// TODO: validate configuration
	new UserInterface(remoshock.config.applications.gamepad, buttonMapping);
}

init();


