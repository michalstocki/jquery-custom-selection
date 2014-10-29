/**
 * Class Point
 */

(function(global) {
	'use strict';
	var defaults = {shift: true};
	var SHIFT_Y = -64;

	function Point(pointerEvent, options) {
		var settings = $.extend({}, defaults, options);
		var touches = pointerEvent.touches || pointerEvent.pointers;
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

	Point.prototype.translate = function(vector) {
		this.clientX += vector.x;
		this.clientY += vector.y;
		this.pageX += vector.x;
		this.pageY += vector.y;
	};

	Point.prototype.scale = function(scale) {
		this.clientX *= scale;
		this.clientY *= scale;
		this.pageX *= scale;
		this.pageY *= scale;
	};

	global.CustomSelection.Lib.Point = Point;

})(this);
