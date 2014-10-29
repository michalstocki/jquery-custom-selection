
function logg(m) {
	$('.touch_status').text(m);
}

/**
 * Class VisualDebugger
 */

(function(global) {
	'use strict';

	var CANVAS_ID = 'jcs-visual-debugger';

	function VisualDebugger(contextWindow) {
		this.contextWindow = contextWindow;
		this.canvas = getCanvasFrom(this.contextWindow.document);
		this.context = this.canvas.getContext('2d');
		this.clear();
	}

	VisualDebugger.prototype.clear = function() {
		var $window = $(this.contextWindow);
		this.canvas.width = $window.width();
		this.canvas.height = $window.height();
	};

	VisualDebugger.prototype.drawNode = function(node, color) {
		var range = this.contextWindow.document.createRange();
		range.selectNode(node);
		this.drawRange(range, color);
	};

	VisualDebugger.prototype.drawRect = function(rect, color) {
		this.context.beginPath();
		this.context.rect(rect.left + 0.5, rect.top + 0.5, rect.width, rect.height);
		this.context.lineWidth = 1;
		this.context.strokeStyle = color || 'red';
		this.context.stroke();
	};

	VisualDebugger.prototype.drawRange = function(range, color) {
		var rects = range.getClientRects();
		for (var j = 0, rect; rect = rects[j++];) {
			this.drawRect(rect, color);
		}
	};

	VisualDebugger.prototype.drawPoint = function(point, color) {
		this.drawCircle(point.clientX, point.clientY, color);
	};

	VisualDebugger.prototype.drawCircle = function(x, y, color) {
		this.context.beginPath();
		this.context.arc(x, y, 10, 0, 2 * Math.PI, false);
		this.context.lineWidth = 2;
		this.context.strokeStyle = color || 'green';
		this.context.stroke();
	};

	function getCanvasFrom(doc) {
		return doc.getElementById(CANVAS_ID) || createCanvasIn(doc);
	}

	function createCanvasIn(doc) {
		var canvas = doc.createElement('canvas');
		canvas.setAttribute('id', CANVAS_ID);
		doc.body.insertBefore(canvas, doc.body.firstElementChild);
		adjustCanvas(canvas);
		return canvas;
	}

	function adjustCanvas(canvas) {
		$(canvas).css({
			'position': 'fixed',
			'top': 0,
			'left': 0,
			'pointer-events': 'none',
			'z-index': 2
		});
	}

	global.VisualDebugger = VisualDebugger;
	global.vDebug = function(win) {
		return new VisualDebugger(win);
	};

})(this);
