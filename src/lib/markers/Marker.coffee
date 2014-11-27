MARKER_CLASS = 'jcs-marker';
MARKER_START_CLASS = 'jcs-beginning-marker';
MARKER_END_CLASS = 'jcs-end-marker';
MARKER_MOVING_CLASS = 'jcs-marker-moving';

class Marker

	_className: ''

	constructor: (@_contentContext, element) ->
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

	_createMarkerElement: ->
		element = @_contentContext.createElement('div')
		element.setAttribute('class', MARKER_CLASS + ' ' + @_className)
		element.setAttribute('style', 'position: absolute')
		@_contentContext.container.append(element)
		return element


class CustomSelection.Lib.Markers.StartMarker extends Marker

	constructor: ->
		@_className = MARKER_START_CLASS
		super

class CustomSelection.Lib.Markers.EndMarker extends Marker

	constructor: ->
		@_className = MARKER_END_CLASS
		super