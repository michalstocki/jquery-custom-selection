'use strict';

var assert = require('assert');

describe('grunt-webdriver test', function () {
	it('checks if title is valid', function(done) {

		browser
			.url('http://localhost:8003')
			.getTitle(function(err,title) {
				assert(title.indexOf('Native range on own selection anchors in ePub') !== -1);
			})
			.end(done);

	});

});