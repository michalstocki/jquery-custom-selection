(function($) {

	var DATA_ATTR = 'customSelectionInstance';

	$.fn.customSelection = function(options) {
		var customSelection = new CustomSelection(this[0], options);
		this.first().data(DATA_ATTR, customSelection);
		return this;
	};

	$.fn.refreshCustomSelection = function(contentOrigin) {
		this.first().data(DATA_ATTR).refresh(contentOrigin);
		return this;
	};

	$.fn.clearCustomSelection = function() {
		this.first().data(DATA_ATTR).clear();
		return this;
	};

	$.fn.disableCustomSelection = function() {
		this.first().data(DATA_ATTR).destroy();
		this.first().data(DATA_ATTR, null);
		return this;
	};

})(jQuery);