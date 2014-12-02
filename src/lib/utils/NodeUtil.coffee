class CustomSelection.Lib.Utils.NodeUtil

	_contentContext: null

	constructor: (@_contentContext) ->


	nodeIsText: (node) ->
		return node.nodeType == Node.TEXT_NODE && node.length > 0

	getRectsForNode: (node) ->
		range = @_contentContext.createRange();
		range.selectNode(node);
		return range.getClientRects();

	nodeHasRects: (node) ->
		return @getRectsForNode(node).length > 0

	nodeHasChildren: (node) ->
		return node.childNodes.length > 0