class CustomSelection.Lib.Rectangler

	constructor: (@environment) ->

	getRectsFor: (range) ->
		rects = [].slice.call(range.getClientRects())
		if @environment.isWebkit
			rects = @_filterDuplicatedRects(rects)
		return rects

	_filterDuplicatedRects: (rects) ->
		lastRect = rects[rects.length - 1]
		return rects.filter (rect) =>
			return !(@_rectEndsAfterLastRect(rect, lastRect) ||
				@_rectContainsOneOfRects(rect, rects))

	_rectEndsAfterLastRect: (rect, lastRect) ->
		TOLERATED_RIGHT_LEAK = 1
		return rect.bottom == lastRect.bottom &&
			rect.right - lastRect.right > TOLERATED_RIGHT_LEAK

	_rectContainsOneOfRects: (rect, rects) ->
		for r in rects
			if @_rectContainsNotEmptyRect(rect, r)
				return true
		return false

	_rectContainsNotEmptyRect: (possibleParent, potentialChild) ->
		MINIMAL_RECT_WIDTH = 2
		MINIMAL_RECT_HEIGHT = 1
		R = possibleParent
		r = potentialChild
		return !@_rectsAreEqual(R, r) &&
			R.top <= r.top &&
			R.right >= r.right &&
			R.bottom >= r.bottom &&
			R.left <= r.left &&
			r.height >= MINIMAL_RECT_HEIGHT &&
			r.width >= MINIMAL_RECT_WIDTH

	_rectsAreEqual: (rectA, rectB) ->
		return rectA == rectB ||
			(rectA.left == rectB.left &&
				rectA.right == rectB.right &&
				rectA.height == rectB.height &&
				rectA.width == rectB.width)