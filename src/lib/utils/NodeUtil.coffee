class CustomSelection.Lib.Utils.NodeUtil

	nodeIsText: (node) ->
		return node.nodeType is Node.TEXT_NODE and node.length > 0

	getRectsForNode: (node) ->
		range = node.ownerDocument.createRange()
		range.selectNode(node)
		return range.getClientRects()

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
		body = node.ownerDocument.body
		while !node.nextSibling
			if node is body
				return null
			node = node.parentNode
		return node.nextSibling

	_getSiblingBeforeParentOf: (node) ->
		body = node.ownerDocument.body
		while !node.previousSibling
			if node is body
				return null
			node = node.parentNode
		return node.previousSibling
