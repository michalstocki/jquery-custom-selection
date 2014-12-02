class PointSnapper

	_pointFactory: null
	_nodeUtil: null
	_closestRectInNode: null

	constructor: (@_pointFactory, @_nodeUtil) ->

	snapPointToTextInElement: (point, element) ->
		newPoint = null
		if closestNode = @_searchTextNodeByPoint(element, point)
			newPoint = @_createPointWithinRectInNode(@_closestRectInNode,
				closestNode)
		@_closestRectInNode = null
		return newPoint

	_searchTextNodeByPoint: (el, point) ->
		node = el;
		while subNode = @_searchNodeByPoint(node, point)
			if @_nodeUtil.nodeIsText(subNode)
				return subNode;
			else
				node = subNode;

	_searchNodeByPoint: (element, point) ->
		closestNode = null;
		for node in element?.childNodes or []
			if @_nodeMightBeClosest(node)
				closestNode = @_getNodeCloserToPoint(closestNode, node, point)
		return closestNode

	_getNodeCloserToPoint: (winner, rival, point) ->
		newWinner = winner
		closestRivalRect = @_getClosestRectFromNode(rival, point)
		if winner?
			closestWinnerRect = @_getClosestRectFromNode(winner, point)
			if @_isRivalRectCloser(closestRivalRect, closestWinnerRect)
				newWinner = rival
				@_closestRectInNode = closestRivalRect
		else if closestRivalRect?
			newWinner = rival
			@_closestRectInNode = closestRivalRect
		return newWinner

	_isRivalRectCloser: (closestRivalRect, closestWinnerRect) ->
		return closestRivalRect? and closestWinnerRect? and
			closestRivalRect isnt closestWinnerRect and
			@_getCloserRect(closestRivalRect,
				closestWinnerRect) is closestRivalRect

	_nodeMightBeClosest: (node) ->
		return @_nodeUtil.nodeHasRects(node) and
			(@_nodeUtil.nodeHasChildren(node) or @_nodeUtil.nodeIsText(node))

	_createPointWithinRectInNode: (rect, node) ->
		return @_pointFactory.createFromClientCoordsInText
			clientX: rect.right - 1
			clientY: rect.bottom - 1
			parentText: node

class CustomSelection.Lib.Point.RightPointSnapper extends PointSnapper

	_getClosestRectFromNode: (node, point) ->
		rects = @_nodeUtil.getRectsForNode(node)
		nearestRect = null
		for rect in rects
			if @_rectIsInTheSameLineOnLeft(rect,
				point) and (!nearestRect or rect.right > nearestRect.right)
				nearestRect = rect
		return nearestRect;

	_getCloserRect: (rectA, rectB) ->
		# get the rect more on the right
		if rectA.right > rectB.right
			return rectA
		else if rectB.right > rectA.right
			return rectB
		else
			return null

	_rectIsInTheSameLineOnLeft: (rect, point) ->
		x = point.clientX
		y = point.clientY
		return rect.right < x and rect.top <= y and rect.bottom >= y

class CustomSelection.Lib.Point.BelowPointSnapper extends PointSnapper

	_getClosestRectFromNode: (node, point) ->
		# get the nearest rect above the point
		y = point.clientY
		rects = @_nodeUtil.getRectsForNode(node)
		nearestRect = null
		for rect in rects
			if (rect.top < y and (!nearestRect or rect.top >= nearestRect.top))
				nearestRect = rect
		return nearestRect

	_getCloserRect: (rectA, rectB) ->
		# get lower rect
		if rectA.top >= rectB.top
			return rectA
		else if rectB.top > rectA.top
			return rectB
		else
			return null
		