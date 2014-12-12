class CustomSelection.Lib.Markers.MovingMarker

	_startMarker: null
	_endMarker: null
	_marker: null

	constructor: (@_startMarker, @_endMarker) ->

	setTo: (markerElement) ->
		if markerElement == @_startMarker.element
			@_setMovingStart()
		else
			@_setMovingEnd()
		@_startMarker.disablePointerEvents()
		@_endMarker.disablePointerEvents()

	toggleMoving: ->
		if @isStartMarker()
			@_setMovingEnd()
		else if @isEndMarker()
			@_setMovingStart()

	unset: ->
		@_marker = null
		@_unsetMovingStart()
		@_unsetMovingEnd()
		@_startMarker.enablePointerEvents()
		@_endMarker.enablePointerEvents()

	isStartMarker: ->
		return @_marker == @_startMarker

	isEndMarker: ->
		return @_marker == @_endMarker

	exists: ->
		return @_marker != null

	_setMovingStart: ->
		@_unsetMovingEnd()
		@_marker = @_startMarker
		@_startMarker.setMoving(true)

	_setMovingEnd: ->
		@_unsetMovingStart()
		@_marker = @_endMarker
		@_endMarker.setMoving(true)

	_unsetMovingStart: ->
		@_startMarker.setMoving(false)

	_unsetMovingEnd: ->
		@_endMarker.setMoving(false)