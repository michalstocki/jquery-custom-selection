class PointSnapper

	_pointFactory: null
	_nodeUtil: null

	constructor: (@_pointFactory, @_nodeUtil) ->

	snapPointToTextInElement: (point, element) ->
		newPoint = null
		if position = @_searchPositionInTextByPoint(element, point)
			newPoint = @_createPointAt(position)
		return newPoint

	_searchPositionInTextByPoint: (el, point) ->
		node = el
		while position = @_searchPositionWithin(node, point)
			if @_nodeUtil.nodeIsText(position.node)
				return position
			else
				node = position.node
		return null

	_searchPositionWithin: (element, point) ->
		position = null;
		for node in element?.childNodes or []
			if @_nodeMightBeClosest(node)
				position = @_getPositionCloserToPoint(position, node, point)
		return position

	_getPositionCloserToPoint: (winningPosition, rivalingNode, point) ->
		newWinner = winningPosition
		rivalingRect = @_getClosestRectFromNode(rivalingNode, point)
		if  @_rivalingRectWins(winningPosition, rivalingRect)
			newWinner = {
				node: rivalingNode
				rect: rivalingRect
			}
		return newWinner

	_rivalingRectWins: (winningPosition, rivalingRect) ->
		return (winningPosition? and @_isRivalingRectCloser(rivalingRect,
			winningPosition.rect)) or (not winningPosition? and rivalingRect?)


	_isRivalingRectCloser: (rivalingRect, winningRect) ->
		return rivalingRect? and winningRect? and
			rivalingRect isnt winningRect and
			@_getCloserRect(rivalingRect, winningRect) is rivalingRect

	_nodeMightBeClosest: (node) ->
		return @_nodeUtil.nodeHasRects(node) and
			(@_nodeUtil.nodeHasChildren(node) or @_nodeUtil.nodeIsText(node))

	_createPointAt: (position) ->
		return @_pointFactory.createFromClientCoordsInText({
			clientX: position.rect.right - 1
			clientY: position.rect.bottom - 1
		}, position.node)

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
		