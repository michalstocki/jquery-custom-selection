/**
 * Class Point
 */

(function(global) {
	'use strict';

	function Point(touchEvent) {
		var touches = touchEvent.touches || touchEvent.pointers;
		var touch = touches[0];
		this.clientX = touch.clientX;
		this.clientY = touch.clientY;
		this.pageX = touch.pageX;
		this.pageY = touch.pageY;
	}

	global.CustomSelection.Lib.Point = Point;

})(this);
