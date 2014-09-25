(function(global) {
	'use strict';

	var context;
	var lastDrawnRange;
	var $element;
	var fillStyle;
	var isAndroid = /(Android)/g.test(navigator.userAgent);

	function SelectionDrawer($el, selectionColor) {
		$element = $el;
		fillStyle = selectionColor;
		initCanvas();
	}

	SelectionDrawer.prototype.redraw = function(range) {
		updateCanvasBounds(range.getBoundingClientRect());
		drawSelection(range);
	};

	SelectionDrawer.prototype.clearSelection = function() {
		updateCanvasBounds();
	};

	function initCanvas() {
		var canvas = getCanvas() || createCanvas();
		context = canvas.getContext('2d');
	}

	function drawSelection(range) {
		var boundingClientRect = range.getBoundingClientRect();
		var rects = range.getClientRects();
		var SELECTION_OFFSET = 0.5;
		context.beginPath();

		for (var i = 0; i < rects.length; i++) {

			context.rect(rects[i].left - boundingClientRect.left + SELECTION_OFFSET,
					rects[i].top - boundingClientRect.top + SELECTION_OFFSET,
					rects[i].width,
					rects[i].height);
		}

		context.closePath();
		context.fillStyle = fillStyle;
		context.fill();

		lastDrawnRange = range;
	}

	function yOffset() {
		return isAndroid ? $(window).scrollTop() : 0;
	}

	function updateCanvasBounds(newBounds) {
		newBounds = newBounds || {top: 0, left: 0, width: 0, height: 0};
		var canvas = getCanvas();

		canvas.style.top = (newBounds.top + yOffset()) + 'px';
		canvas.style.left = newBounds.left + 'px';

		canvas.width = newBounds.width;
		canvas.height = newBounds.height;
	}

	function getCanvas() {
		return document.getElementById('customSelectionCanvas');
	}

	function createCanvas() {
		var canvas = document.createElement('canvas');
		canvas.id = 'customSelectionCanvas';
		canvas.width = '0px';
		canvas.height = '0px';
		$element[0].appendChild(canvas);
		return canvas;
	}

	global.CustomSelection.Lib.SelectionDrawer = SelectionDrawer;
})(this);
