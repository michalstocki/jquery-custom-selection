$(function() {
	var $body = $('body');
	$body.on('touchstart', function(e) {
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
		CustomSelection.enable($body, {
			startMarkerClass: 'marker',
			endMarkerClass: 'marker_end'
		});

		$('.settings .button-enable').attr('disabled', true);
		$('.settings .button-disable').attr('disabled', false);
	};

	window.disableSelection = function() {
		CustomSelection.disable($body);
		$('.settings .button-enable').attr('disabled', false);
		$('.settings .button-disable').attr('disabled', true);
	};

});