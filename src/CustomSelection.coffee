class window.CustomSelection

	DEFAULTS =
		holdThreshold: 4
		holdTimeout: 500
		markerShiftY: 38
		onSelectionChange: ->
		contentOrigin:
			offsetX: 0
			offsetY: 0
			scale: 1

	_contentContext: null
	_contextTranslator: null
	_selectionApplier: null
	_pointerEventBinder: null

	_element: null
	_settings: null

	constructor: (@_element, options) ->
		@_settings = $.extend(DEFAULTS, options)
		@_injectDependencies()
		@_contextTranslator.setContentTransformationFromMarkersContext(@_settings.contentOrigin)
		@_contentContext.disableNativeSelection()
		@_selectionApplier.clearSelection()

	refresh: (transformation) ->
		if transformation?
			@_contextTranslator.setContentTransformationFromMarkersContext(transformation)
		@_selectionApplier.refreshSelection()

	clear: ->
		@_selectionApplier.clearSelection()


	destroy: ->
		@_selectionApplier.clearSelection()
		@_pointerEventBinder.destroyBindings()
		@_contentContext.restoreNativeSelection()

	_injectDependencies: ->
		@_contentContext = new CustomSelection.Lib.ContentContext(@_element)
		@_contextTranslator = new CustomSelection.Lib.ContextTranslator()
		environment = @_performEnvTests()
		rectangler = new CustomSelection.Lib.Rectangler(environment)
		frameRequester = new CustomSelection.Lib.FrameRequester()
		lastSelection = new CustomSelection.Lib.Range.LastSelection()
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer(rectangler, environment, @_contentContext,
			fillStyle: @_settings.selectionColor
			markerShiftY: @_settings.markerShiftY)
		nodeUtil = new CustomSelection.Lib.Utils.NodeUtil()
		pointLocator = new CustomSelection.Lib.Point.PointLocator(environment, nodeUtil)
		startMarker = new CustomSelection.Lib.Markers.StartMarker(@_contentContext, @_contextTranslator, $(@_settings.startMarker)[0])
		endMarker = new CustomSelection.Lib.Markers.EndMarker(@_contentContext, @_contextTranslator, $(@_settings.endMarker)[0])
		movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker)
		markersWrapper = new CustomSelection.Lib.Markers.MarkersWrapper(startMarker, endMarker)
		pointTargetLocator = new CustomSelection.Lib.Point.PointTargetLocator(@_contentContext, nodeUtil, markersWrapper, pointLocator)
		pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, @_contextTranslator, pointTargetLocator)
		rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil)
		belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil)
		boundFactory = new CustomSelection.Lib.Range.SelectionBoundFactory(lastSelection, movingMarker)
		pointToRangeConverter = new CustomSelection.Lib.Point.PointToRangeConverter(pointLocator, @_contentContext, rightPointSnapper, belowPointSnapper)
		wordRangeBuilder = new CustomSelection.Lib.Range.WordRangeBuilder(nodeUtil, pointToRangeConverter)
		selectionRangeBuilder = new CustomSelection.Lib.Range.SelectionRangeBuilder(@_contentContext, pointToRangeConverter, boundFactory, movingMarker)
		hammer = new CustomSelection.Lib.HammerAdapter(@_settings)
		@_selectionApplier = new CustomSelection.Lib.SelectionApplier(@_settings, lastSelection, markersWrapper, selectionDrawer)
		selectionConstructor = new CustomSelection.Lib.Range.SelectionConstructor(@_settings, selectionRangeBuilder, markersWrapper, pointFactory, wordRangeBuilder, frameRequester)
		pointerEventBus = new CustomSelection.Lib.PointerEventBus(movingMarker, @_selectionApplier, selectionConstructor)
		@_pointerEventBinder = new CustomSelection.Lib.PointerEventBinder(@_element, hammer, markersWrapper, pointerEventBus)


	_performEnvTests: ->
		env = new CustomSelection.Lib.EnvironmentChecker()
		return {
			isWebkit: env.isWebkit()
			isAppleDevice: env.isAppleDevice()
			isAndroidLowerThanKitkat: env.isAndroidLowerThan('4.4')
			isAndroidStackBrowser: env.isAndroidStackBrowser()
		}

window.CustomSelection.Lib = {
	Markers: {}
	Point: {}
	Range: {}
	Utils: {}
}
