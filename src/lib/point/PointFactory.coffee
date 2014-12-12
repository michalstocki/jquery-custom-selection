class CustomSelection.Lib.Point.PointFactory

	_contextTranslator: null
	_environment: null
	_pointTargetLocator: null

	constructor: (@_environment, @_contextTranslator, @_pointTargetLocator) ->

	createFromContentEvent: (pointerEvent) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		target = @_pointTargetLocator.getTargetFromEvent(pointerEvent)
		return new CustomSelection.Lib.Point.Point(pointer, target)

	createFromMarkerEvent: (pointerEvent, shiftY) ->
		pointer = @_getPointerFromEvent(pointerEvent)
		@_scalePointerCoords(pointer) unless @_pointerCoordsAutomaticallyScaled()
		@_shiftPointer(pointer, shiftY)
		target = @_pointTargetLocator.getTargetByCoords(pointer)
		return new CustomSelection.Lib.Point.Point(pointer, target)

	createFromClientCoordsInText: (coords, textNode) ->
		target = {node: textNode, isText: true}
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
		pointer.clientX = @_contextTranslator.markersXToContentContext(pointer.clientX)
		pointer.clientY = @_contextTranslator.markersYToContentContext(pointer.clientY)
		pointer.pageX = @_contextTranslator.markersXToContentContext(pointer.pageX)
		pointer.pageY = @_contextTranslator.markersYToContentContext(pointer.pageY)


	_shiftPointer: (pointer, shiftY) ->
		shiftY = @_contextTranslator.scaleToContentContext(shiftY)
		pointer.pageY = pointer.pageY + shiftY
		pointer.clientY = pointer.clientY + shiftY
