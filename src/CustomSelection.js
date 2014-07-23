
(function(global) {
	// Default configuration
	var startMarkerClass = 'start-marker';
	var endMarkerClass = 'end-marker';

//	Public interface -----------------------------------------------------------

	global.CustomSelection = {
		enable: function(element, options) {
			if (options) {
				startMarkerClass = options.startMarkerClass || startMarkerClass;
				endMarkerClass = options.endMarkerClass || endMarkerClass;
				bindTouchFor(element);
			}
		},
		disable: function(element) {
			unbindTouchFor(element);
			clearSelection();
		}
	};

//	Private methods ------------------------------------------------------------

	var startAnchor = null;
	var endAnchor = null;
	var startOffset = null;
	var endOffset = null;
	var startMarker = null;
	var endMarker = null;
	var lastPoint = null;
	var ticking = false;

//	-- Binding events

	function bindTouchFor(element) {
		$(element)
			.on('touchstart', handleTouchStart)
			.on('touchmove', handleTouchMove)
			.on('touchend', handleTouchEnd);
	}

	function unbindTouchFor(element) {
		$(element)
			.off('touchstart', handleTouchStart)
			.off('touchmove', handleTouchMove)
			.off('touchend', handleTouchEnd);
	}

	function handleTouchStart(e) {
		e = e.originalEvent;
		clearSelection();
		var eventAnchor = getTouchedElementFromEvent(e);
		var point = getTouchPoint(e);
		markStart(eventAnchor, point);
	}

	function handleTouchMove(e) {
		e.preventDefault();
		e = e.originalEvent;
		lastPoint = getTouchPoint(e);
		requestTick(function() {
			var eventAnchor = getTouchedElementByPoint(lastPoint);
			markEnd(eventAnchor, lastPoint);
			ticking = false;
		});
	}

	function handleTouchEnd() {
		console.log('sA, eA, sO, eO', startAnchor, endAnchor, startOffset, endOffset);
		createSelection();
	}

//	-- Creating Selection

	function clearSelection() {
		window.getSelection().removeAllRanges();
		$('.' + startMarkerClass).remove();
		$('.' + endMarkerClass).remove();
	}

	function createSelection() {
		var range = document.createRange();
		range.setStart(startAnchor, startOffset);
		range.setEnd(endAnchor, endOffset);
		window.getSelection().addRange(range);
	}

//	-- Preparing Markers

	function getTouchPoint(touchEvent) {
		// TODO: extract as model
		var touch = touchEvent.touches[0];
		return {
			clientX: touch.clientX,
			clientY: touch.clientY,
			pageX: touch.pageX,
			pageY: touch.pageY
		};
	}

	function getTouchedElementFromEvent(touchEvent) {
		return touchEvent.touches[0].target;
	}

	function getTouchedElementByPoint(touchPoint) {
		return document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
	}

	function markStart(element, point) {
		startMarker = startMarker || createMarker(startMarkerClass);
		var markerOffset = mark(element, point, startMarker);
		if (markerOffset) {
			startAnchor = startMarker.parentNode;
			startOffset = markerOffset;
		}
	}

	function markEnd(element, point) {
		endMarker = endMarker || createMarker(endMarkerClass);
		var markerOffset = mark(element, point, endMarker);
		if (markerOffset) {
			endAnchor = endMarker.parentNode;
			endOffset = markerOffset;
		}
	}

	function createMarker(kind) {
		var span = document.createElement('span');
		span.setAttribute('class', kind);
		return span;
	}

	function requestTick(func) {
		// TODO: extract to external collaborator
		if (!ticking) {
			window.requestAnimationFrame(func);
		}
		ticking = true;
	}

//	-- Marking

	function mark(el, point, marker) {
		var textNode;
		if (textNode = getFromElNodeContainingPoint(el, point)) {
			while (textNode.length > 1) {
				var trimPosition = textNode.length >> 1;
				var subNode = textNode.splitText(trimPosition);
				if (nodeContainsPoint(subNode, point)) {
					textNode = subNode;
				}
			}
			putMarkerBefore(textNode, marker);
		} else if (textNode = getClosestTextNodeFromEl(el, point)) {
			putMarkerAfter(textNode, marker);
		} else {
			return null;
		}
		marker.parentNode.normalize();
		return getIndexOfElement(marker);
	}

	function putMarkerBefore(node, marker) {
		node.parentNode.insertBefore(marker, node);
	}

	function putMarkerAfter(node, marker) {
		if (node.nextSibling) {
			node.parentNode.insertBefore(marker, node.nextSibling);
		} else {
			node.parentNode.appendChild(marker);
		}
	}

	function getIndexOfElement(element) {
		var elements = element.parentElement.childNodes;
		return Array.prototype.indexOf.call(elements, element);
	}

// ---- Finding nearest text node
// ------ Finding node containing point

	function getFromElNodeContainingPoint(el, point) {
		var nodes = el.childNodes;
		for (var i = 0, n; n = nodes[i++];) {
			if (nodeIsText(n) && nodeContainsPoint(n, point)) {
				return n;
			}
		}
	}

	function nodeContainsPoint(node, point) {
		var rects = getRectsForNode(node);
		for (var j = 0, rect; rect = rects[j++];) {
			if (rectContainsPoint(rect, point)) {
				return true;
			}
		}
	}

	function getRectsForNode(node) {
		var range = document.createRange();
		range.selectNode(node);
		return range.getClientRects();
	}

	function rectContainsPoint(rect, point) {
		var x = point.clientX, y = point.clientY;
		return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
	}

	function nodeIsText(node) {
		return node.nodeType === Node.TEXT_NODE && node.length;
	}

// ------ Finding node closest to pointer

	function getClosestTextNodeFromEl(el, point) {
		var node = el;
		var subNode;
		while (subNode = getClosestNodeFromEl(node, point)) {
			if (nodeIsText(subNode)) {
				return subNode;
			} else {
				node = subNode;
			}
		}
		return null;
	}

	function getClosestNodeFromEl(el, point) {
		var nodes = el.childNodes;
		var closestNode = null;
		for (var i = 0, n; n = nodes[i++];) {
			var rects;
			if ((rects = getRectsForNode(n)) && rects.length) {
				closestNode = closestNode || n;
				closestNode = getNodeCloserToPoint(point, closestNode, n);
			}
		}
		return closestNode;
	}

	function getNodeCloserToPoint(point, winner, rival) {
		var nearestWinnerRect = getRectNearestToPoint(winner, point);
		var nearestRivalRect = getRectNearestToPoint(rival, point);
		if (nearestRivalRect && nearestWinnerRect &&
			nearestRivalRect !== nearestWinnerRect &&
			nearestRivalRect.top >= nearestWinnerRect.top) {
			return rival;
		} else {
			return winner;
		}
	}

	function getRectNearestToPoint(node, point) {
		var y = point.clientY;
		var rects = getRectsForNode(node);
		var nearestRect = null;
		for (var j = 0, rect; rect = rects[j++];) {
			if (rect.top < y) {
				nearestRect = nearestRect || rect;
				if (nearestRect !== rect && rect.top >= nearestRect.top) {
					nearestRect = rect;
				}
			}
		}
		return nearestRect;
	}

})(this);

