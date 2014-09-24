(function(global) {
	'use strict';

	var context;
	var lastDrawnRange;
	var $element;
	var fillStyle;
	var ios = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

	function SelectionDrawer($el, selectionColor) {
		$element = $el;
		fillStyle = selectionColor;
		initCanvas();
	}

	SelectionDrawer.prototype.redraw = function(range) {
		updateCanvasBounds();
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
		var rects = range.getClientRects();
		var scrollY = ios ? window.scrollY : 0;
		context.beginPath();
		for (var i = 0; i < rects.length; i++) {
			context.rect(rects[i].left + 0.5, rects[i].top + 0.5 + scrollY, rects[i].width, rects[i].height);
		}

		context.closePath();
		context.fillStyle = fillStyle;
		context.fill();

		lastDrawnRange = range;
	}

	function clearSelection() {
		var canvas = getCanvas();
		if (canvas) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
	}

	function updateCanvasBounds() {
		var canvas = getCanvas();
		canvas.style.top = $(window).scrollTop() + 'px';
		canvas.style.left = $(window).scrollLeft() + 'px';

		canvas.width = $(window).width();
		canvas.height = $(window).height();
	}

	function getCanvas() {
		return document.getElementById('customSelectionCanvas');
	}

	function createCanvas() {
		var canvas = document.createElement('canvas');
		canvas.setAttribute('id', 'customSelectionCanvas');
		canvas.setAttribute('width', $(window).width());
		canvas.setAttribute('height', $(window).height());
		$element[0].appendChild(canvas);
		return canvas;
	}

	global.CustomSelection.Lib.SelectionDrawer = SelectionDrawer;
})(this);
