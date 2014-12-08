(function($) {
	// Default configuration
	var settings;
	var defaults = {
		holdThreshold: 4,
		holdTimeout: 500,
		markerShiftY: 38,
		onSelectionChange: function() {},
		contentOrigin: {
			offsetX: 0,
			offsetY: 0,
			scale: 1
		}
	};

	// Collaborators
	var frameRequester = null;
	var movingMarker;
	var markersWrapper;
	var selectionDrawer = null;
	var contentContext;
	var contextTranslator;
	var lastSelection;
	var pointFactory;
	var wordRangeBuilder;
	var selectionRangeBuilder;
	var hammer;

	window.CustomSelection = {
		Lib: {
			Markers: {},
			Point: {},
			Range: {},
			Utils: {}
		}
	};

//	jQuery Plugin --------------------------------------------------------------

	$.fn.customSelection = function(options) {
		settings = $.extend(defaults, options);
		contentContext = new CustomSelection.Lib.ContentContext(this);
		contextTranslator = new CustomSelection.Lib.ContextTranslator();
		contextTranslator.setContentTransformationFromMarkersContext(settings.contentOrigin);
		var environment = performEnvTests();
		var rectangler = new CustomSelection.Lib.Rectangler(environment);
		frameRequester = new CustomSelection.Lib.FrameRequester();
		lastSelection = new CustomSelection.Lib.Range.LastSelection();
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer(
			rectangler,
			environment,
			contentContext,
			{
				fillStyle: settings.selectionColor,
				markerShiftY: settings.markerShiftY
			}
		);
		var nodeUtil = new CustomSelection.Lib.Utils.NodeUtil();
		var pointLocator = new CustomSelection.Lib.Point.PointLocator(environment, nodeUtil);
		var startMarker = new CustomSelection.Lib.Markers.StartMarker(contentContext, contextTranslator, $(settings.startMarker)[0]);
		var endMarker = new CustomSelection.Lib.Markers.EndMarker(contentContext, contextTranslator, $(settings.endMarker)[0]);
		movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker);
		markersWrapper = new CustomSelection.Lib.Markers.MarkersWrapper(startMarker, endMarker);
		var pointTargetLocator = new CustomSelection.Lib.Point.PointTargetLocator(contentContext, nodeUtil, markersWrapper, pointLocator);
		pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, contextTranslator, pointTargetLocator);
		var rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil);
		var belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil);
		var boundFactory = new CustomSelection.Lib.Range.SelectionBoundFactory(lastSelection, movingMarker);
		var pointToRangeConverter = new CustomSelection.Lib.Point.PointToRangeConverter(pointLocator, contentContext, rightPointSnapper, belowPointSnapper);
		wordRangeBuilder = new CustomSelection.Lib.Range.WordRangeBuilder(nodeUtil, pointToRangeConverter);
		selectionRangeBuilder = new CustomSelection.Lib.Range.SelectionRangeBuilder(contentContext, pointToRangeConverter, boundFactory, movingMarker);
		hammer = new CustomSelection.Lib.HammerAdapter(settings);
		markersWrapper.hideMarkers();
		contentContext.disableNativeSelection();
		enableTouchSelectionFor(this);
		return this;
	};

	$.fn.refreshCustomSelection = function(contentOrigin) {
		if (contentOrigin) {
			contextTranslator.setContentTransformationFromMarkersContext(contentOrigin);
		}
		refreshSelection();
		return this;
	};

	$.fn.clearCustomSelection = function() {
		clearSelection();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		clearSelection();
		disableTouchSelectionFor(this);
		contentContext.restoreNativeSelection();
		return this;
	};

//	Private methods ------------------------------------------------------------

	var lastPoint = null;
	var rejectTouchEnd = false;

//	-- Binding events

	function enableTouchSelectionFor($element) {
		markersWrapper.$markerElements
			.on('touchstart', handleMarkerTouchStart);
		markersWrapper.$markersBody
			.on('touchmove', handleMarkerTouchMove)
			.on('touchend', handleMarkerTouchMoveEnd);
		$element.on('touchend', handleGlobalTouchEnd);
		hammer.bindTapHoldInElement($element[0], handleGlobalTapHold);
		hammer.bindTapInElement($element[0], clearSelection);
	}

	function disableTouchSelectionFor($element) {
		markersWrapper.$markersBody
			.off('touchmove', handleMarkerTouchMove)
			.off('touchend', handleMarkerTouchMoveEnd);
		$element
			.off('touchend', handleGlobalTouchEnd);
		hammer.destroyBindingsFor($element[0]);
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

	function handleMarkerPointerMove(jqueryEvent) {
		jqueryEvent.preventDefault();
		lastPoint = pointFactory.createFromMarkerEvent(jqueryEvent.originalEvent, -settings.markerShiftY);
		frameRequester.requestFrame(function() {
			var range = selectionRangeBuilder.getRangeUpdatedWithPoint(lastPoint);
			makeSelectionFor(range);
		});
	}

//	-- Creating Selection

	function selectWordUnderPointer(pointerEvent) {
		var element = getTargetElementFromPointerEvent(pointerEvent);
		if (!markersWrapper.isMarkerElement(element)) {
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
			markersWrapper.showMarkers();
		}
	}

	function clearSelection() {
		if (lastSelection.exists()) {
			markersWrapper.hideMarkers();
			selectionDrawer.clearSelection();
			settings.onSelectionChange(contentContext.createRange());
		}
		lastSelection.range = null;
	}

	function refreshSelection() {
		if (lastSelection.exists()) {
			drawRange(lastSelection.range);
		}
	}

	function drawRange(range) {
		selectionDrawer.redraw(range);
		markersWrapper.alignMarkersToRange(range);
	}

//	-- Preparing Markers

	function getTargetElementFromPointerEvent(pointerEvent) {
		var touches = pointerEvent.touches || pointerEvent.pointers;
		return touches[0].target;
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