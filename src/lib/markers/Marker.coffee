MARKER_CLASS = 'jcs-marker';
START_MARKER_CLASS = 'jcs-start-marker';
END_MARKER_CLASS = 'jcs-end-marker';
MOVING_MARKER_CLASS = 'jcs-marker-moving';

class Marker

	element: null
	$element: null

	_className: ''
	_contentContext: null
	_contextTranslator: null

	constructor: (@_contentContext, @_contextTranslator, element) ->
		@element = element || @_createMarkerElement()
		@$element = $(@element)

	hide: ->
		@$element.css(visibility: 'hidden')

	show: ->
		@$element.css(visibility: 'visible')

	disablePointerEvents: ->
		@$element.css('pointer-events', 'none')

	enablePointerEvents: ->
		@$element.css('pointer-events', 'auto')

	setMoving: (isMoving) ->
		@$element.toggleClass(MOVING_MARKER_CLASS, isMoving)

	alignToRange: ->

	_createMarkerElement: ->
		element = @_contentContext.createElement('div')
		element.setAttribute('class', MARKER_CLASS + ' ' + @_className)
		element.setAttribute('style', 'position: absolute')
		@_contentContext.container.append(element)
		return element


class CustomSelection.Lib.Markers.StartMarker extends Marker

	constructor: ->
		@_className = START_MARKER_CLASS
		super

	alignToRange: (range) ->
		firstRect = range.getClientRects()[0]
		@$element.css
			left: @_contextTranslator.contentXToMarkerContext(firstRect.left)
			top: @_contextTranslator.contentYToMarkerContext(firstRect.bottom)


class CustomSelection.Lib.Markers.EndMarker extends Marker

	constructor: ->
		@_className = END_MARKER_CLASS
		super

	alignToRange: (range) ->
		rects = range.getClientRects()
		lastRect = rects[rects.length - 1]
		@$element.css
			left: @_contextTranslator.contentXToMarkerContext(lastRect.right)
			top: @_contextTranslator.contentYToMarkerContext(lastRect.bottom)