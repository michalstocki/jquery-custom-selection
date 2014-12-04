class CustomSelection.Lib.WordRangeBuilder

	WHITESPACE_LIST = [' ', '\t', '\r', '\n']

	_nodeUtil: null
	_pointToRangeConverter: null

	constructor: (@_nodeUtil, @_pointToRangeConverter) ->

	getRangeOfWordUnderPoint: (point) ->
		range = null
		if @_nodeUtil.nodeIsText(point.target)
			range = @_pointToRangeConverter.pointToRange(point)
			@_expandRangeToStartAfterTheWhitespaceOnLeft(range)
			@_expandRangeToEndBeforeTheWhitespaceOnRight(range)
		return range

	_expandRangeToStartAfterTheWhitespaceOnLeft: (range) ->
		# searching space backwards
		until @_rangeStartsWithWhitespace(range)
			if range.startOffset > 0
				range.setStart(range.startContainer, range.startOffset - 1)
			else
				return unless @_putRangeStartAtTheEndOfPreviousTextNode(range)
		range.setStart(range.startContainer, range.startOffset + 1)

		if @_rangeStartsOnWhitespaceAtTheEndOfNode(range)
			range.setStart(@_nodeUtil.getTextNodeAfter(range.startContainer), 0)

	_expandRangeToEndBeforeTheWhitespaceOnRight: (range) ->
		# searching space forwards
		until @_rangeEndsWithWhitespace(range)
			maxIndex = range.endContainer.data.length
			if range.endOffset < maxIndex
				range.setEnd(range.endContainer, range.endOffset + 1)
			else
				return unless @_putRangeEndAtTheBeginningOfNextTextNode(range)
		range.setEnd(range.endContainer, Math.max(range.endOffset - 1, 0))

	_rangeStartsWithWhitespace: (range) ->
		firstLetter = range.toString()[0]
		return firstLetter in WHITESPACE_LIST

	_rangeEndsWithWhitespace: (range) ->
		stringified = range.toString()
		lastLetter = stringified[stringified.length - 1]
		return lastLetter in WHITESPACE_LIST

	_putRangeStartAtTheEndOfPreviousTextNode: (range) ->
		if newStartContainer = @_nodeUtil.getTextNodeBefore(range.startContainer)
			range.setStart(newStartContainer, newStartContainer.data.length)
			return true
		else
			return false

	_putRangeEndAtTheBeginningOfNextTextNode: (range) ->
		if newEndContainer = @_nodeUtil.getTextNodeAfter(range.endContainer)
			range.setEnd(newEndContainer, 0)
			return true
		else
			return false

	_rangeStartsOnWhitespaceAtTheEndOfNode: (range) ->
		return @_nodeEndsWithWhitespace(range.startContainer) and
			(range.startOffset is range.startContainer.data.length or
				range.startOffset is range.startContainer.data.length - 1)

	_nodeEndsWithWhitespace: (node) ->
		lastLetter = node.data[node.data.length - 1]
		return lastLetter in WHITESPACE_LIST