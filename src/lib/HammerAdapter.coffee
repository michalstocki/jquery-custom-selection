class CustomSelection.Lib.HammerAdapter

	_bindings: {}
	_settings: null

	constructor: (@_settings) ->

	bindTapHoldInElement: (element, callback) ->
		bindings = @_getBindingsFor(element)
		hammer = new Hammer.Manager(element, {recognizers: [[Hammer.Press]]})
		hammer.set
			holdThreshold: @_settings.holdThreshold
			holdTimeout: @_settings.holdTimeout
		hammer.on('press', callback)
		bindings.push(hammer)

	bindTapInElement: (element, callback) ->
		bindings = @_getBindingsFor(element)
		hammer = new Hammer.Manager(element, {recognizers: [[Hammer.Tap]]})
		hammer.on('tap', callback)
		bindings.push(hammer)

	destroyBindingsFor: (element) ->
		hammer.destroy() for hammer in @_getBindingsFor(element)
		delete @_bindings[element]

	_getBindingsFor: (element) ->
		return @_bindings[element] || (@_bindings[element] = [])
