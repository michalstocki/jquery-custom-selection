class CustomSelection.Lib.PointerEventBus

	_rejectTouchEnd: false
	_lastPoint: null

	_settings: null
	_selectionRangeBuilder: null
	_movingMarker: null
	_markersWrapper: null
	_pointFactory: null
	_wordRangeBuilder: null
	_selectionApplier: null
	_frameRequester: null

	constructor: (@_settings, @_selectionRangeBuilder, @_movingMarker, @_markersWrapper, @_pointFactory, @_wordRangeBuilder, @_selectionApplier, @_frameRequester) ->

	handleGlobalTapHold: (hammerEvent) =>
		hammerEvent.srcEvent.preventDefault()
		hammerEvent.srcEvent.stopPropagation()
		@_selectWordUnderPointer(hammerEvent)

	handleMarkerTouchStart: (jqueryEvent) =>
		jqueryEvent.preventDefault()
		@_movingMarker.setTo(jqueryEvent.target)

	handleMarkerTouchMove: (jqueryEvent) =>
		if @_movingMarker.exists()
			jqueryEvent.preventDefault();
			@_updateSelectionWithPointerMove(jqueryEvent)
			@_rejectTouchEnd = true

	handleMarkerTouchMoveEnd: (jqueryEvent) =>
		@_movingMarker.unset()

	handleGlobalTouchEnd: (jqueryEvent) =>
		if @_rejectTouchEnd
			jqueryEvent.preventDefault()
			@_rejectTouchEnd = false

	handleGlobalTap: (hammerEvent) =>
		@_selectionApplier.clearSelection()

	_selectWordUnderPointer: (hammerEvent) =>
		eventTarget = hammerEvent.pointers[0].target;
		unless @_markersWrapper.isMarkerElement(eventTarget)
			@_selectionApplier.clearSelection()
			point = @_pointFactory.createFromContentEvent(hammerEvent)
			range = @_wordRangeBuilder.getRangeOfWordUnderPoint(point)
			@_selectionApplier.applySelectionFor(range)
			@_movingMarker.unset()
			@_rejectTouchEnd = true


	_updateSelectionWithPointerMove: (jqueryEvent) =>
		@_lastPoint = @_pointFactory.createFromMarkerEvent(jqueryEvent.originalEvent, -@_settings.markerShiftY)
		@_frameRequester.requestFrame =>
			range = @_selectionRangeBuilder.getRangeUpdatedWithPoint(@_lastPoint)
			@_selectionApplier.applySelectionFor(range)

