class CustomSelection.Lib.Point.PointToRangeConverter

	_pointLocator: null
	_contentContext: null
	_nodeUtil: null
	_rightPointSnapper: null
	_belowPointSnapper: null

	constructor: (@_pointLocator, @_contentContext, @_nodeUtil, @_rightPointSnapper, @_belowPointSnapper) ->

	pointToRange: (point) ->
		range = @_contentContext.createRange()
		startIndex = 0
		maxIndex = point.target.data.length
		endIndex = maxIndex
		while startIndex < endIndex
			middle = (startIndex + endIndex) >> 1
			range.setStart(point.target, startIndex)
			range.setEnd(point.target, middle + 1)
			if @_pointLocator.rangeContainsPoint(range, point)
				endIndex = middle
			else
				startIndex = middle + 1
				range.setStart(point.target, startIndex)
				range.setEnd(point.target, endIndex)

		if range.collapsed && range.endOffset < maxIndex
			range.setEnd(point.target, range.endOffset + 1)
		return range

	pointToRangeAnchor: (point) ->
		pointAnchor = null;
		if @_nodeUtil.nodeIsText(point.target)
			pointAnchor = @_getStartAnchorOf(@pointToRange(point))
		else if point = @_snapPointToText(point)
			pointAnchor = @_getEndAnchorOf(@pointToRange(point))
		return pointAnchor

	_snapPointToText: (point) ->
		return @_rightPointSnapper.snapPointToTextInElement(point, point.target) or
			@_belowPointSnapper.snapPointToTextInElement(point, point.target)

	_getStartAnchorOf: (range) ->
		return {
			container: range.startContainer
			offset: range.startOffset
		}

	_getEndAnchorOf: (range) ->
		return {
			container: range.endContainer
			offset: range.endOffset
		}