class CustomSelection.Lib.Markers.MarkersContext

	body: null

	_offsetX: 0
	_offsetY: 0
	_scale: 0

	setBody: (body) ->
		@body = body;

	setOriginTransformation: (transformation) ->
		@_offsetX = transformation.offsetX
		@_offsetY = transformation.offsetX
		@_scale = transformation.scale

	contentXToMarkerContext: (contentX) ->
		return contentX * @_scale + @_offsetX

	contentYToMarkerContext: (contentY) ->
		return contentY * @_scale + @_offsetY

	scaleToContentContext: (n) ->
		return n * (1 / @_scale)

	markersYToContentContext: (markersY) ->
		return @scaleToContentContext(markersY - @_offsetY)

	markersXToContentContext: (markersX) ->
		return @scaleToContentContext(markersX - @_offsetX)