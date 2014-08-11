
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

//	jQueryPlugin ---------------------------------------------------------------

	$.fn.customSelection = function(options) {
		settings = $.extend(defaults, options);
		hammerAllowTextSelection();
		enableTouchSelectionFor(this);
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

//	-- Binding events

	function hammerAllowTextSelection() {
		delete Hammer.defaults.cssProps.userSelect;
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
		window.getSelection().removeAllRanges();
		$(startMarker).detach();
		$(endMarker).detach();
	}

	function createSelection() {
		if (existInDOM(startMarker, endMarker)) {
			var range = document.createRange();
			range.setStart.apply(range, getRangeBoundAt(startMarker));
			range.setEnd.apply(range, getRangeBoundAt(endMarker));
			if (range.collapsed) {
				range.setStart.apply(range, getRangeBoundAt(endMarker));
				range.setEnd.apply(range, getRangeBoundAt(startMarker));
			}
			window.getSelection().addRange(range);
		}
	}

	function getRangeBoundAt(element) {
		var offset = Math.max(1, getIndexOfElement(element));
		var anchor = element.parentNode;
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
		window.getSelection().removeAllRanges();
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
		return document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
	}

	function createMarker(kind) {
		var span = document.createElement('span');
		span.setAttribute('class', kind);
		return span;
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
		return false;
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

})(jQuery);

