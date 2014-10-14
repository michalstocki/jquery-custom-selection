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
		if (!shouldLeaveNativeSelection()) {
			useContextOf(this);
			frameRequester = new CustomSelection.Lib.FrameRequester();
			selectionDrawer = new CustomSelection.Lib.SelectionDrawer({
				$element: this,
				contextWindow: contextWindow,
				contextDocument: contextDocument,
				fillStyle: settings.selectionColor
			});
			enableSelectionFor(this);
		}
		return this;
	};

	$.fn.clearCustomSelection = function() {
		clearSelection();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		if (!shouldLeaveNativeSelection()) {
			clearSelection();
			disableSelectionFor(this);
		}
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
	var selectionAnchor = null;
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

	function enableSelectionFor($element) {
		startMarker = createMarkerInside($element, MARKER_START_CLASS);
		endMarker = createMarkerInside($element, MARKER_END_CLASS);

		if (isTouchDevice()) {
			disableNativeSelection(getBodyOf($element));
			enableTouchSelectionFor($element);
		} else {
			disableNativeSelection($element);
			enableMouseSelectionFor($element);
		}
	}

	function disableSelectionFor($element) {
		if (isTouchDevice()) {
			restoreNativeSelection(getBodyOf($element));
			disableTouchSelectionFor($element);
		} else {
			restoreNativeSelection($element);
			disableMouseSelectionFor($element);
		}
	}

	function enableMouseSelectionFor($element) {
		$element
			.on('mousedown', handleGlobalMouseDown)
			.on('mouseup', handleGlobalMouseUp)
			.on('mousemove', handleGlobalMouseMove);
		$(contextWindow).on('resize', handleResize);
	}

	function disableMouseSelectionFor($element) {
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
			.on('touchend', handleGlobalTouchEnd)
			.hammer().on('press', handleGlobalTapHold)
			.on('tap', clearSelection);
		$(startMarker).add(endMarker)
			.on('touchstart', handleMarkerTouchStart);
		$(contextWindow)
			.on('orientationchange resize', handleResize);
	}

	function disableTouchSelectionFor($element) {
		$element
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

	function handleGlobalTouchEnd(jqueryEvent) {
		if (rejectTouchEnd) {
			jqueryEvent.preventDefault();
			rejectTouchEnd = false;
		}
	}

	function handleMarkerPointerMove(jqueryEvent) {
		jqueryEvent.preventDefault();
		lastPoint = createPointerPoint(jqueryEvent.originalEvent);
		frameRequester.requestFrame(function() {
			var eventTarget = getTouchedElementByPoint(lastPoint);
			var range = getRangeCoveringLastSelectionAndPointInElement(lastPoint, eventTarget);
			makeSelectionFor(range);
		});
	}

	function handleMarkerTouchStart(jqueryEvent) {
		jqueryEvent.preventDefault();
		setMovedMarker(jqueryEvent.target);
		$(getBodyOf(movedMarker))
			.on('touchmove', handleMarkerTouchMove)
			.on('touchend', handleMarkerTouchMoveEnd);
		selectionAnchor = getSelectionAnchor();
	}

	function handleMarkerTouchMove(jqueryEvent) {
		handleMarkerPointerMove(jqueryEvent);
		rejectTouchEnd = true;
	}

	function handleMarkerTouchMoveEnd() {
		$(getBodyOf(movedMarker))
			.off('touchmove', handleMarkerTouchMove)
			.off('touchend', handleMarkerTouchMoveEnd);
		unsetMovedMarker();
		selectionAnchor = null;
	}

	function handleResize() {
		if (lastSelectionRange) {
			drawSelectionRange();
		}
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

	function setMovedMarker(element) {
		movedMarker = element;
		$(movedMarker).addClass(MARKER_MOVING_CLASS);
	}

	function unsetMovedMarker() {
		$(movedMarker).removeClass(MARKER_MOVING_CLASS);
		movedMarker = null;
	}

	function toggleMovedMarker() {
		$(movedMarker).removeClass(MARKER_MOVING_CLASS);
		if (movedMarker === startMarker) {
			movedMarker = endMarker;
		} else {
			movedMarker = startMarker;
		}
		$(movedMarker).addClass(MARKER_MOVING_CLASS);
	}

	function isTouchDevice() {
		return 'ontouchend' in document;
	}

	function getBodyOf(element) {
		return (element.ownerDocument || element[0].ownerDocument).body;
	}

	function getSelectionAnchor() {
		var selectionAnchor = {};
		if (movedMarker === startMarker) {
			selectionAnchor.container = lastSelectionRange.endContainer;
			selectionAnchor.offset = lastSelectionRange.endOffset;
		} else {
			selectionAnchor.container = lastSelectionRange.startContainer;
			selectionAnchor.offset = lastSelectionRange.startOffset;
		}
		return selectionAnchor;
	}

	// -- Dealing with native selection

	function disableNativeSelection($element) {
		$element = $($element);
		userSelectBeforeEnablingSelection = $element.css('user-select');
		$element.css('user-select', 'none');
	}

	function restoreNativeSelection($element) {
		$element = $($element);
		$element.css('user-select', userSelectBeforeEnablingSelection);
	}

//	-- Creating Selection

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

	function makeSelectionFor(range) {
		if (rangeDiffersFromLastSelection(range)) {
			lastSelectionRange = range;
			drawSelectionRange();
			settings.onSelectionChange(lastSelectionRange);
		}
		showMarkers();
	}

	function clearSelection() {
		lastSelectionRange = null;
		hideMarkers();
		selectionDrawer.clearSelection();
		settings.onSelectionChange(contextDocument.createRange());
	}

	function drawSelectionRange() {
		selectionDrawer.redraw(lastSelectionRange);
		adjustMarkerPositionsTo(lastSelectionRange);
	}

	function hasEndOtherThanLastSelectionEnd(range) {
		return lastSelectionRange.compareBoundaryPoints(Range.END_TO_END, range) !== 0;
	}

	function hasStartOtherThanLastSelectionStart(range) {
		return lastSelectionRange.compareBoundaryPoints(Range.START_TO_START, range) !== 0;
	}

	function rangeDiffersFromLastSelection(range) {
		return !lastSelectionRange ||
			hasEndOtherThanLastSelectionEnd(range) ||
			hasStartOtherThanLastSelectionStart(range);
	}

	function adjustMarkerPositionsTo(range) {
		var rects = range.getClientRects();
		var offsetY = isAppleDevice ? 0 : $(contextWindow).scrollTop();
		var firstRect = rects[0];
		var lastRect = rects[rects.length - 1];
		startMarker.style.top = firstRect.top + offsetY + 'px';
		startMarker.style.left = firstRect.left + 'px';
		endMarker.style.top = lastRect.top + offsetY + 'px';
		endMarker.style.left = lastRect.right + 'px';
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
		$(startMarker).add(endMarker).css({visibility: 'hidden'});
	}

	function showMarkers() {
		$(startMarker).add(endMarker).css({visibility: 'visible'});
	}

//	-- Extracting a word under the pointer

	function getRangeWrappingWordAtPoint(element, point) {
		var textNode;
		var range = null;
		if (textNode = getFromElNodeContainingPoint(element, point)) {
			range = getFromTextNodeMinimalRangeContainingPoint(textNode, point);
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

	function getRangeCoveringLastSelectionAndPointInElement(point, element) {
		var pointRange;
		var coveringRange = lastSelectionRange.cloneRange();
		var textNode;
		if (textNode = getFromElNodeContainingPoint(element, point)) {
			pointRange = getFromTextNodeMinimalRangeContainingPoint(textNode, point);
		} else {
			pointRange = getClosestPointRangeFormElement(element, point);
		}
		if (pointRange) {
			var tempRange = coveringRange.cloneRange();
			if (movedMarker === startMarker) {
				tempRange.setStart(pointRange.startContainer, pointRange.startOffset);
				if (tempRange.collapsed) {
					coveringRange.setStart(selectionAnchor.container, selectionAnchor.offset);
					coveringRange.setEnd(pointRange.startContainer, pointRange.startOffset);
					toggleMovedMarker();
				} else {
					coveringRange = tempRange;
				}
			} else if (movedMarker === endMarker) {
				tempRange.setEnd(pointRange.startContainer, pointRange.startOffset);
				if (tempRange.collapsed) {
					coveringRange.setStart(pointRange.startContainer, pointRange.startOffset);
					coveringRange.setEnd(selectionAnchor.container, selectionAnchor.offset);
					toggleMovedMarker();
				} else {
					coveringRange = tempRange;
				}
			}
		}
		return coveringRange;
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

	function getClosestPointRangeFormElement(el, point) {
		var storage = {
			textNode: null,
			rect: null
		};
		var nearestOnTheLeftOfPoint = getNodeNearerPointOnLeft.bind(null, point, storage);
		//var nearestAbovePoint = getNodeNearerPointAbove.bind(null, point, storage);
		searchTextNode(el, nearestOnTheLeftOfPoint); // ||
		//searchTextNode(el, nearestAbovePoint);
		if (storage.textNode) {
			return createRangeAtTheEndOfRectInTextNode(storage.textNode, storage.rect);
		} else {
			return null;
		}
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

	function getNodeNearerPointOnLeft(point, storage, winner, rival) {
		var newWinner = winner;
		var nearestRivalRect = getRectNearestOnLeftOfPoint(rival, point);
		if (winner) {
			var nearestWinnerRect = getRectNearestOnLeftOfPoint(winner, point);
			if (areDifferent(nearestRivalRect, nearestWinnerRect) &&
				nearestRivalRect.right > nearestWinnerRect.right) {
				newWinner = rival;
				storage.rect = nearestRivalRect;
				storage.textNode = rival;
			}
		} else if (nearestRivalRect) {
			newWinner = rival;
			storage.rect = nearestRivalRect;
			storage.textNode = rival;
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

	function createRangeAtTheEndOfRectInTextNode(node, clientRect) {
		var rects = getRectsForNode(node);
		var lastRect = rects[rects.length - 1];
		if (clientRect === lastRect || !nodeIsText(node)) {
			var range = document.createRange();
			range.selectNode(node);
			return range;
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
				newWinner = rival;
			}
		} else if (nearestRivalRect) {
			newWinner = rival;
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

