/*! jquery-custom-selection - v0.1.0 - 2014-07-25 */
(function(global) {
	// Default configuration
	delete Hammer.defaults.cssProps.userSelect;
	var startMarkerClass = 'start-marker';
	var endMarkerClass = 'end-marker';

	// Collaborators
	var frameRequester = null;
	var startMarker = null;
	var endMarker = null;

//	Public interface -----------------------------------------------------------

	global.CustomSelection = {
		enable: function(element, options) {
			if (options) {
				startMarkerClass = options.startMarkerClass || startMarkerClass;
				endMarkerClass = options.endMarkerClass || endMarkerClass;
				enableTouchSelectionFor(element);
			}
			startMarker = createMarker(startMarkerClass);
			endMarker = createMarker(endMarkerClass);
			frameRequester = new CustomSelection.Lib.FrameRequester();
		},
		disable: function(element) {
			disableTouchSelectionFor(element);
			clearSelection();
		},
		Lib: {}
	};

//	Private methods ------------------------------------------------------------

	var lastPoint = null;

//	-- Binding events

	function enableTouchSelectionFor(element) {
		$(element)
			.on('touchmove', handleGlobalTouchMove)
			.on('touchend', handleGlobalTouchEnd)
			.hammer().on('press', handleGlobalTapHold);
	}

	function disableTouchSelectionFor(element) {
		$(element)
			.off('touchmove', handleGlobalTouchMove)
			.off('touchend', handleGlobalTouchEnd)
			.hammer().off('press', handleGlobalTapHold);
	}

	function handleGlobalTapHold(e) {
		e = e.gesture;
		var element = getTouchedElementFromEvent(e);
		var point = getTouchPoint(e);
		clearSelection();
		wrapWithMarkersWordAtPoint(element, point);
		createSelection();
	}

	function handleGlobalTouchMove(jqueryEvent) {
		if (isMarker(jqueryEvent.target)) {
			handleMarkerTouchMove(jqueryEvent);
		}
	}

	function handleGlobalTouchEnd(jqueryEvent) {
		jqueryEvent.preventDefault();
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
		window.getSelection().removeAllRanges();
		$(startMarker).detach();
		$(endMarker).detach();
	}

	function createSelection() {
		if (!startMarker.parentNode || !endMarker.parentNode) {
			return null;
		}
		var range = document.createRange();
		var startAnchor = startMarker.parentNode;
		var endAnchor = endMarker.parentNode;
		var startOffset = getIndexOfElement(startMarker) + 1;
		var endOffset = getIndexOfElement(endMarker);
		range.setStart(startAnchor, startOffset);
		range.setEnd(endAnchor, endOffset);
		if (range.collapsed) {
			range.setStart(endAnchor, endOffset);
			range.setEnd(startAnchor, startOffset);
		}
		window.getSelection().addRange(range);
	}

	function updateSelection() {
		window.getSelection().removeAllRanges();
		createSelection();
	}

//	-- Preparing Markers

	function getTouchPoint(touchEvent) {
		return new CustomSelection.Lib.Point(touchEvent);
	}

	function getTouchedElementFromEvent(touchEvent) {
		var touches = touchEvent.touches || touchEvent.pointers;
		return touches[0].target;
	}

	function getTouchedElementByPoint(touchPoint) {
		return document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
	}

	function createMarker(kind) {
		var span = document.createElement('span');
		span.setAttribute('class', kind);
		return span;
	}


//	-- Extracting node with word at point

	/* jshint-W074 */
	function wrapWithMarkersWordAtPoint(element, point) {
		var textNode;
		if (textNode = getFromElNodeContainingPoint(element, point)) {
			while (textNode.length > 1) {
				var trimPosition = textNode.length >> 1;
				var subNode = textNode.splitText(trimPosition);
				if (nodeContainsPoint(subNode, point)) {
					textNode = subNode;
				}
			}
			// searching space backwards
			var potentialSpace = textNode;
			while (potentialSpace && potentialSpace.data[potentialSpace.length - 1] !== ' ') {
				if (potentialSpace.length > 1) {
					potentialSpace = potentialSpace.splitText(potentialSpace.length - 1).previousSibling;
				} else if (potentialSpace.previousSibling && nodeIsText(potentialSpace.previousSibling)) {
					potentialSpace = potentialSpace.previousSibling;
				} else {
					putMarkerBefore(potentialSpace, startMarker);
					potentialSpace = null;
				}
			}
			if (potentialSpace) {
				putMarkerAfter(potentialSpace, startMarker);
			}

			// searching space forwards
			potentialSpace = textNode;
			while (potentialSpace && potentialSpace.data[0] !== ' ') {
				if (potentialSpace.length > 1) {
					potentialSpace = potentialSpace.splitText(1);
				} else if (potentialSpace.nextSibling && nodeIsText(potentialSpace.nextSibling)) {
					potentialSpace = potentialSpace.nextSibling;
				} else {
					putMarkerAfter(potentialSpace, endMarker);
					potentialSpace = null;
				}
			}
			if (potentialSpace) {
				putMarkerBefore(potentialSpace, endMarker);
			}
			textNode.parentNode.normalize();
		}
	}
	/* jshint+W074 */

//	-- Marking

	function mark(el, point, marker) {
		var textNode;
		if (textNode = getFromElNodeContainingPoint(el, point)) {
			while (textNode.length > 1) {
				var trimPosition = textNode.length >> 1;
				var subNode = textNode.splitText(trimPosition);
				if (nodeContainsPoint(subNode, point)) {
					textNode = subNode;
				}
			}
			putMarkerBefore(textNode, marker);
		} else if (textNode = getClosestTextNodeFromEl(el, point)) {
			putMarkerAfter(textNode, marker);
		} else {
			return null;
		}
		marker.parentNode.normalize();
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

// ---- Finding text node
// ------ Finding node containing point

	function getFromElNodeContainingPoint(el, point) {
		var nodes = el.childNodes;
		for (var i = 0, n; n = nodes[i++];) {
			if (nodeIsText(n) && nodeContainsPoint(n, point)) {
				return n;
			}
		}
	}

	function nodeContainsPoint(node, point) {
		var rects = getRectsForNode(node);
		for (var j = 0, rect; rect = rects[j++];) {
			if (rectContainsPoint(rect, point)) {
				return true;
			}
		}
	}

	function getRectsForNode(node) {
		var range = document.createRange();
		range.selectNode(node);
		return range.getClientRects();
	}

	function rectContainsPoint(rect, point) {
		var x = point.clientX, y = point.clientY;
		return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
	}

	function nodeIsText(node) {
		return node.nodeType === Node.TEXT_NODE && node.length;
	}

// ------ Finding node closest to pointer

	function getClosestTextNodeFromEl(el, point) {
		var node = el;
		var subNode;
		while (subNode = getClosestNodeFromEl(node, point)) {
			if (nodeIsText(subNode)) {
				return subNode;
			} else {
				node = subNode;
			}
		}
		return null;
	}

	function getClosestNodeFromEl(el, point) {
		var nodes = el.childNodes;
		var closestNode = null;
		for (var i = 0, n; n = nodes[i++];) {
			var rects;
			if ((rects = getRectsForNode(n)) && rects.length) {
				closestNode = closestNode || n;
				closestNode = getNodeCloserToPoint(point, closestNode, n);
			}
		}
		return closestNode;
	}

	function getNodeCloserToPoint(point, winner, rival) {
		var nearestWinnerRect = getRectNearestToPoint(winner, point);
		var nearestRivalRect = getRectNearestToPoint(rival, point);
		if (nearestRivalRect && nearestWinnerRect &&
			nearestRivalRect !== nearestWinnerRect &&
			nearestRivalRect.top >= nearestWinnerRect.top) {
			return rival;
		} else {
			return winner;
		}
	}

	function getRectNearestToPoint(node, point) {
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

})(this);


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

	function Point(touchEvent) {
		var touches = touchEvent.touches || touchEvent.pointers;
		var touch = touches[0];
		this.clientX = touch.clientX;
		this.clientY = touch.clientY;
		this.pageX = touch.pageX;
		this.pageY = touch.pageY;
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
