class CustomSelection.Lib.Point.PointTargetLocator

	_contentContext: null
	_nodeUtil: null
	_startMarker: null
	_endMarker: null
	_pointLocator: null

	constructor: (@_contentContext, @_nodeUtil, @_startMarker, @_endMarker, @_pointLocator) ->

	getTargetFromEvent: (pointerEvent) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		textNode = @_locateTextNodeWithinElementByCoords(pointer.target, pointer)
		return textNode || pointer.target

	getTargetByCoords: (coords) ->
		targetElement = @_getTargetElementByCoords(coords)
		textNode = @_locateTextNodeWithinElementByCoords(targetElement, coords)
		return textNode || targetElement

	_getTargetElementFromPointerEvent: (pointerEvent) ->
		return @_getPointerFromEvent(pointerEvent).target

	_getTargetElementByCoords: (coords) ->
		@_startMarker.hide();
		@_endMarker.hide();
		element = @_contentContext.getElementByPoint(coords) || @_contentContext.body
		@_startMarker.show();
		@_endMarker.show();
		return element

	_getPointerFromEvent: (pointerEvent) ->
		return (pointerEvent.touches || pointerEvent.pointers)[0]

	_locateTextNodeWithinElementByCoords: (element, pointer) ->
		children = element.childNodes
		for child in children
			if @_isPointerInText(child, pointer)
				return child
		return null

	_isPointerInText: (node, point) ->
		return @_nodeUtil.nodeIsText(node) and
			@_pointLocator.nodeContainsPoint(node, point)