class CustomSelection.Lib.PointerEventBinder

	_element: null
	_hammerAdapter: null
	_markersWrapper: null
	_pointerEventBus: null

	constructor: (@_element, @_hammerAdapter, @_markersWrapper, @_pointerEventBus) ->
		@_markersWrapper.$markerElements
			.on('touchstart', @_pointerEventBus.handleMarkerTouchStart)
		@_markersWrapper.$markersBody
			.on('touchmove', @_pointerEventBus.handleMarkerTouchMove)
			.on('touchend', @_pointerEventBus.handleMarkerTouchMoveEnd)
		$(@_element).on('touchend', @_pointerEventBus.handleGlobalTouchEnd)
		@_hammerAdapter.bindTapHoldInElement(@_element, @_pointerEventBus.handleGlobalTapHold)
		@_hammerAdapter.bindTapInElement(@_element, @_pointerEventBus.handleGlobalTap)

	destroyBindings: ->
		@_markersWrapper.$markerElements
			.off('touchstart', @_pointerEventBus.handleMarkerTouchStart)
		@_markersWrapper.$markersBody
			.off('touchmove', @_pointerEventBus.handleMarkerTouchMove)
			.off('touchend', @_pointerEventBus.handleMarkerTouchMoveEnd)
		$(@_element).off('touchend', @_pointerEventBus.handleGlobalTouchEnd)
		@_hammerAdapter.destroyBindingsFor(@_element)
