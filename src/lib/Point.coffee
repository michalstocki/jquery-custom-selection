
class CustomSelection.Lib.Point

	defaults =
		shiftY: 0

	clientX: 0
	clientY: 0
	pageX: 0
	pageY: 0

	_markersContext: null
	_settings: null
	_environment: null

	constructor: (pointerEvent, @_markersContext, @_environment, options) ->
		@_settings = $.extend({}, defaults, options)
		touches = pointerEvent.touches || pointerEvent.pointers
		touch = touches[0]
		@clientX = touch.clientX
		@clientY = touch.clientY + @_settings.shiftY
		@pageX = touch.pageX
		@pageY = touch.pageY + @_settings.shiftY

	convertToContentContext: ->
		if @_eventCoordsAutomaticallyConverted()
			@_scaleShiftToContentContext()
		else
			@clientX = @_markersContext.markersXToContentContext(@clientX)
			@clientY = @_markersContext.markersYToContentContext(@clientY)
			@pageX = @_markersContext.markersXToContentContext(@pageX)
			@pageY = @_markersContext.markersYToContentContext(@pageY)

	_scaleShiftToContentContext: () ->
		shiftY = @_settings.shiftY
		scaledShiftY = @_markersContext.scaleToContentContext(shiftY)
		@clientY = (@clientY - shiftY) + scaledShiftY
		@pageY = (@pageY - shiftY) + scaledShiftY

	_eventCoordsAutomaticallyConverted: ->
		return @_environment.isAndroidStackBrowser &&
			@_environment.isAndroidLowerThanKitkat