class CustomSelection.Lib.Markers.MarkersWrapper

	$markerElements: null
	$markersBody: null

	_startMarker: null
	_endMarker: null

	constructor: (@_startMarker, @_endMarker) ->
		@$markerElements = @_startMarker.$element.add(@_endMarker.$element)
		@$markersBody = $(@_startMarker.ownerBody)

	showMarkers: ->
		@_startMarker.show()
		@_endMarker.show()

	hideMarkers: ->
		@_startMarker.hide()
		@_endMarker.hide()

	alignMarkersToRange: (range) ->
		@_startMarker.alignToRange(range)
		@_endMarker.alignToRange(range)

	isMarkerElement: (element) ->
		return element is @_startMarker.element or element is @_endMarker.element
