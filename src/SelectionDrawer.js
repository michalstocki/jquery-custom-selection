(function(global) {
	'use strict';

	var CUSTOM_SELECTION_CANVAS_CLASS = 'custom-selection-canvas';
	var CUSTOM_SELECTION_CANVAS_STYLE = {
		'position': 'absolute',
		'pointer-events': 'none',
		'z-index': -1
	};

	var canvas;
	var context;
	var settings;
	var environment;
	var rectangler;
	var isAppleDevice = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

	function SelectionDrawer(options) {
		settings = options;
		environment = settings.environment;
		rectangler = settings.rectangler;
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
		var rects = rectangler.getRectsFor(range);
		var SUBPIXEL_OFFSET = 0.5;

		var offsetX = SUBPIXEL_OFFSET - boundingClientRect.left;
		var offsetY = SUBPIXEL_OFFSET - boundingClientRect.top;
		context.save();
		context.translate(offsetX, offsetY);

		context.beginPath();
		rects.forEach(function(rect) {
			context.rect(rect.left,
					rect.top,
					rect.width,
					rect.height);
		});
		context.closePath();
		context.fillStyle = settings.fillStyle;
		context.fill();
		context.restore();
	}

	function yOffset() {
		return !isAppleDevice ? $(settings.contextWindow).scrollTop() : 0;
	}

	function updateCanvasBounds(newBounds) {
		newBounds = newBounds || {top: 0, left: 0, width: 0, height: 0};

		canvas.style.top = (newBounds.top + yOffset()) + 'px';
		canvas.style.left = newBounds.left + 'px';

		canvas.width = newBounds.width;
		canvas.height = newBounds.height;
	}

	function createCanvas() {
		canvas = settings.contextDocument.createElement('canvas');
		canvas.className = CUSTOM_SELECTION_CANVAS_CLASS;
		$(canvas).css(CUSTOM_SELECTION_CANVAS_STYLE);
		canvas.width = 0;
		canvas.height = 0;
		settings.$element[0].appendChild(canvas);
	}

	global.CustomSelection.Lib.SelectionDrawer = SelectionDrawer;
})(this);
