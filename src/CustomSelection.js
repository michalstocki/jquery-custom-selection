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
	var lastSelection;
	var pointFactory;
	var rightPointSnapper;
	var belowPointSnapper;
	var hammer;

	window.CustomSelection = {
		Lib: {
			Markers: {},
			Point: {},
			Utils: {}
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
		lastSelection = new CustomSelection.Lib.LastSelection();
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer(
			rectangler,
			environment,
			contentContext,
			{
				fillStyle: settings.selectionColor,
				markerShiftY: settings.markerShiftY
			}
		);
		pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, markersContext);
		var nodeUtil = new CustomSelection.Lib.Utils.NodeUtil(contentContext);
		rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil);
		belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil);
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
		lastPoint = pointFactory.createFromMarkerEvent(jqueryEvent.originalEvent, -settings.markerShiftY);
		frameRequester.requestFrame(function() {
			var eventTarget = getTouchedElementByPoint(lastPoint);
			var range = getRangeCoveringLastSelectionAndPointInElement(lastPoint, eventTarget);
			makeSelectionFor(range);
		});
	}

	function handleMarkerTouchStart(jqueryEvent) {
		jqueryEvent.preventDefault();
		movingMarker.setTo(jqueryEvent.target);
	}

	function handleMarkerTouchMove(jqueryEvent) {
		if (movingMarker.exists()) {
			handleMarkerPointerMove(jqueryEvent);
			rejectTouchEnd = true;
		}
	}

	function handleMarkerTouchMoveEnd() {
		movingMarker.unset();
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
			var point = pointFactory.createFromContentEvent(pointerEvent);
			var range = getRangeWrappingWordAtPoint(element, point);
			makeSelectionFor(range);
			movingMarker.unset();
			rejectTouchEnd = true;
		}
	}

	function makeSelectionFor(range) {
		if (range) {
			if (!lastSelection.rangeEqualsTo(range)) {
				drawRange(range);
				settings.onSelectionChange(range);
				lastSelection.range = range;
			}
			showMarkers();
		}
	}

	function clearSelection() {
		if (lastSelection.exists()) {
			hideMarkers();
			selectionDrawer.clearSelection();
			settings.onSelectionChange(contentContext.createRange());
		}
		lastSelection.range = null;
	}

	function refreshSelection() {
		if (lastSelection.exists()) {
			drawRange(lastSelection.getRange());
		}
	}

	function drawRange(range) {
		selectionDrawer.redraw(range);
		startMarker.alignToRange(range);
		endMarker.alignToRange(range);
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
		var coveringRange = lastSelection.cloneRange();
		var pointAnchor = convertPointInElementToAnchor(element, point);
		if (pointAnchor) {
			var movingBound = getNewSelectionBoundary(pointAnchor);
			var protectedBound = getProtectedSelectionBoundary();
			movingBound.applyTo(coveringRange);
			if (coveringRange.collapsed) {
				protectedBound.applyOppositeTo(coveringRange);
				movingBound.applyOppositeTo(coveringRange);
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
		var selectionAnchor;
		if (movingMarker.isStartMarker()) {
			selectionAnchor = getEndAnchorOf(lastSelection.range);
			return createEndBoundary(selectionAnchor);
		} else {
			selectionAnchor = getStartAnchorOf(lastSelection.range);
			return createStartBoundary(selectionAnchor);
		}
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

	function getClosestPointRangeFormElement(el, point) {
		var pointRange = null;
		var closestPoint = rightPointSnapper.snapPointToTextInElement(point, el) ||
			belowPointSnapper.snapPointToTextInElement(point, el);
		if (closestPoint) {
			pointRange = getFromTextNodeMinimalRangeContainingPoint(
				closestPoint.parentText, closestPoint);
		}
		return pointRange;
	}

})(jQuery);

