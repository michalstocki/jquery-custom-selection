(function(global) {
	'use strict';

	var CUSTOM_SELECTION_CANVAS_CLASS = 'custom-selection-canvas';

	var canvas;
	var context;
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
		createCanvas();
		context = canvas.getContext('2d');
	}

	function drawSelection(range) {
		var boundingClientRect = range.getBoundingClientRect();
		var rects = range.getClientRects();
		var SUBPIXEL_OFFSET = 0.5;
		context.beginPath();

		for (var i = 0; i < rects.length; i++) {

			context.rect(rects[i].left - boundingClientRect.left + SUBPIXEL_OFFSET,
					rects[i].top - boundingClientRect.top + SUBPIXEL_OFFSET,
					rects[i].width,
					rects[i].height);
		}

		context.closePath();
		context.fillStyle = fillStyle;
		context.fill();
	}

	function yOffset() {
		return isAndroid ? $(window).scrollTop() : 0;
	}

	function updateCanvasBounds(newBounds) {
		newBounds = newBounds || {top: 0, left: 0, width: 0, height: 0};

		canvas.style.top = (newBounds.top + yOffset()) + 'px';
		canvas.style.left = newBounds.left + 'px';

		canvas.width = newBounds.width;
		canvas.height = newBounds.height;
	}

	function createCanvas() {
		canvas = document.createElement('canvas');
		canvas.className = CUSTOM_SELECTION_CANVAS_CLASS;
		canvas.width = '0px';
		canvas.height = '0px';
		$element[0].appendChild(canvas);
	}

	global.CustomSelection.Lib.SelectionDrawer = SelectionDrawer;
})(this);
