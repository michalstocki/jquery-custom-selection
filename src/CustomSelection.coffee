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
		Package = CustomSelection.Lib.Markers
		startMarker = new Package.StartMarker(@_contentContext, @_contextTranslator, $(@_settings.startMarker)[0])
		endMarker = new Package.EndMarker(@_contentContext, @_contextTranslator, $(@_settings.endMarker)[0])
		movingMarker = new Package.MovingMarker(startMarker, endMarker)
		markersWrapper = new Package.MarkersWrapper(startMarker, endMarker)

		# selection drawing
		Package = CustomSelection.Lib.Drawing
		rectangler = new Package.Rectangler(environment)
		selectionDrawer = new Package.SelectionDrawer(rectangler, environment, @_contentContext,
			fillStyle: @_settings.selectionColor
			markerShiftY: @_settings.markerShiftY)

		# point construction
		Package = CustomSelection.Lib.Point
		pointLocator = new Package.PointLocator(environment, nodeUtil)
		pointTargetLocator = new Package.PointTargetLocator(@_contentContext, nodeUtil, markersWrapper, pointLocator)
		pointFactory = new Package.PointFactory(environment, @_contextTranslator, pointTargetLocator)
		rightPointSnapper = new Package.RightPointSnapper(pointFactory, nodeUtil)
		belowPointSnapper = new Package.BelowPointSnapper(pointFactory, nodeUtil)
		pointToRangeConverter = new Package.PointToRangeConverter(pointLocator, @_contentContext, rightPointSnapper, belowPointSnapper)

		# range construction
		Package = CustomSelection.Lib.Range
		lastSelection = new Package.LastSelection()
		boundFactory = new Package.SelectionBoundFactory(lastSelection, movingMarker)
		wordRangeBuilder = new Package.WordRangeBuilder(nodeUtil, pointToRangeConverter)
		selectionRangeBuilder = new Package.SelectionRangeBuilder(@_contentContext, pointToRangeConverter, boundFactory, movingMarker)
		selectionConstructor = new Package.SelectionConstructor(@_settings, selectionRangeBuilder, markersWrapper, pointFactory, wordRangeBuilder, frameRequester)

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
	Drawing: {}
	Markers: {}
	Point: {}
	Range: {}
	Utils: {}
}
