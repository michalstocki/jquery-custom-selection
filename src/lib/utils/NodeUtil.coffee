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

	getTextNodeAfter: (node) ->
		loop
			if @nodeHasChildren(node)
				node = node.childNodes[0]
			else if node.nextSibling
				node = node.nextSibling
			else if uncle = @_getSiblingAfterParentOf(node)
				node = uncle
			else
				return null
			break if @nodeIsText(node)
		return node

	getTextNodeBefore: (node) ->
		loop
			if @nodeHasChildren(node)
				node = node.childNodes[node.childNodes.length - 1]
			else if node.previousSibling
				node = node.previousSibling
			else if uncle = @_getSiblingBeforeParentOf(node)
				node = uncle
			else
				return null
			break if @nodeIsText(node)
		return node

	_getSiblingAfterParentOf: (node) ->
		while !node.nextSibling
			if node == node.ownerDocument.body
				return null
			node = node.parentNode
		return node.nextSibling

	_getSiblingBeforeParentOf: (node) ->
		while !node.previousSibling
			if node == node.ownerDocument.body
				return null
			node = node.parentNode
		return node.previousSibling
