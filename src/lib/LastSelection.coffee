class CustomSelection.Lib.LastSelection

	range: null

	cloneRange: ->
		return @range.cloneRange()

	exists: ->
		return @range? && @range.getBoundingClientRect()? &&
			@range.getClientRects().length > 0

	rangeEqualsTo: (range) ->
		return @range? && @_hasSameStartAs(range) && @_hasSameEndAs(range)

	_hasSameStartAs: (range) ->
		return @range.compareBoundaryPoints(Range.START_TO_START, range) == 0

	_hasSameEndAs: (range) ->
		return @range.compareBoundaryPoints(Range.END_TO_END, range) == 0