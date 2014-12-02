
class CustomSelection.Lib.Point.Point

	clientX: 0
	clientY: 0
	pageX: 0
	pageY: 0
	parentText: null

	constructor: (pointer) ->
		@clientX = pointer.clientX if pointer.clientX?
		@clientY = pointer.clientY if pointer.clientY?
		@pageX = pointer.pageX if pointer.pageX?
		@pageY = pointer.pageY if pointer.pageY?
