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
	var contentContext;
	var markersContext;
	var lastSelection;
	var pointFactory;
	var rightPointSnapper;
	var belowPointSnapper;
	var nodeUtil;
	var boundFactory;
	var pointLocator;
	var pointToRangeConverter;
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
		var environment = performEnvTests();
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
		nodeUtil = new CustomSelection.Lib.Utils.NodeUtil(contentContext);
		pointLocator = new CustomSelection.Lib.Point.PointLocator(environment, nodeUtil);
		startMarker = new CustomSelection.Lib.Markers.StartMarker(contentContext, markersContext, $(settings.startMarker)[0]);
		endMarker = new CustomSelection.Lib.Markers.EndMarker(contentContext, markersContext, $(settings.endMarker)[0]);
		movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker);
		var pointTargetLocator = new CustomSelection.Lib.Point.PointTargetLocator(contentContext, nodeUtil, startMarker, endMarker, pointLocator);
		pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, markersContext, pointTargetLocator);
		rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil);
		belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil);
		boundFactory = new CustomSelection.Lib.RangeBoundaryFactory(lastSelection, movingMarker);
		pointToRangeConverter = new CustomSelection.Lib.Point.PointToRangeConverter(pointLocator, contentContext);
		hideMarkers();
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
			var range = getRangeCoveringLastSelectionAndPoint(lastPoint);
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
			var range = getRangeWrappingWordAtPoint(point);
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

	function isMarker(element) {
		return element === startMarker.element || element === endMarker.element;
	}

	function getTargetElementFromPointerEvent(pointerEvent) {
		var touches = pointerEvent.touches || pointerEvent.pointers;
		return touches[0].target;
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

	function getRangeWrappingWordAtPoint(point) {
		var range = null;
		if (nodeUtil.nodeIsText(point.target)) {
			range = pointToRangeConverter.pointToRange(point);
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
			range.setStart(nodeUtil.getTextNodeAfter(range.startContainer), 0);
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
		if (newStartContainer = nodeUtil.getTextNodeBefore(range.startContainer)) {
			range.setStart(newStartContainer, newStartContainer.data.length);
			return true;
		} else {
			return false;
		}
	}

	function putRangeEndAtTheBeginningOfNextTextNode(range) {
		var newEndContainer;
		if (newEndContainer = nodeUtil.getTextNodeAfter(range.endContainer)) {
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

	function getRangeCoveringLastSelectionAndPoint(point) {
		var coveringRange = lastSelection.cloneRange();
		var pointAnchor = convertPointToAnchor(point);
		if (pointAnchor) {
			var movingBound = boundFactory.getMovingSelectionBound(pointAnchor);
			var protectedBound = boundFactory.getProtectedSelectionBound();
			movingBound.applyTo(coveringRange);
			if (coveringRange.collapsed) {
				protectedBound.applyOppositeTo(coveringRange);
				movingBound.applyOppositeTo(coveringRange);
				movingMarker.toggleMoving();
			}
		}
		return coveringRange;
	}

	function convertPointToAnchor(point) {
		var pointRange;
		var pointAnchor = null;
		if (nodeUtil.nodeIsText(point.target)) {
			pointRange = pointToRangeConverter.pointToRange(point);
			pointAnchor = getStartAnchorOf(pointRange);
		} else if (point = snapPointToText(point)) {
			pointRange = pointToRangeConverter.pointToRange(point);
			pointAnchor = getEndAnchorOf(pointRange);
		}
		return pointAnchor;
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

//  ------ Finding the closest node to the pointer

	function snapPointToText(point) {
		return rightPointSnapper.snapPointToTextInElement(point, point.target) ||
			belowPointSnapper.snapPointToTextInElement(point, point.target);
	}

})(jQuery);