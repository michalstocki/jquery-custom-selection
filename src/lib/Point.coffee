
class CustomSelection.Lib.Point

	defaults = {shiftY: 0}

	constructor: (pointerEvent, options) ->
		@_settings = $.extend({}, defaults, options)
		touches = pointerEvent.touches || pointerEvent.pointers
		touch = touches[0]
		@clientX = touch.clientX
		@clientY = touch.clientY + @_settings.shiftY
		@pageX = touch.pageX
		@pageY = touch.pageY + @_settings.shiftY

	translate: (vector) ->
		@clientX += vector.x
		@clientY += vector.y
		@pageX += vector.x
		@pageY += vector.y

	scale: (scale) ->
		@clientX *= scale
		@clientY *= scale
		@pageX *= scale
		@pageY *= scale

	scaleOffset: (scale) ->
		shiftY = @_settings.shiftY
		@clientY = (@clientY - shiftY) + shiftY * scale
		@pageY = (@pageY - shiftY) + shiftY * scale
