/*! jquery-custom-selection - v0.1.2 - 2014-08-28 */
(function($) {
	// Default configuration
	var settings, defaults = {
		markerClass: 'marker'
	};

	// Collaborators
	var frameRequester = null;
	var startMarker = null;
	var endMarker = null;

	window.CustomSelection = {
		Lib: {}
	};

//	jQuery Plugin --------------------------------------------------------------

	$.fn.customSelection = function(options) {
		settings = $.extend(defaults, options);
		hammerAllowTextSelection();
		enableTouchSelectionFor(this);
		useContextOf(this);
		startMarker = createMarker(settings.markerClass);
		endMarker = createMarker(settings.markerClass);
		frameRequester = new CustomSelection.Lib.FrameRequester();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		disableTouchSelectionFor(this);
		clearSelection();
		return this;
	};

//	Private methods ------------------------------------------------------------

	var lastPoint = null;
	var WHITESPACE = ' ';
	var rejectTouchEnd = false;
	var contextWindow = null;
	var contextDocument = null;

//	-- Binding events

	function hammerAllowTextSelection() {
		delete Hammer.defaults.cssProps.userSelect;
	}

	function useContextOf($element) {
		contextDocument = $element[0].ownerDocument;
		contextWindow = contextDocument.defaultView || contextDocument.parentWindow;
	}

	function enableTouchSelectionFor($element) {
		$element.each(function() {
			new Hammer(this, {
				holdThreshold: 2,
				holdTimeout: 500
			});
		});
		$element
			.on('touchmove', handleGlobalTouchMove)
			.on('touchend', handleGlobalTouchEnd)
			.hammer().on('press', handleGlobalTapHold)
			.on('tap', clearSelection);
	}

	function disableTouchSelectionFor($element) {
		$element
			.off('touchmove', handleGlobalTouchMove)
			.off('touchend', handleGlobalTouchEnd)
			.hammer().off('press', handleGlobalTapHold)
			.off('tap', clearSelection);
	}

	function handleGlobalTapHold(e) {
		e = e.gesture;
		e.srcEvent.preventDefault();
		e.srcEvent.stopPropagation();
		if (!isMarker(e.target)) {
			var element = getTouchedElementFromEvent(e);
			var point = getTouchPoint(e, {shift: false});
			clearSelection();
			wrapWithMarkersWordAtPoint(element, point);
			createSelection();
			rejectTouchEnd = true;
		}
	}

	function handleGlobalTouchMove(jqueryEvent) {
		if (isMarker(jqueryEvent.target)) {
			handleMarkerTouchMove(jqueryEvent);
			rejectTouchEnd = true;
		}
	}

	function handleGlobalTouchEnd(jqueryEvent) {
		if (rejectTouchEnd) {
			jqueryEvent.preventDefault();
			rejectTouchEnd = false;
		}
	}

	function handleMarkerTouchMove(jqueryEvent) {
		jqueryEvent.preventDefault();
		lastPoint = getTouchPoint(jqueryEvent.originalEvent);
		frameRequester.requestFrame(function() {
			var eventAnchor = getTouchedElementByPoint(lastPoint);
			mark(eventAnchor, lastPoint, jqueryEvent.target);
			updateSelection();
		});
	}

	function isMarker(element) {
		return element === startMarker || element === endMarker;
	}

//	-- Creating Selection

	function clearSelection() {
		if (contextWindow) {
			contextWindow.getSelection().removeAllRanges();
		}
		$(startMarker).detach();
		$(endMarker).detach();
	}

	function createSelection() {
		if (existInDOM(startMarker, endMarker)) {
			var range = contextDocument.createRange();
			range.setStart.apply(range, getRangeBoundAt(startMarker));
			range.setEnd.apply(range, getRangeBoundAt(endMarker));
			if (range.collapsed) {
				range.setStart.apply(range, getRangeBoundAt(endMarker));
				range.setEnd.apply(range, getRangeBoundAt(startMarker));
			}
			contextWindow.getSelection().addRange(range);
		}
	}

	function getRangeBoundAt(element) {
		var offset = getIndexOfElement(element);
		var anchor = element.parentNode;
		if (element.nextSibling) {
			offset += 1;
		}
		return [anchor, offset];
	}

	function existInDOM() {
		for (var i = 0; i < arguments.length; i++) {
			var element = arguments[i];
			if (!element.parentNode) {
				return false;
			}
		}
		return true;
	}

	function updateSelection() {
		contextWindow.getSelection().removeAllRanges();
		createSelection();
	}

//	-- Preparing Markers

	function getTouchPoint(touchEvent, options) {
		return new CustomSelection.Lib.Point(touchEvent, options);
	}

	function getTouchedElementFromEvent(touchEvent) {
		var touches = touchEvent.touches || touchEvent.pointers;
		return touches[0].target;
	}

	function getTouchedElementByPoint(touchPoint) {
		hideMarkers();
		var element = contextDocument.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
		showMarkers();
		return element;
	}

	function createMarker(kind) {
		var span = contextDocument.createElement('span');
		span.setAttribute('class', kind);
		return span;
	}

	function hideMarkers() {
		var css = {visibility: 'hidden'};
		$(startMarker).css(css);
		$(endMarker).css(css);
	}

	function showMarkers() {
		var css = {visibility: 'visible'};
		$(startMarker).css(css);
		$(endMarker).css(css);
	}

//	-- Extracting word under pointer

	function wrapWithMarkersWordAtPoint(element, point) {
		var textNode;
		if (textNode = getFromElNodeContainingPoint(element, point)) {
			textNode = trimTextNodeWhileContainsPoint(textNode, point);
			putMarkerBeforeWhitespaceOnLeftOf(textNode, startMarker);
			putMarkerBeforeWhitespaceOnRightOf(textNode, endMarker);
			textNode.parentNode.normalize();
		}
	}

	function putMarkerBeforeWhitespaceOnLeftOf(textNode, marker) {
		// searching space backwards
		var node = textNode;
		while (!nodeEndsWith(node, WHITESPACE)) {
			if (node.data.length > 1) {
				node = removeLastLetter(node);
			} else if (node.previousSibling && nodeIsText(node.previousSibling)) {
				node = node.previousSibling;
			} else {
				putMarkerBefore(node, marker);
				return;
			}
		}
		putMarkerAfter(node, marker);
	}

	function putMarkerBeforeWhitespaceOnRightOf(textNode, marker) {
		// searching space forwards
		var node = textNode;
		while (!nodeStartsWith(node, WHITESPACE)) {
			if (node.length > 1) {
				node = removeFirstLetter(node);
			} else if (node.nextSibling && nodeIsText(node.nextSibling)) {
				node = node.nextSibling;
			} else {
				putMarkerAfter(node, marker);
				return;
			}
		}
		putMarkerBefore(node, marker);
	}

	function removeLastLetter(textNode) {
		var subNode = textNode.splitText(textNode.length - 1);
		return subNode.previousSibling;
	}

	function removeFirstLetter(textNode) {
		return textNode.splitText(1);
	}

	function nodeStartsWith(node, letter) {
		return node.data[0] === letter;
	}

	function nodeEndsWith(node, letter) {
		return node.data[node.length - 1] === letter;
	}

//	-- Marking

	function mark(el, point, marker) {
		window.initCanvas();
		window.drawCircle(point.clientX, point.clientY);
		var textNode;
		if (textNode = getFromElNodeContainingPoint(el, point)) {
			textNode = trimTextNodeWhileContainsPoint(textNode, point);
			putMarkerBefore(textNode, marker);
		} else if (textNode = getClosestTextNodeFromEl(el, point)) {
			putMarkerAfter(textNode, marker);
		} else {
			return null;
		}
		marker.parentNode.normalize();
	}

	function trimTextNodeWhileContainsPoint(textNode, point) {
		while (textNode.length > 1) {
			var trimPosition = textNode.length >> 1;
			var subNode = textNode.splitText(trimPosition);
			if (nodeContainsPoint(subNode, point)) {
				textNode = subNode;
			}
		}
		return textNode;
	}

	function putMarkerBefore(node, marker) {
		node.parentNode.insertBefore(marker, node);
	}

	function putMarkerAfter(node, marker) {
		if (node.nextSibling) {
			node.parentNode.insertBefore(marker, node.nextSibling);
		} else {
			node.parentNode.appendChild(marker);
		}
	}

	function getIndexOfElement(element) {
		var elements = element.parentElement.childNodes;
		return Array.prototype.indexOf.call(elements, element);
	}

//  ---- Finding text node
//  ------ Finding node containing point

	function getFromElNodeContainingPoint(el, point) {
		if (el) {
			var nodes = el.childNodes;
			for (var i = 0, n; n = nodes[i++];) {
				if (nodeIsText(n) && nodeContainsPoint(n, point)) {
					return n;
				}
			}
		}
		return null;
	}

	function nodeContainsPoint(node, point) {
		var rects = getRectsForNode(node);
		for (var j = 0, rect; rect = rects[j++];) {
			if (rectContainsPoint(rect, point)) {
				return true;
			}
		}
		return false;
	}

	function getRectsForNode(node) {
		var range = contextDocument.createRange();
		range.selectNode(node);
		return range.getClientRects();
	}

	function rectContainsPoint(rect, point) {
		var x = point.clientX, y = point.clientY;
		return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
	}

	function nodeIsText(node) {
		return node.nodeType === Node.TEXT_NODE && node.length;
	}

	function nodeHasChildren(node) {
		return node.childNodes.length > 0;
	}

//  ------ Finding node closest to pointer

	function getClosestTextNodeFromEl(el, point) {
		return getClosestTextNodeOnLeftOfPoint(el, point) ||
//		getClosestTextNodeBelowPoint(el, point) ||
		getClosestTextNodeAbovePoint(el, point);
	}

//	-------- Finding node on **left** of pointer

	function getClosestTextNodeOnLeftOfPoint(el, point) {
		var node = el;
		var subNode;
		while (subNode = getClosestNodeFromElOnLeftOfPoint(node, point)) {
			if (nodeIsText(subNode)) {
				window.drawNode(subNode);
				return subNode;
			} else {
				node = subNode;
			}
		}
	}

	function getClosestNodeFromElOnLeftOfPoint(el, point) {
		var closestNode = null;
		if (el) {
			var nodes = el.childNodes;
			for (var i = 0, n; n = nodes[i++];) {
				var rects;
				if ((rects = getRectsForNode(n)) && rects.length &&
					(nodeHasChildren(n) || nodeIsText(n))) {
					closestNode = getNodeCloserOnLeftOfPoint(point, closestNode, n);
				}
			}
		}
		return closestNode;
	}

	function getNodeCloserOnLeftOfPoint(point, winner, rival) {
		var nearestRivalRect = getRectNearestOnLeftOfPoint(rival, point);
		if (winner) {
			var nearestWinnerRect = getRectNearestOnLeftOfPoint(winner, point);
			if (nearestRivalRect && nearestWinnerRect &&
				nearestRivalRect !== nearestWinnerRect &&
				nearestRivalRect.left > nearestWinnerRect.left) {
				return rival;
			} else {
				return winner;
			}
		} else if (nearestRivalRect) {
			return rival;
		} else {
			return null;
		}
	}

	function getRectNearestOnLeftOfPoint(node, point) {
		var x = point.clientX;
		var y = point.clientY;
		var rects = getRectsForNode(node);
		var nearestRect = null;
		for (var j = 0, rect; rect = rects[j++];) {
			if (rect.right < x && rect.top <= y && rect.bottom >= y) {
				nearestRect = nearestRect || rect;
				if (nearestRect !== rect && rect.right > nearestRect.right) {
					nearestRect = rect;
				}
			}
		}
		return nearestRect;
	}

//	-------- Finding node **above** pointer

	function getClosestTextNodeAbovePoint(el, point) {
		var node = el;
		var subNode;
		while (subNode = getClosestNodeFromElAbovePoint(node, point)) {
			if (nodeIsText(subNode)) {
				return subNode;
			} else {
				node = subNode;
			}
		}
	}

	function getClosestNodeFromElAbovePoint(el, point) {
		var closestNode = null;
		if (el) {
			var nodes = el.childNodes;
			for (var i = 0, n; n = nodes[i++];) {
				var rects;
				if ((rects = getRectsForNode(n)) && rects.length &&
					(nodeHasChildren(n) || nodeIsText(n))) {
					closestNode = getNodeCloserAbovePoint(point, closestNode, n);
				}
			}
		}
		return closestNode;
	}

	function getNodeCloserAbovePoint(point, winner, rival) {
		var nearestRivalRect = getRectNearestAbovePoint(rival, point);
		if (winner) {
			var nearestWinnerRect = getRectNearestAbovePoint(winner, point);
			if (nearestRivalRect && nearestWinnerRect &&
				nearestRivalRect !== nearestWinnerRect &&
				nearestRivalRect.top >= nearestWinnerRect.top) {
				return rival;
			} else {
				return winner;
			}
		} else if (nearestRivalRect) {
			return rival;
		} else {
			return null;
		}
	}

	function getRectNearestAbovePoint(node, point) {
		var y = point.clientY;
		var rects = getRectsForNode(node);
		var nearestRect = null;
		for (var j = 0, rect; rect = rects[j++];) {
			if (rect.top < y) {
				nearestRect = nearestRect || rect;
				if (nearestRect !== rect && rect.top >= nearestRect.top) {
					nearestRect = rect;
				}
			}
		}
		return nearestRect;
	}

})(jQuery);


/**
 * Class FrameRequester
 */

(function(global) {
	'use strict';

	function FrameRequester() {
		this._ticking = false;
	}

	FrameRequester.prototype.requestFrame = function(func) {
		if (!this._ticking) {
			window.requestAnimationFrame(function() {
				func();
				this._ticking = false;
			}.bind(this));
		}
		this._ticking = true;
	};

	global.CustomSelection.Lib.FrameRequester = FrameRequester;

})(this);

/**
 * Class Point
 */

(function(global) {
	'use strict';
	var defaults = {shift: true};
	var SHIFT_Y = -32;

	function Point(touchEvent, options) {
		var settings = $.extend({}, defaults, options);
		var touches = touchEvent.touches || touchEvent.pointers;
		var touch = touches[0];
		this.clientX = touch.clientX;
		this.clientY = touch.clientY;
		this.pageX = touch.pageX;
		this.pageY = touch.pageY;
		if (settings.shift) {
			this.clientY += SHIFT_Y;
			this.pageY += SHIFT_Y;
		}
	}

	global.CustomSelection.Lib.Point = Point;

})(this);

(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
			window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
					callback(currTime + timeToCall);
				},
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}());
