(function($) {
	var ON_TOUCH_DEVICES = 'onTouchDevices';

	// Default configuration
	var settings, defaults = {
		markerClass: 'marker',
		holdThreshold: 4,
		holdTimeout: 500,
		useMarkers: ON_TOUCH_DEVICES,
		onSelectionChange: function() {
		}
	};
	var isAppleDevice = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

	// Collaborators
	var frameRequester = null;
	var startMarker = null;
	var endMarker = null;
	var selectionDrawer = null;

	window.CustomSelection = {
		Lib: {}
	};

//	jQuery Plugin --------------------------------------------------------------

	$.fn.customSelection = function(options) {
		settings = $.extend(defaults, options);

		if (shouldLeaveNativeSelection()) {
			return;
		}

		useContextOf(this);

		if (isTouchDevice()) {
			enableTouchSelectionFor(this);
		}
		else {
			enableMouseSelectionFor(this);
		}
		startMarker = createMarker(settings.markerClass);
		endMarker = createMarker(settings.markerClass);
		frameRequester = new CustomSelection.Lib.FrameRequester();
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer({
			$element: this,
			contextWindow: contextWindow,
			contextDocument: contextDocument,
			fillStyle: settings.selectionColor
		});
		return this;
	};

	$.fn.clearCustomSelection = function() {
		clearSelection();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		if (shouldLeaveNativeSelection()) {
			return;
		}

		if (isTouchDevice()) {
			disableTouchSelectionFor(this);
		}
		else
		{
			disableMouseSelectionFor(this);
		}

		clearSelection();
		return this;
	};

//	Private methods ------------------------------------------------------------

	var lastPoint = null;
	var WHITESPACE = ' ';
	var rejectTouchEnd = false;
	var contextWindow = null;
	var contextDocument = null;
	var lastSelectionRange = null;
	var movedMarker = false;
	var mouseDownTime = 0;
	var mouseDownPoint = null;
	var userSelectBeforeEnablingSelection = null;
	var hasMovedOverThreshold = false;
	var timeoutId = null;

//	-- Binding events

	function shouldLeaveNativeSelection() {
		return settings.useMarkers === ON_TOUCH_DEVICES && !isTouchDevice();
	}

	function useContextOf($element) {
		contextDocument = $element[0].ownerDocument;
		contextWindow = contextDocument.defaultView || contextDocument.parentWindow;
	}

	function enableMouseSelectionFor($element) {
		disableNativeSelection($element);
		$element
			.on('mousedown', handleGlobalMouseDown)
			.on('mouseup', handleGlobalMouseUp)
			.on('mousemove', handleGlobalMouseMove);
		$(contextWindow).on('resize', handleResize);
	}

	function disableMouseSelectionFor($element) {
		restoreNativeSelection($element);

		$element
			.off('mousedown', handleGlobalMouseDown)
			.off('mouseup', handleGlobalMouseUp)
			.off('mousemove', handleGlobalMouseMove);
		$(contextWindow).off('resize', handleResize);
	}

	function enableTouchSelectionFor($element) {
		$element.each(function() {
			new Hammer(this, {
				holdThreshold: settings.holdThreshold,
				holdTimeout: settings.holdTimeout
			});
		});
		$element
			.on('touchmove', handleGlobalTouchMove)
			.on('touchend', handleGlobalTouchEnd)
			.hammer().on('press', handleGlobalTapHold)
			.on('tap', clearSelection);
		$(contextWindow).on('orientationchange resize', handleResize);
	}

	function disableTouchSelectionFor($element) {
		$element
			.off('touchmove', handleGlobalTouchMove)
			.off('touchend', handleGlobalTouchEnd)
			.hammer().off('press', handleGlobalTapHold)
			.off('tap', clearSelection);
	}


	function handleGlobalMouseDown(jqueryEvent) {
		if (isMarker(jqueryEvent.target)) {
			movedMarker = jqueryEvent.target;
		}
		else {
			clearSelection();

			if (timeoutId)
			{
				clearInterval(timeoutId);
			}

			mouseDownTime = Date.now();
			mouseDownPoint = getTouchPoint(jqueryEvent, {shift: false});
			hasMovedOverThreshold = false;

			timeoutId = setTimeout(function() {
				if (!hasMovedOverThreshold)
				{
					tryToInitNewSelection(jqueryEvent);
				}

				mouseDownPoint = null;
				mouseDownTime = 0;
				hasMovedOverThreshold = false;
				timeoutId = null;
			}, settings.holdTimeout);
		}
	}

	function handleGlobalMouseUp() {
		movedMarker = null;
	}

	function handleGlobalMouseMove(e) {
		if (movedMarker) {
			handleMarkerTouchMove(e);
		}
		else if (movedOverThreshold(e))
		{
			hasMovedOverThreshold = true;
		}
	}

	function handleGlobalTapHold(e) {
		e = e.gesture;
		e.srcEvent.preventDefault();
		e.srcEvent.stopPropagation();
		tryToInitNewSelection(e);
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
			mark(eventAnchor, lastPoint, getMarkerToMove(jqueryEvent));
			makeSelection();
		});
	}

	function clearSelection() {
		$(startMarker).detach();
		$(endMarker).detach();
		lastSelectionRange = null;
		selectionDrawer.clearSelection();
		settings.onSelectionChange(contextDocument.createRange());
	}

	function handleResize() {
		var range = createSelectionRange();
		drawSelectionRange(range);
	}

	function movedOverThreshold(e) {
		if (!mouseDownPoint) {
			return false;
		}

		var mouseMoveXDiff = Math.abs(e.clientX - mouseDownPoint.clientX);
		var mouseMoveYDiff = Math.abs(e.clientY - mouseDownPoint.clientY);

		return mouseMoveXDiff > settings.holdThreshold ||
			mouseMoveYDiff > settings.holdThreshold;
	}

	function isMarker(element) {
		return element === startMarker || element === endMarker;
	}

	function isTouchDevice() {
		return 'ontouchend' in document;
	}

	function getMarkerToMove(jqueryEvent) {
		return movedMarker || jqueryEvent.target;
	}

	function tryToInitNewSelection(e) {
		var element = getTouchedElementFromEvent(e);

		if (!isMarker(element)) {
			var point = getTouchPoint(e, {shift: false});
			clearSelection();
			wrapWithMarkersWordAtPoint(element, point);
			makeSelection();
			rejectTouchEnd = true;
		}
	}

	// -- Dealing with native selection

	function disableNativeSelection($element) {
		userSelectBeforeEnablingSelection = $element.css('user-select');
		$element.css('user-select', 'none');
	}

	function restoreNativeSelection($element) {
		$element.css('user-select', userSelectBeforeEnablingSelection);
	}

