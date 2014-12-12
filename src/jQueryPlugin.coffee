(($) ->

	DATA_ATTR = 'customSelectionInstance'

	$.fn.customSelection = (options) ->
		customSelection = new CustomSelection(this[0], options)
		this.first().data(DATA_ATTR, customSelection)
		return this

	$.fn.refreshCustomSelection = (contentOrigin) ->
		this.first().data(DATA_ATTR).refresh(contentOrigin)
		return this

	$.fn.clearCustomSelection = () ->
		this.first().data(DATA_ATTR).clear()
		return this

	$.fn.disableCustomSelection = () ->
		this.first().data(DATA_ATTR).destroy()
		this.first().data(DATA_ATTR, null)
		return this

)(jQuery)