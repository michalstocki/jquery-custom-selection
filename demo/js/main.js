$(function() {
	var $content = $('.content');
	$content.on('touchstart', function(e) {
		e = e.originalEvent;
		logg('touchstart: ' + e.touches.length);
	}).on('touchmove', function(e) {
		e = e.originalEvent;
		logg('touchmove: ' + e.touches[0].clientX + '/' + e.touches[0].clientY);
	}).on('touchend', function(e) {
		e = e.originalEvent;
		logg('touchend: ' + e.touches.length);
	});

	window.enableSelection = function() {
		$content.customSelection({
			selectionColor: 'lightgreen',
			useMarkers: 'always',
			onSelectionChange: onSelectionChange
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

	window.enableSelection();
});
