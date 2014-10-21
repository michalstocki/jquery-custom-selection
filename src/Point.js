/**
 * Class Point
 */

(function(global) {
	'use strict';
	var defaults = {shift: true};
	var SHIFT_Y = -32;

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

	Point.prototype.translate = function(x, y) {
		this.clientX = this.clientX + x;
		this.clientY = this.clientY + y;
		this.pageX = this.pageX + x;
		this.pageY = this.pageY + y;
	};

	Point.prototype.scale = function(scale) {
		this.clientX = this.clientX * scale;
		this.clientY = this.clientY * scale;
		this.pageX = this.pageX * scale;
		this.pageY = this.pageY * scale;
	};

	global.CustomSelection.Lib.Point = Point;

})(this);
