'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('jquery custom selection', function () {
	var URL = 'http://localhost:8004';

	it('enables selection and selects a specific word in a paragraph', function(done) {
		var PARAGRAPH_SELECTOR = '#pgepubid00498 p';
		var ENABLE_SELECTION_BUTTON_SELECTOR = '.button-enable';
		var MARKER_SELECTOR = PARAGRAPH_SELECTOR + ' span.marker';
		var SELECTED_TEXT_STATUS_SELECTOR = '.selected-text-status';
		var MOUSE_DOWN_TIME = 550;

		browser
			.url(URL)
			.click(ENABLE_SELECTION_BUTTON_SELECTOR)
			.moveToObject(PARAGRAPH_SELECTOR, 10, 5)
			.buttonDown(PARAGRAPH_SELECTOR)
			.pause(MOUSE_DOWN_TIME)
			.buttonUp(PARAGRAPH_SELECTOR)
			.isVisible(MARKER_SELECTOR, function(error, result) {
				expect(error).to.be.undefined;
				expect(result.length).to.equal(2);
			})
			.getText(SELECTED_TEXT_STATUS_SELECTOR, function(error, result) {
				expect(error).to.be.undefined;
				expect(result).to.equal('The');
			})
			.end(done);
	});
});
