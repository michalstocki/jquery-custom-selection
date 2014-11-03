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
	var isAppleDevice = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

	function SelectionDrawer(options) {
		settings = options;
		environment = settings.environment;
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
		var rects = getClientRects(range);
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

	function getClientRects(range) {
		var rects = [].slice.call(range.getClientRects());
		if (environment.isWebkit && !environment.isAppleDevice) {
			rects = filterDuplicatedRects(rects);
		}
		return rects;
	}

	function filterDuplicatedRects(rects) {
		var lastRect = rects[rects.length - 1];
		return rects.filter(function(rect) {
			return !(rectEndsAfterLastRect(rect, lastRect) ||
			rectContainsOneOfRects(rect, rects));
		});
	}

	function rectEndsAfterLastRect(rect, lastRect) {
		var TOLERATED_RIGHT_LEAK = 1;
		return rect.bottom === lastRect.bottom &&
				rect.right - lastRect.right > TOLERATED_RIGHT_LEAK;
	}

	function rectContainsOneOfRects(rect, rects) {
		for (var i = 0; i < rects.length; i++) {
			var r = rects[i];
			if (rectContainsNotEmptyRect(rect, r)) {
				return true;
			}
		}
		return false;
	}

	function rectContainsNotEmptyRect(possibleParent, potentialChild) {
		var R = possibleParent;
		var r = potentialChild;
		return !rectsAreEqual(R, r) &&
				R.top <= r.top &&
				R.right >= r.right &&
				R.bottom >= r.bottom &&
				R.left <= r.left &&
				r.height > 0 &&
				r.width > 0;
	}

	function rectsAreEqual(rectA, rectB) {
		return rectA === rectB ||
				(rectA.left === rectB.left &&
				rectA.right === rectB.right &&
				rectA.height === rectB.height &&
				rectA.width === rectB.width);
	}

	global.CustomSelection.Lib.SelectionDrawer = SelectionDrawer;
})(this);
