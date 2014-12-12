class CustomSelection.Lib.Range.SelectionConstructor

	_settings: null
	_selectionRangeBuilder: null
	_markersWrapper: null
	_pointFactory: null
	_wordRangeBuilder: null
	_frameRequester: null

	_lastPoint: null

	constructor: (@_settings, @_selectionRangeBuilder, @_markersWrapper, @_pointFactory, @_wordRangeBuilder, @_frameRequester) ->

	getWordSelectionFrom: (hammerEvent) ->
		range = null
		eventTarget = hammerEvent.pointers[0].target;
		unless @_markersWrapper.isMarkerElement(eventTarget)
			point = @_pointFactory.createFromContentEvent(hammerEvent)
			range = @_wordRangeBuilder.getRangeOfWordUnderPoint(point)
		return range

	getSelectionUpdatedWith: (jqueryEvent, onRangeReady) ->
		@_lastPoint = @_pointFactory.createFromMarkerEvent(jqueryEvent.originalEvent, -@_settings.markerShiftY)
		@_frameRequester.requestFrame =>
			range = @_selectionRangeBuilder.getRangeUpdatedWithPoint(@_lastPoint)
			onRangeReady(range)

