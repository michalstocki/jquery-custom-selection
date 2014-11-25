class CustomSelection.Lib.FrameRequester

	constructor: ->
		@_ticking = false

	requestFrame: (func) ->
		unless @_ticking
			window.requestAnimationFrame =>
				func()
				@_ticking = false
		@_ticking = true