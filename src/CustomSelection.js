(function($) {
	var MARKER_CLASS = 'jcs-marker';
	var MARKER_START_CLASS = 'jcs-beginning-marker';
	var MARKER_END_CLASS = 'jcs-end-marker';
	var MARKER_MOVING_CLASS = 'jcs-marker-moving';

	// Default configuration
	var settings;
	var defaults = {
		holdThreshold: 4,
		holdTimeout: 500,
		onSelectionChange: function() {},
		scaleGetter: function() {
			return 1;
		}
	};
	var isAppleDevice = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

	// Collaborators
	var frameRequester = null;
	var startMarker = null;
	var endMarker = null;
	var selectionDrawer = null;
	var hammer;

	window.CustomSelection = {
		Lib: {}
	};

//	jQuery Plugin --------------------------------------------------------------

	$.fn.customSelection = function(options) {
		settings = $.extend(defaults, options);
		useContextOf(this);
		frameRequester = new CustomSelection.Lib.FrameRequester();
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer({
			$element: this,
			contextWindow: contextWindow,
			contextDocument: contextDocument,
			fillStyle: settings.selectionColor
		});
		initMarkers(this);
		disableNativeSelectionFor(contextDocument.body);
		enableTouchSelectionFor(this);
		return this;
	};

	$.fn.clearCustomSelection = function() {
		clearSelection();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		clearSelection();
		restoreNativeSelectionFor(contextDocument.body);
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
	var contextWindow = null;
	var contextDocument = null;
	var lastSelectionRange = null;
	var movedMarker = null;
	var selectionAnchor = null;
	var userSelectBeforeEnablingSelection = null;
	var markersOriginOffset = {
		x: 0,
		y: 0
	};

//	-- Binding events

	function useContextOf($element) {
		contextDocument = $element[0].ownerDocument;
		contextWindow = getWindowOf($element[0]);
	}

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
		$(startMarker).add(endMarker)
			.on('touchstart', handleMarkerTouchStart);
		$(getBodyOf(startMarker))
			.on('touchmove', handleMarkerTouchMove)
			.on('touchend', handleMarkerTouchMoveEnd);
		$element.on('touchend', handleGlobalTouchEnd);
		hammer.on('press', handleGlobalTapHold);
		hammer.on('tap', clearSelection);
		$(contextWindow).on('orientationchange resize', handleResize);
	}

	function disableTouchSelectionFor($element) {
		$(getBodyOf(startMarker))
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
		setMovedMarker(jqueryEvent.target);
		selectionAnchor = getSelectionAnchor();
	}

	function handleMarkerTouchMove(jqueryEvent) {
		if (movedMarker) {
			handleMarkerPointerMove(jqueryEvent);
			rejectTouchEnd = true;
		}
	}

	function handleMarkerTouchMoveEnd() {
		if (movedMarker) {
			unsetMovedMarker();
			selectionAnchor = null;
		}
	}

	function handleResize() {
		if (lastSelectionRange) {
			drawSelectionRange();
		}
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

	function getContextScale() {
		return settings.scaleGetter();
	}

	function getBodyOf(element) {
		return element.ownerDocument.body;
	}

	function getWindowOf(element) {
		var doc = element.ownerDocument;
		return doc.defaultView || doc.parentWindow;
	}

	function getSelectionAnchor() {
		if (movedMarker === startMarker) {
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
			var point = createPointFromEvent(pointerEvent, {shift: false});
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
		var firstRect = rects[0];
		var lastRect = rects[rects.length - 1];
		$(startMarker).css({
			top: yToMarkersContext(firstRect.bottom),
			left: xToMarkersContext(firstRect.left)
		});
		$(endMarker).css({
			top: yToMarkersContext(lastRect.bottom),
			left: xToMarkersContext(lastRect.right)
		});
	}

//	-- Preparing Markers

	function initMarkers($element) {
		startMarker = $(settings.startMarker)[0] ||
			createMarkerInside($element, MARKER_START_CLASS);
		endMarker = $(settings.endMarker)[0] ||
			createMarkerInside($element, MARKER_END_CLASS);

		markersOriginOffset = getMarkersOriginOffset($element);
		hideMarkers();
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

	function createPointFromMarkerEvent(pointerEvent) {
		var point = createPointFromEvent(pointerEvent);
		point.translate(getVectorOfMarkersOrigin());
		point.scale(getScaleOfMarkersContext());
		return point;
	}

	function createPointFromEvent(pointerEvent, options) {
		return new CustomSelection.Lib.Point(pointerEvent, options);
	}

	function getVectorOfMarkersOrigin() {
		var offset = markersOriginOffset;
		return {x: -offset.framesOffset.x, y: -offset.framesOffset.y};
	}

	function getScaleOfMarkersContext() {
		return 1 / getContextScale();
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

	function hasTheSameOffsetParent(elementA, elementB) {
		return elementA.offsetParent === elementB.offsetParent;
	}

	function getMarkersOriginOffset($element) {
		if (hasTheSameOffsetParent(startMarker, endMarker)) {
			return computeMarkerOffsetRelativeTo($element);
		} else {
			throw new Error('Both marker elements must have the same offset parent!');
		}
	}

//	---- Synchronizing origin of the markers with origin of the $element

	function computeMarkerOffsetRelativeTo($element) {
		var elementWindowOffset = getElementWindowOffset($element[0]);
		var markersWindowOffset = getElementWindowOffset(startMarker);

		var framesOffset = {
			x: elementWindowOffset.left - markersWindowOffset.left,
			y: elementWindowOffset.top - markersWindowOffset.top
		};

		var markersRelativeOriginOffset = getElementOriginOffset(startMarker);
		var elementRelativeOriginOffset = getScaledElementOriginOffset($element[0]);
		return {
			x: framesOffset.x + elementRelativeOriginOffset.left - markersRelativeOriginOffset.left,
			y: framesOffset.y + elementRelativeOriginOffset.top - markersRelativeOriginOffset.top,
			framesOffset: framesOffset
		};
	}

	function getScaledElementOriginOffset(element) {
		var relativeOriginOffset = getElementOriginOffset(element);
		return {
			left: relativeOriginOffset.left * getContextScale(),
			top: relativeOriginOffset.top * getContextScale()
		};
	}

	function getElementOriginOffset(element) {
		var offsetParent = element.offsetParent;
		return offsetParent.getBoundingClientRect();
	}

	function getElementWindowOffset(element) {
		var win = getWindowOf(element);
		return computeFrameOffset(win);
	}

	function computeFrameOffset(win) {
		var dimensions = {top: 0, left: 0};
		var frame = win.frameElement;
		if (frame) {
			var frameRect = frame.getBoundingClientRect();
			var frameBodyRect = win.document.body.getBoundingClientRect();
			dimensions.left += frameRect.left + frame.clientLeft - frameBodyRect.left;
			dimensions.top += frameRect.top + frame.clientTop - frameBodyRect.top;
			if (win !== top) {
				computeFrameOffset(win.parent, dimensions);
			}
		}
		return dimensions;
	}

	function xToMarkersContext(x) {
		return x * getContextScale() + markersOriginOffset.x;
	}

	function yToMarkersContext(y) {
		return y * getContextScale() + markersOriginOffset.y;
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
		var coveringRange = lastSelectionRange.cloneRange();
		var pointAnchor = convertPointInElementToAnchor(element, point);
		if (pointAnchor) {
			var bound = getNewSelectionBoundary(pointAnchor);
			var protectedBound = getProtectedSelectionBoundary();
			bound.applyTo(coveringRange);
			if (coveringRange.collapsed) {
				protectedBound.applyTo(coveringRange);
				bound.applyOppositeTo(coveringRange);
				toggleMovedMarker();
			}
		}
		return coveringRange;
	}

	function getNewSelectionBoundary(anchor) {
		if (movedMarker === startMarker) {
			return createStartBoundary(anchor);
		} else {
			return createEndBoundary(anchor);
		}
	}

	function getProtectedSelectionBoundary() {
		var selectionAnchor = getSelectionAnchor();
		if (movedMarker === startMarker) {
			return createStartBoundary(selectionAnchor);
		} else {
			return createEndBoundary(selectionAnchor);
		}
	}

	function convertPointInElementToAnchor(element, point) {
		var textNode;
		var pointRange;
		var pointAnchor = null;
		if ((textNode = getFromElNodeContainingPoint(element, point)) &&
				(pointRange = getFromTextNodeMinimalRangeContainingPoint(textNode, point))) {
			pointAnchor = getStartAnchorOf(pointRange);
		} else if (pointRange = getClosestPointRangeFormElement(element, point)) {
			pointAnchor = getEndAnchorOf(pointRange);
		}
		return pointAnchor;
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
		var lastRect = rects[rects.length - 1];
		if (closestRectInNode === lastRect || !nodeIsText(closestNode)) {
			var range = document.createRange();
			range.selectNode(closestNode);
			return range;
		} else {
			var point = {
				clientX: closestRectInNode.right - 1,
				clientY: closestRectInNode.bottom - 1
			};
			return getFromTextNodeMinimalRangeContainingPoint(closestNode, point);
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

