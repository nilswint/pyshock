//
// Copyright nilswinter 2020-2021. License: AGPL
// _____________________________________________

"use strict";

import "/resources/remoshock.js"
import "./simon-ruleset.js";
import "./walk-ruleset.js";
import { GamepadManager } from "./gamepad.js";
import { UIFramework } from "../resources/uiframework.js"


/**
 * user interface
 */
export class UserInterface {
	#MAX_BUTTONS = 17;

	#uiFramework;
	#appConfig;
	#gamepadManager;
	#ruleset;
	active = false;
	#wakeLock;

	constructor() {
		this.#uiFramework = new UIFramework();
		this.#uiFramework.renderAppShell("Gamepad (Experimental)");
		document.getElementById("start").addEventListener("click", () => {
			this.start();
		});
		document.getElementById("stop").addEventListener("click", () => {
			this.stop();
		});
		
		document.addEventListener('visibilitychange', () => {
			this.#onVisibilityChange();
		});
		this.init();
	}

	async init() {
		globalThis.remoshock = new Remoshock();
		await remoshock.init();
		console.log(remoshock.config);
		let buttonMappings = [
			{
				"regex": ".*Xbox.*",
	//			"mapping": "    * 7- * 6- * 6+ * 7+ *, 3 2 1 0"
				"mapping": "    * 1- * 0- * 0+ * 1+ *, 3 2 1 0 4 5 2+ 5+"
			},
			{
				"regex": ".*",
				"mapping": "2 5- 1 4- * 4+ 3 5+ 0" // select: 8, start: 9;  // DDR
	
			}
		];
		this.#appConfig = remoshock.config.applications.gamepad;
		this.#uiFramework.load(this.#appConfig);
		this.#gamepadManager = new GamepadManager(this, buttonMappings);
		let rulesetClass = window.rulesets[this.#appConfig.ruleset];
		this.#ruleset = new rulesetClass(this.#appConfig, this, this.#gamepadManager);
	}


	async #onVisibilityChange() {
		if (this.#wakeLock !== undefined && document.visibilityState === 'visible') {
			this.#wakeLock = await navigator.wakeLock.request('screen');
		}
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
	async start() {
		this.#uiFramework.save(document.getElementById("settings"), this.#appConfig);

		document.getElementById("settings").classList.add("hidden")
		document.getElementById("start").classList.add("hidden")
		document.getElementById("stop").classList.remove("hidden")
		this.showInformation("");
		this.active = true;
		this.#ruleset.start();
		if ('wakeLock' in navigator) {
			this.#wakeLock = await navigator.wakeLock.request('screen');
		}
	}

	/**
	 * ends the game
	 */
	async stop() {
		this.active = false;
		this.#ruleset.stop();
		document.getElementById("settings").classList.remove("hidden")
		document.getElementById("start").classList.remove("hidden")
		document.getElementById("stop").classList.add("hidden")
		this.showInformation("inactive");
		if ('wakeLock' in navigator && this.#wakeLock) {
			await this.#wakeLock.release();
			this.#wakeLock = undefined;
		}
		this.#gamepadManager.resetAllDesiredButtonStatus()
		this.displayButtonState();
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

new UserInterface();