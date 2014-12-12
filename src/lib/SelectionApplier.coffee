class CustomSelection.Lib.SelectionApplier

	_settings: null
	_lastSelection: null
	_markersWrapper: null
	_selectionDrawer: null
	_contentContext: null

	constructor: (@_settings, @_lastSelection, @_markersWrapper, @_selectionDrawer, @_contentContext) ->

	applySelectionFor: (range) ->
		if range?
			unless @_lastSelection.rangeEqualsTo(range)
				@_drawSelection(range)
				@_settings.onSelectionChange.call(null, range)
				@_lastSelection.range = range
			@_markersWrapper.showMarkers()

	refreshSelection: ->
		if @_lastSelection.exists()
			@_drawSelection(@_lastSelection.range)

	clearSelection: ->
		if @_lastSelection.exists()
			@_selectionDrawer.clearSelection()
			@_settings.onSelectionChange.call(null, @_contentContext.createRange())
		@_markersWrapper.hideMarkers()
		@_lastSelection.range = null

	_drawSelection: (range) ->
		@_selectionDrawer.redraw(range)
		@_markersWrapper.alignMarkersToRange(range)


