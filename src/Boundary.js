
(function(global) {
	'use strict';
	/**
	 * Private class Boundary
	 */

	function Boundary(anchor) {
		this._container = anchor.container;
		this._offset = anchor.offset;
	}

	/**
	 * Class StartBoundary extends Boundary
	 */

	function StartBoundary() {
		Boundary.apply(this, arguments);
	}
	// Inheritance
	StartBoundary.prototype = Object.create(Boundary.prototype);

	StartBoundary.prototype.applyTo = function(range) {
		range.setStart(this._container, this._offset);
	};

	StartBoundary.prototype.applyOppositeTo = function(range) {
		range.setEnd(this._container, this._offset);
	};

	global.CustomSelection.Lib.StartBoundary = StartBoundary;

	/**
	 * Class StartBoundary extends Boundary
	 */

	function EndBoundary() {
		Boundary.apply(this, arguments);
	}
	// Inheritance
	EndBoundary.prototype = Object.create(Boundary.prototype);

	EndBoundary.prototype.applyTo = function(range) {
		range.setEnd(this._container, this._offset);
	};

	EndBoundary.prototype.applyOppositeTo = function(range) {
		range.setStart(this._container, this._offset);
	};

	global.CustomSelection.Lib.EndBoundary = EndBoundary;

})(this);
