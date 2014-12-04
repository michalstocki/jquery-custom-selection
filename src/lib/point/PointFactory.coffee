class CustomSelection.Lib.Point.PointFactory

	_markersContext: null
	_environment: null
	_pointTargetLocator: null

	constructor: (@_environment, @_markersContext, @_pointTargetLocator) ->

	createFromContentEvent: (pointerEvent) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		targetElement = @_pointTargetLocator.getTargetFromEvent(pointerEvent)
		return new CustomSelection.Lib.Point.Point(pointer, targetElement)

	createFromMarkerEvent: (pointerEvent, shiftY) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		@_scalePointerCoords(pointer) unless @_pointerCoordsAutomaticallyScaled()
		@_shiftPointer(pointer, shiftY)
		targetElement = @_pointTargetLocator.getTargetByCoords(pointer)
		return new CustomSelection.Lib.Point.Point(pointer, targetElement)

	createFromClientCoordsInText: (coords) ->
		target = {node: coords.parentText, isText: true}
		return new CustomSelection.Lib.Point.Point(coords, target)

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
