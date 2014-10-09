(function($) {
	var ON_TOUCH_DEVICES = 'onTouchDevices';
	var MARKER_CLASS = 'jcs-marker';
	var MARKER_START_CLASS = 'jcs-beginning-marker';
	var MARKER_END_CLASS = 'jcs-end-marker';
	var MARKER_MOVING_CLASS = 'jcs-marker-moving';

	// Default configuration
	var settings, defaults = {
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
		} else {
			enableMouseSelectionFor(this);
		}
		startMarker = createMarkerInside(this, MARKER_START_CLASS);
		endMarker = createMarkerInside(this, MARKER_END_CLASS);
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
		} else {
			disableMouseSelectionFor(this);
		}

		clearSelection();
		return this;
	};

//	Private methods ------------------------------------------------------------

	var lastPoint = null;
	var WHITESPACE_LIST = {
		32: ' ',
		9: '\t',
		13: '\r',
		10: '\n'
	};
	var rejectTouchEnd = false;
	var contextWindow = null;
	var contextDocument = null;
	var lastSelectionRange = null;
	var movedMarker = null;
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
		} else {
			clearSelection();
			handleGlobalMouseHoldDownStart(jqueryEvent);
		}
	}

	function handleGlobalMouseHoldDownStart(jqueryEvent) {
		if (timeoutId) {
			clearInterval(timeoutId);
		}

		mouseDownTime = Date.now();
		mouseDownPoint = createPointerPoint(jqueryEvent, {shift: false});
		hasMovedOverThreshold = false;

		timeoutId = setTimeout(handleGlobalMouseHoldDown, settings.holdTimeout, jqueryEvent);
	}

	function handleGlobalMouseHoldDown(jqueryEvent) {
		if (!hasMovedOverThreshold) {
			selectWordUnderPointer(jqueryEvent);
		}

		mouseDownPoint = null;
		mouseDownTime = 0;
		hasMovedOverThreshold = false;
		timeoutId = null;
	}

	function handleGlobalMouseUp() {
		movedMarker = null;
	}

	function handleGlobalMouseMove(e) {
		if (movedMarker) {
			handleMarkerPointerMove(e);
		}
		else if (movedOverThreshold(e)) {
			hasMovedOverThreshold = true;
		}
	}

	function handleGlobalTapHold(e) {
		e = e.gesture;
		e.srcEvent.preventDefault();
		e.srcEvent.stopPropagation();
		selectWordUnderPointer(e);
	}

	function handleGlobalTouchMove(jqueryEvent) {
		if (isMarker(jqueryEvent.target)) {
			handleMarkerPointerMove(jqueryEvent);
			rejectTouchEnd = true;
		}
	}

	function handleGlobalTouchEnd(jqueryEvent) {
		if (rejectTouchEnd) {
			jqueryEvent.preventDefault();
			rejectTouchEnd = false;
		}
	}

	function handleMarkerPointerMove(jqueryEvent) {
		jqueryEvent.preventDefault();
		lastPoint = createPointerPoint(jqueryEvent.originalEvent);
		movedMarker = jqueryEvent.target;
		$(movedMarker).addClass(MARKER_MOVING_CLASS);
		frameRequester.requestFrame(function() {
			var eventAnchor = getTouchedElementByPoint(lastPoint);
			expandSelectionRangeToIncludePointInElement(lastPoint, eventAnchor);
			makeSelectionFor(lastSelectionRange);
		});
	}

	function clearSelection() {
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

	function selectWordUnderPointer(pointerEvent) {
		var element = getTargetElementFromPointerEvent(pointerEvent);
		if (!isMarker(element)) {
			clearSelection();
			var point = createPointerPoint(pointerEvent, {shift: false});
			var range = getRangeWrappingWordAtPoint(element, point);
			makeSelectionFor(range);
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

	function makeSelectionFor(theRange) {
		lastSelectionRange = theRange;
		// TODO: refactor caching ranges
		//if (hasRangeChanged(theRange)) {
		drawSelectionRange(theRange);
		//}
	}

	function drawSelectionRange(range) {
		if (range) {
			settings.onSelectionChange(range);
			//lastSelectionRange = range;
			selectionDrawer.redraw(range);
			adjustMarkerPositionsTo(range);
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

	function adjustMarkerPositionsTo(range) {
		var rects = range.getClientRects();
		var offsetY = $(contextWindow).scrollTop();
		var firstRect = rects[0];
		var lastRect = rects[rects.length - 1];
		startMarker.style.top = firstRect.top + offsetY + 'px';
		startMarker.style.left = firstRect.left + 'px';
		endMarker.style.top = lastRect.top + offsetY + 'px';
		endMarker.style.left = lastRect.right + 'px';
		$(startMarker).removeClass(MARKER_MOVING_CLASS);
		$(endMarker).removeClass(MARKER_MOVING_CLASS);
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

	function createPointerPoint(pointerEvent, options) {
		return new CustomSelection.Lib.Point(pointerEvent, options);
	}

	function getTargetElementFromPointerEvent(pointerEvent) {
		var touches = pointerEvent.touches || pointerEvent.pointers || [pointerEvent];
		return touches[0].target;
	}

	function getTouchedElementByPoint(touchPoint) {
		hideMarkers();
		var element = contextDocument.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
		showMarkers();
		return element;
	}

	function createMarkerInside($parent, className) {
		var element = contextDocument.createElement('div');
		element.setAttribute('class', MARKER_CLASS + ' ' + className);
		element.setAttribute('style', 'position: absolute;');
		$parent.append(element);
		return element;
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

	function getRangeWrappingWordAtPoint(element, point) {
		var textNode;
		var range = null;
		if (textNode = getFromElNodeContainingPoint(element, point)) {
			range = getFromTextNodeMinimalRangeContainingPoint(textNode, point);
			window.initCanvas();
			window.drawRange(range);
			expandRangeToStartAfterTheWhitespaceOnLeft(range);
			expandRangeToEndBeforeTheWhitespaceOnRight(range);
		}
		return range;
	}

	function expandRangeToStartAfterTheWhitespaceOnLeft(range) {
		// searching space backwards
		while (!rangeStartsWithWhitespace(range)) {
			if (range.startOffset < 1) {
				return;
			} else {
				range.setStart(range.startContainer, range.startOffset - 1);
			}
		}
		range.setStart(range.startContainer, range.startOffset + 1);
	}

	function expandRangeToEndBeforeTheWhitespaceOnRight(range) {
		// searching space forwards
		var maxIndex = Math.max(range.endContainer.data.length, 0);
		while (!rangeEndsWithWhitespace(range)) {
			if (range.endOffset >= maxIndex) {
				return;
			} else {
				range.setEnd(range.endContainer, range.endOffset + 1);
			}
		}
		range.setEnd(range.endContainer, range.endOffset - 1);
	}

	function rangeStartsWithWhitespace(range) {
		return range.toString().charCodeAt(0) in WHITESPACE_LIST;
	}

	function rangeEndsWithWhitespace(range) {
		var stringified = range.toString();
		return stringified.charCodeAt(stringified.length - 1) in WHITESPACE_LIST;
	}

//	-- Marking

	function expandSelectionRangeToIncludePointInElement(point, element) {
		var textNode;
		if (textNode = getFromElNodeContainingPoint(element, point)) {
			var pointRange = getFromTextNodeMinimalRangeContainingPoint(textNode, point);
			var tempRange = lastSelectionRange.cloneRange();
			if (movedMarker === startMarker) {
				tempRange.setStart(pointRange.startContainer, pointRange.startOffset);
				if (tempRange.collapsed) {
					lastSelectionRange.setStart(lastSelectionRange.endContainer, lastSelectionRange.endOffset);
					lastSelectionRange.setEnd(pointRange.startContainer, pointRange.startOffset);
				} else {
					lastSelectionRange.setStart(pointRange.startContainer, pointRange.startOffset);
				}
			} else if (movedMarker === endMarker) {
				tempRange.setEnd(pointRange.startContainer, pointRange.startOffset);
				if (tempRange.collapsed) {
					lastSelectionRange.setStart(pointRange.startContainer, pointRange.startOffset);
					lastSelectionRange.setEnd(lastSelectionRange.startContainer, lastSelectionRange.startOffset);
				} else {
					lastSelectionRange.setEnd(pointRange.startContainer, pointRange.startOffset);
				}
			}
		}
	}

	function getFromTextNodeMinimalRangeContainingPoint(textNode, point) {
		var range = contextDocument.createRange();
		var startIndex = 0;
		var endIndex = textNode.data.length;
		while (startIndex < endIndex) {
			var middle = (startIndex + endIndex) >> 1;
			range.setStart(textNode, startIndex);
			range.setEnd(textNode, middle + 1);
			if (rangeContainsPoint(range, point)) {
				endIndex = middle;
			} else {
				startIndex = middle + 1;
				range.setStart(textNode, startIndex);
				range.setEnd(textNode, endIndex);
			}
		}
		return range;
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

	function rangeContainsPoint(range, point) {
		var rects = range.getClientRects();
		for (var j = 0, rect; rect = rects[j++];) {
			if (rectContainsPoint(rect, point)) {
				return true;
			}
		}
		return false;
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
		return rectContainsPointVertically(rect, point) &&
		rectOrItsBoundsContainPointHorizontally(rect, point);
	}

	function rectContainsPointVertically(rect, point) {
		var y = isAppleDevice ? point.pageY : point.clientY;
		return y > rect.top && y < rect.bottom;
	}

	function rectOrItsBoundsContainPointHorizontally(rect, point) {
		var x = isAppleDevice ? point.pageX : point.clientX;
		return x >= rect.left && x <= rect.right;
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
			return getFromTextNodeMinimalRangeContainingPoint(node, point);
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

