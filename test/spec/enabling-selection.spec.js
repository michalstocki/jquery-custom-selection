'use strict';

var chai = require('chai');

describe('grunt-webdriver test', function () {

	it('adds enables selection and selects a word in paragraph', function(done) {
		var PARAGRAPH_SELECTOR = '#pgepubid00498 p';
		var ENABLE_SELECTION_BUTTON_SELECTOR = '.button-enable';
		var MARKER_SELECTOR = PARAGRAPH_SELECTOR + ' span.marker';
		var MOUSE_DOWN_TIME = 550;

		browser
			.url('http://localhost:8004')
			.click(ENABLE_SELECTION_BUTTON_SELECTOR)
			.moveToObject(PARAGRAPH_SELECTOR)
			.buttonDown(PARAGRAPH_SELECTOR)
			.pause(MOUSE_DOWN_TIME)
			.buttonUp(PARAGRAPH_SELECTOR)
			.isVisible(MARKER_SELECTOR, function(error, result) {
				chai.expect(error).to.be.undefined;
				chai.expect(result.length).to.equal(2);
			})
			.saveScreenshot('./screenshot.png')
			.end(done);
	});
});
