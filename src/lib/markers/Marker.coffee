MARKER_CLASS = 'jcs-marker';
MARKER_START_CLASS = 'jcs-beginning-marker';
MARKER_END_CLASS = 'jcs-end-marker';
MARKER_MOVING_CLASS = 'jcs-marker-moving';

class Marker

	element: null
	$element: null

	_className: ''
	_contentContext: null
	_markersContext: null

	constructor: (@_contentContext, @_markersContext, element) ->
		@element = element || @_createMarkerElement()
		@$element = $(@element)
		@_markersContext.setBody(@_getBodyOf(@element))

	hide: ->
		@$element.css(visibility: 'hidden')

	show: ->
		@$element.css(visibility: 'visible')

	disablePointerEvents: ->
		@$element.css('pointer-events', 'none')

	enablePointerEvents: ->
		@$element.css('pointer-events', 'auto')

	setMoving: (isMoving) ->
		@$element.toggleClass(MARKER_MOVING_CLASS, isMoving)

	alignToRange: (range) ->

	_createMarkerElement: ->
		element = @_contentContext.createElement('div')
		element.setAttribute('class', MARKER_CLASS + ' ' + @_className)
		element.setAttribute('style', 'position: absolute')
		@_contentContext.container.append(element)
		return element

	_getBodyOf: (element) ->
		return element.ownerDocument.body


class CustomSelection.Lib.Markers.StartMarker extends Marker

	constructor: ->
		@_className = MARKER_START_CLASS
		super

	alignToRange: (range) ->
		firstRect = range.getClientRects()[0]
		@$element.css
			left: @_markersContext.contentXToMarkerContext(firstRect.left)
			top: @_markersContext.contentYToMarkerContext(firstRect.bottom)


class CustomSelection.Lib.Markers.EndMarker extends Marker

	constructor: ->
		@_className = MARKER_END_CLASS
		super

	alignToRange: (range) ->
		rects = range.getClientRects()
		lastRect = rects[rects.length - 1]
		@$element.css
			left: @_markersContext.contentXToMarkerContext(lastRect.right)
			top: @_markersContext.contentYToMarkerContext(lastRect.bottom)