/**
 * Class Point
 */

(function(global) {
	'use strict';
	var defaults = {shift: true};
	var SHIFT_Y = -32;

	function Point(touchEvent, options) {
		var settings = $.extend({}, defaults, options);
		var touches = touchEvent.touches || touchEvent.pointers || [touchEvent];
		var touch = touches[0];
		this.clientX = touch.clientX;
		this.clientY = touch.clientY;
		this.pageX = touch.pageX;
		this.pageY = touch.pageY;
		if (settings.shift) {
			this.clientY += SHIFT_Y;
			this.pageY += SHIFT_Y;
		}
	}

	global.CustomSelection.Lib.Point = Point;

})(this);
