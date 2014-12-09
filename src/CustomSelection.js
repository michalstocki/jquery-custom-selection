(function($) {
	// Default configuration
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
	var contentContext;
	var contextTranslator;
	var selectionApplier;
	var pointerEventBinder;

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
		var element = this[0];
		var settings = $.extend(defaults, options);
		contentContext = new CustomSelection.Lib.ContentContext(element);
		contextTranslator = new CustomSelection.Lib.ContextTranslator();
		contextTranslator.setContentTransformationFromMarkersContext(settings.contentOrigin);
		var environment = performEnvTests();
		var rectangler = new CustomSelection.Lib.Rectangler(environment);
		var frameRequester = new CustomSelection.Lib.FrameRequester();
		var lastSelection = new CustomSelection.Lib.Range.LastSelection();
		var selectionDrawer = new CustomSelection.Lib.SelectionDrawer(rectangler, environment, contentContext, {
			fillStyle: settings.selectionColor,
			markerShiftY: settings.markerShiftY
		});
		var nodeUtil = new CustomSelection.Lib.Utils.NodeUtil();
		var pointLocator = new CustomSelection.Lib.Point.PointLocator(environment, nodeUtil);
		var startMarker = new CustomSelection.Lib.Markers.StartMarker(contentContext, contextTranslator, $(settings.startMarker)[0]);
		var endMarker = new CustomSelection.Lib.Markers.EndMarker(contentContext, contextTranslator, $(settings.endMarker)[0]);
		var movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker);
		var markersWrapper = new CustomSelection.Lib.Markers.MarkersWrapper(startMarker, endMarker);
		var pointTargetLocator = new CustomSelection.Lib.Point.PointTargetLocator(contentContext, nodeUtil, markersWrapper, pointLocator);
		var pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, contextTranslator, pointTargetLocator);
		var rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil);
		var belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil);
		var boundFactory = new CustomSelection.Lib.Range.SelectionBoundFactory(lastSelection, movingMarker);
		var pointToRangeConverter = new CustomSelection.Lib.Point.PointToRangeConverter(pointLocator, contentContext, rightPointSnapper, belowPointSnapper);
		var wordRangeBuilder = new CustomSelection.Lib.Range.WordRangeBuilder(nodeUtil, pointToRangeConverter);
		var selectionRangeBuilder = new CustomSelection.Lib.Range.SelectionRangeBuilder(contentContext, pointToRangeConverter, boundFactory, movingMarker);
		var hammer = new CustomSelection.Lib.HammerAdapter(settings);
		selectionApplier = new CustomSelection.Lib.SelectionApplier(settings, lastSelection, markersWrapper, selectionDrawer);
		var selectionConstructor = new CustomSelection.Lib.Range.SelectionConstructor(settings, selectionRangeBuilder, markersWrapper, pointFactory, wordRangeBuilder, frameRequester);
		var pointerEventBus = new CustomSelection.Lib.PointerEventBus(movingMarker, selectionApplier, selectionConstructor);
		pointerEventBinder = new CustomSelection.Lib.PointerEventBinder(element, hammer, markersWrapper, pointerEventBus);

		markersWrapper.hideMarkers();
		contentContext.disableNativeSelection();
		return this;
	};

	$.fn.refreshCustomSelection = function(contentOrigin) {
		if (contentOrigin) {
			contextTranslator.setContentTransformationFromMarkersContext(contentOrigin);
		}
		selectionApplier.refreshSelection();
		return this;
	};

	$.fn.clearCustomSelection = function() {
		selectionApplier.clearSelection();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		selectionApplier.clearSelection();
		pointerEventBinder.destroyBindings();
		contentContext.restoreNativeSelection();
		return this;
	};

//	Private methods ------------------------------------------------------------

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