class CustomSelection.Lib.Point.PointTargetLocator

	_contentContext: null
	_nodeUtil: null
	_startMarker: null
	_endMarker: null
	_environment: null

	constructor: (@_contentContext, @_nodeUtil, @_startMarker, @_endMarker, @_environment) ->

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
			if @_nodeUtil.nodeIsText(child) and @_nodeContainsPoint(child, pointer)
				return child
		return null

	_nodeContainsPoint: (node, point) ->
		for rect in @_nodeUtil.getRectsForNode(node)
			if @_rectContainsPoint(rect, point)
				return true;
		return false

	_rectContainsPoint: (rect, point) ->
		return @_rectContainsPointVertically(rect, point) and
			@_rectOrItsBoundsContainPointHorizontally(rect, point)

	_rectContainsPointVertically: (rect, point) ->
		y = if @_environment.isAppleDevice then point.pageY else point.clientY
		return y > rect.top and y < rect.bottom

	_rectOrItsBoundsContainPointHorizontally: (rect, point) ->
		x = if @_environment.isAppleDevice then point.pageX else point.clientX
		return x >= rect.left and x <= rect.right