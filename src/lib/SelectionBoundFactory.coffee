class CustomSelection.Lib.SelectionBoundFactory

	_lastSelection: null
	_movingMarker: null

	constructor: (@_lastSelection, @_movingMarker) ->

	getProtectedSelectionBound: ->
		return if @_movingMarker.isStartMarker()
			@_createEndBoundary
				container: @_lastSelection.range.endContainer
				offset: @_lastSelection.range.endOffset
		else
			@_createStartBoundary
				container: @_lastSelection.range.startContainer
				offset: @_lastSelection.range.startOffset


	getMovingSelectionBound: (anchor) ->
		return if @_movingMarker.isEndMarker()
			@_createEndBoundary(anchor)
		else
			@_createStartBoundary(anchor)

	_createEndBoundary: (anchor) ->
		return new CustomSelection.Lib.EndBoundary(anchor)

	_createStartBoundary: (anchor) ->
		return new CustomSelection.Lib.StartBoundary(anchor)