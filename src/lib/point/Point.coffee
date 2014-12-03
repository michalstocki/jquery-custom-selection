
class CustomSelection.Lib.Point.Point

	clientX: 0
	clientY: 0
	pageX: 0
	pageY: 0
	parentText: null

	constructor: (pointer, targetNode) ->
		@clientX = pointer.clientX
		@clientY = pointer.clientY
		@pageX = pointer.pageX if pointer.pageX?
		@pageY = pointer.pageY if pointer.pageY?
		@target = targetNode
