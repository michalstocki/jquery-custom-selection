/**
 * Class DebugConsole
 */

(function(global) {
	'use strict';

	function DebugConsole(contextWindow) {
		this.contextWindow = contextWindow;
		startCatchingErrors(this.contextWindow);
	}

	function startCatchingErrors(contextWindow) {
		contextWindow.addEventListener('error', handleError);
	}

	function handleError(errorEvent) {
		var $debugConsole = $('.debug-console');
		var $errorElement = createErrorElementFrom(errorEvent);
		$debugConsole.append($errorElement);
		$debugConsole.show();
	}

	function createErrorElementFrom(errorEvent) {
		var $errorElement = $('<div></div>');
		$errorElement.addClass('error-element');
		$errorElement.append(createErrorDetail(getTime(), 'error-date'));
		$errorElement.append(createErrorDetail(errorEvent.message, 'error-message'));
		var errorPlace = event.filename + ':' + event.lineno + ':' + event.colno;
		$errorElement.append(createErrorDetail('at ' + errorPlace, 'error-place'));
		return $errorElement;
	}

	function createErrorDetail(text, cssClass) {
		var $element = $('<div></div>');
		$element.text(text);
		$element.addClass(cssClass);
		return $element;
	}

	function getTime() {
		return new Date().toJSON().substring(10, 19).replace('T', ' ') + ' UTC';
	}

	global.DebugConsole = DebugConsole;
	global.dConsole = function(win) {
		return new DebugConsole(win);
	};

})(this);
