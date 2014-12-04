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
	var wordRangeBuilder;
	var selectionRangeBuilder;
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
		var nodeUtil = new CustomSelection.Lib.Utils.NodeUtil(contentContext);
		var pointLocator = new CustomSelection.Lib.Point.PointLocator(environment, nodeUtil);
		startMarker = new CustomSelection.Lib.Markers.StartMarker(contentContext, markersContext, $(settings.startMarker)[0]);
		endMarker = new CustomSelection.Lib.Markers.EndMarker(contentContext, markersContext, $(settings.endMarker)[0]);
		movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker);
		var pointTargetLocator = new CustomSelection.Lib.Point.PointTargetLocator(contentContext, nodeUtil, startMarker, endMarker, pointLocator);
		pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, markersContext, pointTargetLocator);
		var rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil);
		var belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil);
		var boundFactory = new CustomSelection.Lib.SelectionBoundFactory(lastSelection, movingMarker);
		var pointToRangeConverter = new CustomSelection.Lib.Point.PointToRangeConverter(pointLocator, contentContext, nodeUtil, rightPointSnapper, belowPointSnapper);
		wordRangeBuilder = new CustomSelection.Lib.WordRangeBuilder(nodeUtil, pointToRangeConverter);
		selectionRangeBuilder = new CustomSelection.Lib.SelectionRangeBuilder(contentContext, pointToRangeConverter, boundFactory, movingMarker);
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
			var range = selectionRangeBuilder.getRangeUpdatedWithPoint(lastPoint);
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
			var range = wordRangeBuilder.getRangeOfWordUnderPoint(point);
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

})(jQuery);