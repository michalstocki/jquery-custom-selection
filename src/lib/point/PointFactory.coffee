class CustomSelection.Lib.Point.PointFactory

	_markersContext: null
	_environment: null

	constructor: (@_environment, @_markersContext) ->

	createFromContentEvent: (pointerEvent) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		return new CustomSelection.Lib.Point.Point(pointer)

	createFromMarkerEvent: (pointerEvent, shiftY) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		@_scalePointerCoords(pointer) unless @_pointerCoordsAutomaticallyScaled()
		@_shiftPointer(pointer, shiftY)
		return new CustomSelection.Lib.Point.Point(pointer)

	createFromClientCoordsInText: (coords) ->
		point =  new CustomSelection.Lib.Point.Point(coords)
		point.parentText = coords.parentText
		return point

	_getPointerFromEvent: (pointerEvent) ->
		pointers = pointerEvent.touches || pointerEvent.pointers
		return @_clonePointer(pointers[0])

	_clonePointer: (pointer) ->
		newPointer = {}
		for coord in ['pageX', 'pageY', 'clientX', 'clientY']
			newPointer[coord] = pointer[coord]
		return newPointer

	_pointerCoordsAutomaticallyScaled: ->
		return @_environment.isAndroidStackBrowser &&
			@_environment.isAndroidLowerThanKitkat

	_scalePointerCoords: (pointer) ->
		pointer.clientX = @_markersContext.markersXToContentContext(pointer.clientX)
		pointer.clientY = @_markersContext.markersYToContentContext(pointer.clientY)
		pointer.pageX = @_markersContext.markersXToContentContext(pointer.pageX)
		pointer.pageY = @_markersContext.markersYToContentContext(pointer.pageY)


	_shiftPointer: (pointer, shiftY) ->
		shiftY = @_markersContext.scaleToContentContext(shiftY)
		pointer.pageY = pointer.pageY + shiftY
		pointer.clientY = pointer.clientY + shiftY
