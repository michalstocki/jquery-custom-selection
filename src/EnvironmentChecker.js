/**
 * Class EnvironmentChecker
 */

(function(global) {
	'use strict';

	function EnvironmentChecker() {
		this.userAgent = global.navigator.userAgent;
	}

	EnvironmentChecker.prototype.isAppleDevice = function() {
		return testUserAgent(/(iPad|iPhone|iPod)/g);
	};

	EnvironmentChecker.prototype.isAndroidStackBrowser = function() {
		return this.isAndroid() && testUserAgent(/Version\/\d\.\d/g);
	};

	EnvironmentChecker.prototype.isAndroidLowerThan = function(versionString) {
		if (!this.isAndroid()) {
			return false;
		}
		var expectedVersion = versionString.split('.');
		var expectedMajor = Number(expectedVersion[0]);
		var expectedMinor = Number(expectedVersion[1]);
		var actualVersion = userAgentMatch(/Android (\d)\.(\d)/g);
		var actualMajor = Number(actualVersion[1]);
		var actualMinor = Number(actualVersion[2]);
		return actualMajor < expectedMajor ||
				(actualMajor === expectedMajor && actualMinor < expectedMinor);
	};

	EnvironmentChecker.prototype.isAndroid = function() {
		return testUserAgent(/Android/g);
	};

	EnvironmentChecker.prototype.isWebkit = function() {
		return testUserAgent(/WebKit/g);
	};

	function userAgentMatch(regExp) {
		return regExp.exec(global.navigator.userAgent);
	}

	function testUserAgent(regExp) {
		return regExp.test(global.navigator.userAgent);
	}

	global.CustomSelection.Lib.EnvironmentChecker = EnvironmentChecker;

})(this);
