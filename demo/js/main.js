$(function() {
	var IFRAME_BORDER_WIDTH = 9;
	var IFRAME_SCALE = 0.7;

	var $content;
	var $iframe = $('#main-frame');

	window.dConsole(window);

	$iframe.bind('load', function() {
		$content = $(this.contentWindow.document).find('.content');
		window.enableSelection();

	});

	window.enableSelection = function() {
		$content.customSelection({
			selectionColor: '#CAE0C0',
			onSelectionChange: onSelectionChange,
			startMarker: $('.start-marker'),
			endMarker: $('.end-marker'),
			markerShiftY: 40,
			contentOrigin: getContentOriginTransformation()
		});
		$('.settings button.button-enable').attr('disabled', true);
		$('.settings button:not(.button-enable)').attr('disabled', false);
	};

	window.disableSelection = function() {
		$content.disableCustomSelection();
		$('.settings button.button-enable').attr('disabled', false);
		$('.settings button:not(.button-enable)').attr('disabled', true);
	};

	window.refreshSelection = function() {
		$content.refreshCustomSelection(getContentOriginTransformation());
	};

	window.clearSelection = function() {
		$content.clearCustomSelection();
	};

	function getContentOriginTransformation() {
		var iframeOffset = $iframe.offset();
		return {
			offsetY: iframeOffset.top + IFRAME_BORDER_WIDTH * IFRAME_SCALE,
			offsetX: iframeOffset.left + IFRAME_BORDER_WIDTH * IFRAME_SCALE,
			scale: IFRAME_SCALE
		};
	}

	function onSelectionChange(range) {
		$('.selected-text-status').text(range.toString());
	}

});
