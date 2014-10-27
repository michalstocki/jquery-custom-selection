$(function() {
	var IFRAME_BORDER_WIDTH = 9;
	var IFRAME_SCALE = 0.7;

	var $content;
	var $iframe = $('#main-frame');
	var iframeOffset;
	$iframe.bind('load', function() {
		$content = $(this.contentWindow.document).find('.content');
		iframeOffset = $iframe.offset();
		window.enableSelection();

	});

	window.enableSelection = function() {
		$content.customSelection({
			selectionColor: '#CAE0C0',
			onSelectionChange: onSelectionChange,
			startMarker: $('.start-marker'),
			endMarker: $('.end-marker'),
			contextOriginGetter: getCustomSelectionOrigin
		});
		$('.settings .button-enable').attr('disabled', true);
		$('.settings .button-disable').attr('disabled', false);
	};

	window.disableSelection = function() {
		$content.disableCustomSelection();
		$('.settings .button-enable').attr('disabled', false);
		$('.settings .button-disable').attr('disabled', true);
	};

	function onSelectionChange(range) {
		$('.selected-text-status').text(range.toString());
	}



	function getCustomSelectionOrigin() {
		return {
			offsetY: iframeOffset.top + IFRAME_BORDER_WIDTH * IFRAME_SCALE,
			offsetX: iframeOffset.left + IFRAME_BORDER_WIDTH * IFRAME_SCALE,
			scale: IFRAME_SCALE
		};
	}

});
