class CustomSelection.Lib.SelectionDrawer

	CUSTOM_SELECTION_CANVAS_CLASS = 'custom-selection-canvas'
	CUSTOM_SELECTION_CANVAS_STYLE = {
		'position': 'absolute',
		'pointer-events': 'none',
		'z-index': -1
	}

	constructor: (@_settings) ->
		@_canvas = null
		@_context = null
		@_environment = @_settings.environment
		@_rectangler = @_settings.rectangler
		@_initCanvas()

	redraw: (range) ->
		@_updateCanvasBounds(range.getBoundingClientRect())
		@_drawSelection(range)

	clearSelection: ->
		@_updateCanvasBounds()

	_initCanvas: ->
		@_createCanvas()
		@_context = @_canvas.getContext('2d')

	_drawSelection: (range) ->
		boundingClientRect = range.getBoundingClientRect()
		rects = @_rectangler.getRectsFor(range)
		SUBPIXEL_OFFSET = 0.5

		offsetX = SUBPIXEL_OFFSET - boundingClientRect.left
		offsetY = SUBPIXEL_OFFSET - boundingClientRect.top
		@_context.save()
		@_context.translate(offsetX, offsetY)

		@_context.beginPath()
		for rect in rects
			@_context.rect(rect.left, rect.top, rect.width, rect.height)
		@_context.closePath()
		@_context.fillStyle = @_settings.fillStyle
		@_context.fill()
		@_context.restore()

	_yOffset: ->
		return if @_environment.isAppleDevice
			0
		else
			$(@_settings.contextWindow).scrollTop()

	_updateCanvasBounds: (newBounds) ->
		newBounds = newBounds || {top: 0, left: 0, width: 0, height: 0}
		@_canvas.style.top = (newBounds.top + @_yOffset()) + 'px'
		@_canvas.style.left = newBounds.left + 'px'
		@_canvas.width = newBounds.width
		@_canvas.height = newBounds.height

	_createCanvas: ->
		@_canvas = @_settings.contextDocument.createElement('canvas')
		@_canvas.className = CUSTOM_SELECTION_CANVAS_CLASS
		$(@_canvas).css(CUSTOM_SELECTION_CANVAS_STYLE)
		@_canvas.width = 0
		@_canvas.height = 0
		@_settings.$element[0].appendChild(@_canvas)
