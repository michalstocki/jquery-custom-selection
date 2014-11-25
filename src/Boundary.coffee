class Boundary

	constructor: (anchor) ->
		@_container = anchor.container
		@_offset = anchor.offset


class CustomSelection.Lib.StartBoundary extends Boundary

	applyTo: (range) ->
		range.setStart(@_container, @_offset)

	applyOppositeTo: (range) ->
		range.setEnd(@_container, @_offset)


class CustomSelection.Lib.EndBoundary extends Boundary

	applyTo: (range) ->
		range.setEnd(@_container, @_offset)

	applyOppositeTo: (range) ->
		range.setStart(@_container, @_offset)
