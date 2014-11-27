(function($) {
	// Default configuration
	var settings;
	var defaults = {
		holdThreshold: 4,
		holdTimeout: 500,
		markerShiftY: 38,
		onSelectionChange: function() {},
		contextOrigin: {
			offsetX: 0,
			offsetY: 0,
			scale: 1
		}
	};

	// Collaborators
	var frameRequester = null;
	var startMarker;
	var endMarker;
	var movingMarker;
	var selectionDrawer = null;
	var environment;
	var contentContext;
	var markersContext;
	var hammer;

	window.CustomSelection = {
		Lib: {
			Markers: {}
		}
	};

//	jQuery Plugin --------------------------------------------------------------

	$.fn.customSelection = function(options) {
		settings = $.extend(defaults, options);
		contentContext = new CustomSelection.Lib.ContentContext(this);
		markersContext = new CustomSelection.Lib.Markers.MarkersContext();
		transformMarkerContext(settings.contextOrigin);
		environment = environment || performEnvTests();
		var rectangler = new CustomSelection.Lib.Rectangler(environment);
		frameRequester = new CustomSelection.Lib.FrameRequester();
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer(
			rectangler,
			environment,
			contentContext,
			{
				fillStyle: settings.selectionColor,
				markerShiftY: settings.markerShiftY
			}
		);
		initMarkers();
		disableNativeSelectionFor(contentContext.body);
		enableTouchSelectionFor(this);
		return this;
	};

	$.fn.refreshCustomSelection = function(contextOrigin) {
		transformMarkerContext(contextOrigin);
		refreshSelection();
		return this;
	};

	$.fn.clearCustomSelection = function() {
		clearSelection();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		clearSelection();
		restoreNativeSelectionFor(contentContext.body);
		disableTouchSelectionFor(this);
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
	var lastSelectionRange = null;
	var selectionAnchor = null;
	var userSelectBeforeEnablingSelection = null;

//	-- Binding events

	function initializeHammerFor($element) {
		hammer = new Hammer.Manager($element[0], {
			recognizers: [
				[Hammer.Press],
				[Hammer.Tap]
			]
		});
		hammer.set({
			holdThreshold: settings.holdThreshold,
			holdTimeout: settings.holdTimeout
		});
	}

	function enableTouchSelectionFor($element) {
		initializeHammerFor($element);
		$(startMarker.element).add(endMarker.element)
			.on('touchstart', handleMarkerTouchStart);
		$(markersContext.body)
			.on('touchmove', handleMarkerTouchMove)
			.on('touchend', handleMarkerTouchMoveEnd);
		$element.on('touchend', handleGlobalTouchEnd);
		hammer.on('press', handleGlobalTapHold);
		hammer.on('tap', clearSelection);
	}

	function disableTouchSelectionFor($element) {
		$(markersContext.body)
			.off('touchmove', handleMarkerTouchMove)
			.off('touchend', handleMarkerTouchMoveEnd);
		$element
			.off('touchend', handleGlobalTouchEnd);
		hammer.destroy();
	}

	function handleGlobalTapHold(e) {
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
		lastPoint = createPointFromMarkerEvent(jqueryEvent.originalEvent);
		frameRequester.requestFrame(function() {
			var eventTarget = getTouchedElementByPoint(lastPoint);
			var range = getRangeCoveringLastSelectionAndPointInElement(lastPoint, eventTarget);
			makeSelectionFor(range);
		});
	}

	function handleMarkerTouchStart(jqueryEvent) {
		jqueryEvent.preventDefault();
		movingMarker.setTo(jqueryEvent.target);
		selectionAnchor = getSelectionAnchor();
	}

	function handleMarkerTouchMove(jqueryEvent) {
		if (movingMarker.exists()) {
			handleMarkerPointerMove(jqueryEvent);
			rejectTouchEnd = true;
		}
	}

	function handleMarkerTouchMoveEnd() {
		selectionAnchor = null;
		movingMarker.unset();
	}

	function getSelectionAnchor() {
		if (movingMarker.isStartMarker()) {
			return getEndAnchorOf(lastSelectionRange);
		} else {
			return getStartAnchorOf(lastSelectionRange);
		}
	}

	// -- Dealing with native selection

	function disableNativeSelectionFor(element) {
		var $element = $(element);
		userSelectBeforeEnablingSelection = $element.css('user-select');
		$element.css('user-select', 'none');
	}

	function restoreNativeSelectionFor(element) {
		$(element).css('user-select', userSelectBeforeEnablingSelection);
	}

//	-- Creating Selection

	function selectWordUnderPointer(pointerEvent) {
		var element = getTargetElementFromPointerEvent(pointerEvent);
		if (!isMarker(element)) {
			clearSelection();
			var point = createPointFromEvent(pointerEvent);
			var range = getRangeWrappingWordAtPoint(element, point);
			makeSelectionFor(range);
			movingMarker.unset();
			rejectTouchEnd = true;
		}
	}

	function makeSelectionFor(range) {
		if (range) {
			if (rangeDiffersFromLastSelection(range)) {
				lastSelectionRange = range;
				drawSelectionRange();
				settings.onSelectionChange(lastSelectionRange);
			}
			showMarkers();
		}
	}

	function clearSelection() {
		if (doesRangeExist(lastSelectionRange)) {
			hideMarkers();
			selectionDrawer.clearSelection();
			settings.onSelectionChange(contentContext.createRange());
		}
		lastSelectionRange = null;
	}

	function refreshSelection() {
		drawSelectionRange();
	}

	function drawSelectionRange() {
		if (doesRangeExist(lastSelectionRange)) {
			selectionDrawer.redraw(lastSelectionRange);
			adjustMarkerPositionsTo(lastSelectionRange);
		}
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
		startMarker.alignToRange(range);
		endMarker.alignToRange(range);
	}

	function doesRangeExist(range) {
		return !!range && !!range.getBoundingClientRect() &&
				range.getClientRects().length > 0;
	}

//	-- Preparing Markers

	function transformMarkerContext(origin) {
		markersContext.setOffset({
			x: origin.offsetX,
			y: origin.offsetY
		});
		markersContext.setScale(origin.scale);
	}

	function initMarkers() {
		startMarker = new CustomSelection.Lib.Markers.StartMarker(contentContext,
			markersContext, $(settings.startMarker)[0]);
		endMarker = new CustomSelection.Lib.Markers.EndMarker(contentContext,
			markersContext, $(settings.endMarker)[0]);
		movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker);
		hideMarkers();
	}

	function isMarker(element) {
		return element === startMarker.element || element === endMarker.element;
	}

	function createPointFromMarkerEvent(pointerEvent) {
		var point = createPointFromEvent(pointerEvent, {shiftY: -settings.markerShiftY});
		point.convertToContentContext();
		return point;
	}

	function createPointFromEvent(pointerEvent, options) {
		return new CustomSelection.Lib.Point(pointerEvent, markersContext, environment, options);
	}

	function getTargetElementFromPointerEvent(pointerEvent) {
		var touches = pointerEvent.touches || pointerEvent.pointers;
		return touches[0].target;
	}

	function getTouchedElementByPoint(touchPoint) {
		hideMarkers();
		var element = contentContext.getElementByPoint(touchPoint);
		if (!element) {
			element = contentContext.body;
		}
		showMarkers();
		return element;
	}

	function hideMarkers() {
		startMarker.hide();
		endMarker.hide();
	}

	function showMarkers() {
		startMarker.show();
		endMarker.show();
	}

	function performEnvTests() {
		var env = new CustomSelection.Lib.EnvironmentChecker();
		return {
			isWebkit: env.isWebkit(),
			isAppleDevice: env.isAppleDevice(),
			isAndroidLowerThanKitkat: env.isAndroidLowerThan('4.4'),
			isAndroidStackBrowser: env.isAndroidStackBrowser()
		};
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
			if (range.startOffset > 0) {
				range.setStart(range.startContainer, range.startOffset - 1);
			} else if (!putRangeStartAtTheEndOfPreviousTextNode(range)) {
				return;
			}
		}
		range.setStart(range.startContainer, range.startOffset + 1);

		if (rangeStartsOnWhitespaceAtTheEndOfNode(range)) {
			range.setStart(getTextNodeAfter(range.startContainer), 0);
		}
	}

	function expandRangeToEndBeforeTheWhitespaceOnRight(range) {
		// searching space forwards
		while (!rangeEndsWithWhitespace(range)) {
			var maxIndex = range.endContainer.data.length;
			if (range.endOffset < maxIndex) {
				range.setEnd(range.endContainer, range.endOffset + 1);
			} else if (!putRangeEndAtTheBeginningOfNextTextNode(range)) {
				return;
			}
		}
		range.setEnd(range.endContainer, Math.max(range.endOffset - 1, 0));
	}

	function rangeStartsWithWhitespace(range) {
		return range.toString().charCodeAt(0) in WHITESPACE_LIST;
	}

	function rangeEndsWithWhitespace(range) {
		var stringified = range.toString();
		return stringified.charCodeAt(stringified.length - 1) in WHITESPACE_LIST;
	}

	function putRangeStartAtTheEndOfPreviousTextNode(range) {
		var newStartContainer;
		if (newStartContainer = getTextNodeBefore(range.startContainer)) {
			range.setStart(newStartContainer, newStartContainer.data.length);
			return true;
		} else {
			return false;
		}
	}

	function putRangeEndAtTheBeginningOfNextTextNode(range) {
		var newEndContainer;
		if (newEndContainer = getTextNodeAfter(range.endContainer)) {
			range.setEnd(newEndContainer, 0);
			return true;
		} else {
			return false;
		}
	}

	function rangeStartsOnWhitespaceAtTheEndOfNode(range) {
		return nodeEndsWithWhitespace(range.startContainer) &&
				(range.startOffset === range.startContainer.data.length ||
				range.startOffset === range.startContainer.data.length - 1);
	}

	function nodeEndsWithWhitespace(node) {
		return node.data.charCodeAt(node.data.length - 1) in WHITESPACE_LIST;
	}

//	-- Marking

	function getRangeCoveringLastSelectionAndPointInElement(point, element) {
		var coveringRange = lastSelectionRange.cloneRange();
		var pointAnchor = convertPointInElementToAnchor(element, point);
		if (pointAnchor) {
			var bound = getNewSelectionBoundary(pointAnchor);
			var protectedBound = getProtectedSelectionBoundary();
			bound.applyTo(coveringRange);
			if (coveringRange.collapsed) {
				protectedBound.applyTo(coveringRange);
				bound.applyOppositeTo(coveringRange);
				movingMarker.toggleMoving();
			}
		}
		return coveringRange;
	}

	function getNewSelectionBoundary(anchor) {
		if (movingMarker.isStartMarker()) {
			return createStartBoundary(anchor);
		} else {
			return createEndBoundary(anchor);
		}
	}

	function getProtectedSelectionBoundary() {
		return getNewSelectionBoundary(getSelectionAnchor());
	}

	function convertPointInElementToAnchor(element, point) {
		var pointRange;
		var pointAnchor = null;
		if (pointRange = getPointRangeFromElement(element, point)) {
			pointAnchor = getStartAnchorOf(pointRange);
		} else if (pointRange = getClosestPointRangeFormElement(element, point)) {
			pointAnchor = getEndAnchorOf(pointRange);
		}
		return pointAnchor;
	}

	function getPointRangeFromElement(element, point) {
		var textNode = getFromElNodeContainingPoint(element, point);
		var pointRange = null;
		if (textNode) {
			pointRange = getFromTextNodeMinimalRangeContainingPoint(textNode, point);
		}
		return pointRange;
	}

	function getFromTextNodeMinimalRangeContainingPoint(textNode, point) {
		var range = contentContext.createRange();
		var startIndex = 0;
		var maxIndex = textNode.data.length;
		var endIndex = maxIndex;
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
		if (range.collapsed && range.endOffset < maxIndex) {
			range.setEnd(textNode, range.endOffset + 1);
		}
		return range;
	}

	function createStartBoundary(anchor) {
		return new CustomSelection.Lib.StartBoundary(anchor);
	}

	function createEndBoundary(anchor) {
		return new CustomSelection.Lib.EndBoundary(anchor);
	}

	function getStartAnchorOf(range) {
		return {
			container: range.startContainer,
			offset: range.startOffset
		};
	}

	function getEndAnchorOf(range) {
		return {
			container: range.endContainer,
			offset: range.endOffset
		};
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
		var range = contentContext.createRange();
		range.selectNode(node);
		return range.getClientRects();
	}

	function rectContainsPoint(rect, point) {
		return rectContainsPointVertically(rect, point) &&
		rectOrItsBoundsContainPointHorizontally(rect, point);
	}

	function rectContainsPointVertically(rect, point) {
		var y = environment.isAppleDevice ? point.pageY : point.clientY;
		return y > rect.top && y < rect.bottom;
	}

	function rectOrItsBoundsContainPointHorizontally(rect, point) {
		var x = environment.isAppleDevice ? point.pageX : point.clientX;
		return x >= rect.left && x <= rect.right;
	}

	function nodeIsText(node) {
		return node.nodeType === Node.TEXT_NODE && node.length > 0;
	}

	function nodeHasChildren(node) {
		return node.childNodes.length > 0;
	}

	function getSiblingAfterParentOf(node) {
		while (!node.nextSibling) {
			if (node === node.ownerDocument.body) {
				return null;
			}
			node = node.parentNode;
		}
		return node.nextSibling;
	}

	function getSiblingBeforeParentOf(node) {
		while (!node.previousSibling) {
			if (node === node.ownerDocument.body) {
				return null;
			}
			node = node.parentNode;
		}
		return node.previousSibling;
	}

	function getTextNodeAfter(textNode) {
		var node = textNode;
		var uncle;
		do {
			if (nodeHasChildren(node)) {
				node = node.childNodes[0];
			} else if (node.nextSibling) {
				node = node.nextSibling;
			} else if ((uncle = getSiblingAfterParentOf(node))) {
				node = uncle;
			} else {
				return null;
			}
		} while (!nodeIsText(node));
		return node;
	}

	function getTextNodeBefore(textNode) {
		var node = textNode;
		var uncle;
		do {
			if (nodeHasChildren(node)) {
				node = node.childNodes[node.childNodes.length - 1];
			} else if (node.previousSibling) {
				node = node.previousSibling;
			} else if ((uncle = getSiblingBeforeParentOf(node))) {
				node = uncle;
			} else {
				return null;
			}
		} while (!nodeIsText(node));
		return node;
	}

//  ------ Finding the closest node to the pointer

	var closestNode;
	var closestRectInNode;

	function getClosestPointRangeFormElement(el, point) {
		var pointRange = null;
		var nearestOnTheLeftOfPoint = createNodeComparator({
			point: point,
			getBetterRect: getRectMoreOnTheRight,
			getBestRectFromNode: getRectNearestOnLeftOfPoint
		});
		var nearestAbovePoint = createNodeComparator({
			point: point,
			getBetterRect: getLowerRect,
			getBestRectFromNode: getRectNearestAbovePoint
		});

		var closestNodeFound =
				searchTextNode(el, nearestOnTheLeftOfPoint) ||
				searchTextNode(el, nearestAbovePoint);

		if (closestNodeFound) {
			pointRange = createRangeAtTheEndOfTheClosestNode();
			setClosestNodeAndRect(null, null);
		}
		return pointRange;
	}

	function setClosestNodeAndRect(node, rect) {
		closestNode = node;
		closestRectInNode = rect;
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
		var bestNode = null;
		if (el) {
			var nodes = el.childNodes;
			for (var i = 0, n; n = nodes[i++];) {
				var rects;
				if ((rects = getRectsForNode(n)) && rects.length &&
					(nodeHasChildren(n) || nodeIsText(n))) {
					bestNode = comparator(bestNode, n);
				}
			}
		}
		return bestNode;
	}

	function createNodeComparator(options) {
		var point = options.point;
		var getBetterRect = options.getBetterRect;
		var getBestRectFromNode = options.getBestRectFromNode;
		return function(winner, rival) {
			var newWinner = winner;
			var nearestRivalRect = getBestRectFromNode(rival, point);
			if (winner) {
				var nearestWinnerRect = getBestRectFromNode(winner, point);
				if (areDifferent(nearestRivalRect, nearestWinnerRect) &&
						getBetterRect(nearestRivalRect, nearestWinnerRect) === nearestRivalRect) {
					newWinner = rival;
					setClosestNodeAndRect(rival, nearestRivalRect);
				}
			} else if (nearestRivalRect) {
				newWinner = rival;
				setClosestNodeAndRect(rival, nearestRivalRect);
			}
			return newWinner;
		};
	}

//	-------- Finding node on the **left** of the pointer

	function getRectMoreOnTheRight(rectA, rectB) {
		if (rectA.right > rectB.right) {
			return rectA;
		} else if (rectB.right > rectA.right) {
			return rectB;
		} else {
			return null;
		}
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

	function createRangeAtTheEndOfTheClosestNode() {
		var rects = getRectsForNode(closestNode);
		var lastRectInNode = rects[rects.length - 1];
		if (closestRectInNode === lastRectInNode) {
			var range = document.createRange();
			range.selectNode(closestNode);
			return range;
		} else {
			var pointAtRightBoundaryOfRect = {
				clientX: closestRectInNode.right - 1,
				clientY: closestRectInNode.bottom - 1
			};
			return getFromTextNodeMinimalRangeContainingPoint(closestNode, pointAtRightBoundaryOfRect);
		}
	}

//	-------- Finding node **above** the pointer

	function getLowerRect(rectA, rectB) {
		if (rectA.top >= rectB.top) {
			return rectA;
		} else if (rectB.top >= rectA.top) {
			return rectB;
		} else {
			return null;
		}
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

