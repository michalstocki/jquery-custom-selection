
class CustomSelection.Lib.EnvironmentChecker

	isAppleDevice: ->
		return testUserAgent(/(iPad|iPhone|iPod)/g)

	isAndroidStackBrowser: ->
		return @isAndroid() && testUserAgent(/Version\/\d\.\d/g)

	isAndroidLowerThan: (versionString) ->
		return false unless @isAndroid()
		expectedVersion = versionString.split('.')
		expectedMajor = Number(expectedVersion[0])
		expectedMinor = Number(expectedVersion[1])
		actualVersion = userAgentMatch(/Android (\d)\.(\d)/g)
		actualMajor = Number(actualVersion[1])
		actualMinor = Number(actualVersion[2])
		return actualMajor < expectedMajor ||
			(actualMajor == expectedMajor && actualMinor < expectedMinor)

	isAndroid: ->
		return testUserAgent(/Android/g)

	isWebkit: ->
		testUserAgent(/WebKit/g)

	userAgentMatch = (regExp) ->
		return regExp.exec(window.navigator.userAgent)

	testUserAgent = (regExp) ->
		return regExp.test(window.navigator.userAgent)