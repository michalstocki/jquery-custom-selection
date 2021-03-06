class CustomSelection.Lib.ContentContext

	window: null
	document: null
	body: null
	container: null
	_originalUserSelectValue: null

	constructor: (@container) ->
		@document = @container.ownerDocument
		@body = @document.body
		@window = @document.defaultView || @document.parentWindow

	createRange: ->
		return @document.createRange()

	createElement: (tagName) ->
		return @document.createElement(tagName)

	getElementByPoint: (point) ->
		return @document.elementFromPoint(point.clientX, point.clientY)

	disableNativeSelection: ->
		@_originalUserSelectValue = $(@body).css('user-select')
		$(@body).css('user-select', 'none')

	restoreNativeSelection: ->
		$(@body).css('user-select', @_originalUserSelectValue)