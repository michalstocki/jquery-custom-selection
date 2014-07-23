$(function() {
	$('body').on('touchstart', function(e) {
		e = e.originalEvent;
		logg('touchstart: ' + e.touches.length);
	}).on('touchmove', function(e) {
		e = e.originalEvent;
		logg('touchmove: ' + e.touches[0].clientX + '/' + e.touches[0].clientY);
	}).on('touchend', function(e) {
		e = e.originalEvent;
		logg('touchend: ' + e.touches.length);
	});
});