class CustomSelection.Lib.Point.PointLocator

	_environment: null
	_nodeUtil: null

	constructor: (@_environment, @_nodeUtil) ->

	rangeContainsPoint: (range, point) ->
		for rect in range.getClientRects()
			if @_rectContainsPoint(rect, point)
				return true;
		return false

	nodeContainsPoint: (node, point) ->
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

