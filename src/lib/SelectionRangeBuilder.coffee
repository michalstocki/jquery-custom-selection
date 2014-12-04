class CustomSelection.Lib.SelectionRangeBuilder

	_contentContext: null
	_pointToRangeConverter: null
	_selectionBoundFactory: null
	_movingMarker: null

	constructor: (@_contentContext, @_pointToRangeConverter, @_selectionBoundFactory, @_movingMarker) ->


	getRangeUpdatedWithPoint: (point) ->
		coveringRange = null
		if anchor = @_pointToRangeConverter.pointToRangeAnchor(point)
			coveringRange = @_contentContext.createRange()
			movingBound = @_selectionBoundFactory.getMovingSelectionBound(anchor)
			protectedBound = @_selectionBoundFactory.getProtectedSelectionBound()
			movingBound.applyTo(coveringRange)
			protectedBound.applyTo(coveringRange)
			if coveringRange.collapsed
				protectedBound.applyOppositeTo(coveringRange)
				movingBound.applyOppositeTo(coveringRange)
				@_movingMarker.toggleMoving()
		return coveringRange
