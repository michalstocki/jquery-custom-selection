/**
 * Class Point
 */

(function(global) {
	'use strict';
	var defaults = {shiftY: 0};

	function Point(pointerEvent, options) {
		this._settings = $.extend({}, defaults, options);
		var touches = pointerEvent.touches || pointerEvent.pointers;
		var touch = touches[0];
		this.clientX = touch.clientX;
		this.clientY = touch.clientY + this._settings.shiftY;
		this.pageX = touch.pageX;
		this.pageY = touch.pageY + this._settings.shiftY;
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

	Point.prototype.scaleOffset = function(scale) {
		var shiftY = this._settings.shiftY;
		this.clientY = (this.clientY - shiftY) + shiftY * scale;
		this.pageY = (this.pageY - shiftY) + shiftY * scale;
	};

	global.CustomSelection.Lib.Point = Point;

})(this);
