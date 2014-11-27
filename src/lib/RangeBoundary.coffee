class RangeBoundary

	_container: null
	_offset: null

	constructor: (anchor) ->
		@_container = anchor.container
		@_offset = anchor.offset


class CustomSelection.Lib.StartBoundary extends RangeBoundary

	applyTo: (range) ->
		range.setStart(@_container, @_offset)

	applyOppositeTo: (range) ->
		range.setEnd(@_container, @_offset)


class CustomSelection.Lib.EndBoundary extends RangeBoundary

	applyTo: (range) ->
		range.setEnd(@_container, @_offset)

	applyOppositeTo: (range) ->
		range.setStart(@_container, @_offset)
