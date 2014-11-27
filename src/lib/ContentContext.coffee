class CustomSelection.Lib.ContentContext

	window: null
	document: null
	body: null
	container: null

	constructor: ($element) ->
		@container = $element[0]
		@document = @container.ownerDocument
		@body = @document.body
		@window = @document.defaultView || @document.parentWindow

	createRange: ->
		return @document.createRange()

	createElement: (tagName) ->
		return @document.createElement(tagName)

	getElementByPoint: (point) ->
		return @document.elementFromPoint(point.clientX, point.clientY)