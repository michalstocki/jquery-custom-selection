'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('jquery custom selection', function() {
	var URL = 'http://localhost:8004';
	var BROWSER_SIZE = {width: 1280, height: 1024};
	var PARAGRAPH_SELECTOR = '#pgepubid00498 p';
	var ENABLE_SELECTION_BUTTON_SELECTOR = '.button-enable';
	var MARKER_SELECTOR = PARAGRAPH_SELECTOR + ' span.marker';
	var SELECTED_TEXT_STATUS_SELECTOR = '.selected-text-status';
	var MOUSE_DOWN_TIME = 550;

	browser.addCommand("initializeAndSelectAWordNearElement", function(click, done) {
		this.url(URL)
			.setViewportSize(BROWSER_SIZE)
			.click(ENABLE_SELECTION_BUTTON_SELECTOR)
			.moveToObject(click.elementSelector, click.xOffset, click.yOffset)
			.buttonDown(click.elementSelector)
			.pause(MOUSE_DOWN_TIME)
			.buttonUp(click.elementSelector)
			.isVisible(MARKER_SELECTOR, function(error, result) {
				expect(error).to.be.undefined;
				expect(result.length).to.equal(2);
				done(error);
			})
	});

	it('enables selection and selects a specific word in a paragraph', function(done) {
		browser
			.initializeAndSelectAWordNearElement({
				elementSelector: PARAGRAPH_SELECTOR,
				xOffset: 200,
				yOffset: 5
			})
			.getText(SELECTED_TEXT_STATUS_SELECTOR, function(error, result) {
				expect(error).to.be.undefined;
				expect(result).to.equal('classification');
			})
			.end(done);
	});
});
