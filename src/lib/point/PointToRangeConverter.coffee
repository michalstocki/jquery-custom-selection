class CustomSelection.Lib.Point.PointToRangeConverter

	_pointLocator: null
	_contentContext: null

	constructor: (@_pointLocator, @_contentContext) ->

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
