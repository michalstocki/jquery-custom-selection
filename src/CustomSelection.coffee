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
		# lowest dependencies
		environment = @_performEnvTests()
		nodeUtil = new CustomSelection.Lib.Utils.NodeUtil()
		frameRequester = new CustomSelection.Lib.FrameRequester()
		hammerAdapter = new CustomSelection.Lib.HammerAdapter(@_settings)
		@_contentContext = new CustomSelection.Lib.ContentContext(@_element)
		@_contextTranslator = new CustomSelection.Lib.ContextTranslator()

		# markers
		startMarker = new CustomSelection.Lib.Markers.StartMarker(@_contentContext, @_contextTranslator, $(@_settings.startMarker)[0])
		endMarker = new CustomSelection.Lib.Markers.EndMarker(@_contentContext, @_contextTranslator, $(@_settings.endMarker)[0])
		movingMarker = new CustomSelection.Lib.Markers.MovingMarker(startMarker, endMarker)
		markersWrapper = new CustomSelection.Lib.Markers.MarkersWrapper(startMarker, endMarker)

		# selection drawing
		rectangler = new CustomSelection.Lib.Rectangler(environment)
		selectionDrawer = new CustomSelection.Lib.SelectionDrawer(rectangler, environment, @_contentContext,
			fillStyle: @_settings.selectionColor
			markerShiftY: @_settings.markerShiftY)

		# point construction
		pointLocator = new CustomSelection.Lib.Point.PointLocator(environment, nodeUtil)
		pointTargetLocator = new CustomSelection.Lib.Point.PointTargetLocator(@_contentContext, nodeUtil, markersWrapper, pointLocator)
		pointFactory = new CustomSelection.Lib.Point.PointFactory(environment, @_contextTranslator, pointTargetLocator)
		rightPointSnapper = new CustomSelection.Lib.Point.RightPointSnapper(pointFactory, nodeUtil)
		belowPointSnapper = new CustomSelection.Lib.Point.BelowPointSnapper(pointFactory, nodeUtil)
		pointToRangeConverter = new CustomSelection.Lib.Point.PointToRangeConverter(pointLocator, @_contentContext, rightPointSnapper, belowPointSnapper)

		# range construction
		lastSelection = new CustomSelection.Lib.Range.LastSelection()
		boundFactory = new CustomSelection.Lib.Range.SelectionBoundFactory(lastSelection, movingMarker)
		wordRangeBuilder = new CustomSelection.Lib.Range.WordRangeBuilder(nodeUtil, pointToRangeConverter)
		selectionRangeBuilder = new CustomSelection.Lib.Range.SelectionRangeBuilder(@_contentContext, pointToRangeConverter, boundFactory, movingMarker)
		selectionConstructor = new CustomSelection.Lib.Range.SelectionConstructor(@_settings, selectionRangeBuilder, markersWrapper, pointFactory, wordRangeBuilder, frameRequester)

		# highest dependencies
		@_selectionApplier = new CustomSelection.Lib.SelectionApplier(@_settings, lastSelection, markersWrapper, selectionDrawer)
		pointerEventBus = new CustomSelection.Lib.PointerEventBus(movingMarker, @_selectionApplier, selectionConstructor)
		@_pointerEventBinder = new CustomSelection.Lib.PointerEventBinder(@_element, hammerAdapter, markersWrapper, pointerEventBus)


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