//	-- Creating Selection

	function makeSelection() {
		var range = createSelectionRange();
		if (hasRangeChanged(range)) {
			drawSelectionRange(range);
		}
	}

	function drawSelectionRange(range) {
		if (range) {
			settings.onSelectionChange(range);
			lastSelectionRange = range;
			selectionDrawer.redraw(range);
		}
	}

	function hasEndOfSelectionChanged(range) {
		return lastSelectionRange.compareBoundaryPoints(Range.END_TO_END, range) !== 0;
	}

	function hasStartOfSelectionChanged(range) {
		return lastSelectionRange.compareBoundaryPoints(Range.START_TO_START, range) !== 0;
	}

	function hasRangeChanged(range) {
		return !lastSelectionRange ||
			hasEndOfSelectionChanged(range) ||
			hasStartOfSelectionChanged(range);
	}

	function createSelectionRange() {
		if (existInDOM(startMarker, endMarker)) {
			var range = contextDocument.createRange();
			range.setStart.apply(range, getRangeBoundAt(startMarker));
			range.setEnd.apply(range, getRangeBoundAt(endMarker));
			if (range.collapsed) {
				range.setStart.apply(range, getRangeBoundAt(endMarker));
				range.setEnd.apply(range, getRangeBoundAt(startMarker));
			}

			return range;
		}
		return null;
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

//	-- Preparing Markers

	function getTouchPoint(touchEvent, options) {
		return new CustomSelection.Lib.Point(touchEvent, options);
	}

	function getTouchedElementFromEvent(touchEvent) {
		var touches = touchEvent.touches || touchEvent.pointers || [touchEvent];
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

//	-- Extracting a word under the pointer

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

//  ---- Finding a text node
//  ------ Finding a node containing the pointer

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
		var x = isAppleDevice ? point.pageX : point.clientX;
		var y = isAppleDevice ? point.pageY : point.clientY;
		return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
	}

	function nodeIsText(node) {
		return node.nodeType === Node.TEXT_NODE && node.length;
	}

	function nodeHasChildren(node) {
		return node.childNodes.length > 0;
	}

//  ------ Finding the closest node to the pointer

	function getClosestTextNodeFromEl(el, point) {
		var nearestOnTheLeftOfPoint = getNodeNearerPointOnLeft.bind(null, point);
		var nearestAbovePoint = getNodeNearerPointAbove.bind(null, point);
		return searchTextNode(el, nearestOnTheLeftOfPoint) ||
			searchTextNode(el, nearestAbovePoint);
	}

	function searchTextNode(el, comparator) {
		var node = el;
		var subNode;
		while (subNode = searchNode(node, comparator)) {
			if (nodeIsText(subNode)) {
				return subNode;
			} else {
				node = subNode;
			}
		}
	}

	function searchNode(el, comparator) {
		var closestNode = null;
		if (el) {
			var nodes = el.childNodes;
			for (var i = 0, n; n = nodes[i++];) {
				var rects;
				if ((rects = getRectsForNode(n)) && rects.length &&
					(nodeHasChildren(n) || nodeIsText(n))) {
					closestNode = comparator(closestNode, n);
				}
			}
		}
		return closestNode;
	}

//	-------- Finding node on the **left** of the pointer

	function getNodeNearerPointOnLeft(point, winner, rival) {
		var newWinner = winner;
		var nearestRivalRect = getRectNearestOnLeftOfPoint(rival, point);
		if (winner) {
			var nearestWinnerRect = getRectNearestOnLeftOfPoint(winner, point);
			if (areDifferent(nearestRivalRect, nearestWinnerRect) &&
				nearestRivalRect.right > nearestWinnerRect.right) {
				newWinner = splitNodeAfterRect(rival, nearestRivalRect);
			}
		} else if (nearestRivalRect) {
			newWinner = splitNodeAfterRect(rival, nearestRivalRect);
		}
		return newWinner;
	}

	function getRectNearestOnLeftOfPoint(node, point) {
		var rects = getRectsForNode(node);
		var nearestRect = null;
		for (var j = 0, rect; rect = rects[j++];) {
			if (rectIsInTheSameLineOnLeft(rect, point) &&
				(!nearestRect || rect.right > nearestRect.right)) {
				nearestRect = rect;
			}
		}
		return nearestRect;
	}

	function areDifferent(arg1, arg2) {
		return arg1 && arg2 && arg1 !== arg2;
	}

	function rectIsInTheSameLineOnLeft(rect, point) {
		var x = point.clientX;
		var y = point.clientY;
		return rect.right < x && rect.top <= y && rect.bottom >= y;
	}

	function splitNodeAfterRect(node, clientRect) {
		var rects = getRectsForNode(node);
		var lastRect = rects[rects.length - 1];
		if (clientRect === lastRect || !nodeIsText(node)) {
			return node;
		} else {
			var point = {
				clientX: clientRect.right - 1,
				clientY: clientRect.bottom - 1
			};
			return trimTextNodeWhileContainsPoint(node, point);
		}
	}

//	-------- Finding node **above** the pointer

	function getNodeNearerPointAbove(point, winner, rival) {
		var nearestRivalRect = getRectNearestAbovePoint(rival, point);
		var newWinner = winner;
		if (winner) {
			var nearestWinnerRect = getRectNearestAbovePoint(winner, point);
			if (areDifferent(nearestRivalRect, nearestWinnerRect) &&
				nearestRivalRect.top >= nearestWinnerRect.top) {
				newWinner = splitNodeAfterRect(rival, nearestRivalRect);
			}
		} else if (nearestRivalRect) {
			newWinner = splitNodeAfterRect(rival, nearestRivalRect);
		}
		return newWinner;
	}

	function getRectNearestAbovePoint(node, point) {
		var y = point.clientY;
		var rects = getRectsForNode(node);
		var nearestRect = null;
		for (var j = 0, rect; rect = rects[j++];) {
			if (rect.top < y && (!nearestRect || rect.top >= nearestRect.top)) {
				nearestRect = rect;
			}
		}
		return nearestRect;
	}

})(jQuery);

