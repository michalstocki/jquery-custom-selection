class CustomSelection.Lib.PointerEventBus

	_movingMarker: null
	_selectionApplier: null
	_selectionConstructor: null

	_rejectTouchEnd: false

	constructor: (@_movingMarker, @_selectionApplier, @_selectionConstructor) ->

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

	_selectWordUnderPointer: (hammerEvent) ->
		if range = @_selectionConstructor.getWordSelectionFrom(hammerEvent)
			@_movingMarker.unset()
			@_selectionApplier.clearSelection()
			@_selectionApplier.applySelectionFor(range)
			@_rejectTouchEnd = true


	_updateSelectionWithPointerMove: (jqueryEvent) ->
		@_selectionConstructor.getSelectionUpdatedWith jqueryEvent, (range) =>
			@_selectionApplier.applySelectionFor(range)