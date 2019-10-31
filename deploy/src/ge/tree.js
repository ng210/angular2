(function() {
    function TreeNode(id, parentNode, nodeData) {
        this.id = id;
        this.parent = parentNode || null;
        this.data = nodeData || null;
        this.edges = [];
        this.flag = 0;
    };
    function TreeEdge(from, to, edgeData) {
        this.from = from;
        this.to = to;
        this.data = edgeData || null;
    };

    function Tree() {
        this.root = null;
        this.nodes = [];
        this.edges = [];
    }

    Tree.prototype.createNode = function(nodeData) {
        var node = new TreeNode(this.nodes.length, null, nodeData);
        this.nodes.push(node);
        return node;
    };

    Tree.prototype.addNode = function(parentNode, nodeData, edgeData) {
        var node = this.createNode(nodeData);
        var childNode = node;
        if (!parentNode || !this.root) {
            childNode = this.root;
            parentNode = node;
            this.root = node;
        }
        this.nodes.push(node);
        if (childNode != null) {
            this.addEdge(parentNode, childNode, edgeData);
        }
        return node;
     };

    Tree.prototype.addEdge = function(from, to, edgeData) {
        var edge = new TreeEdge(from, to, edgeData);
        from.edges.push(edge);
        this.edges.push(edge);
        return edge;
    };

    Tree.prototype.DFS = function(startNode, preHandler, postHandler, args) {
        var remaining = [startNode];
        startNode.flag = 1;
        while (remaining.length > 0) {
            var node = remaining[remaining.length-1];
            if (node.flag == 1) {
                if (typeof preHandler === 'function') {
                    preHandler.call(this, node, args);
                }
                node.flag = 2;
                for (var i=node.edges.length-1; i>=0; i--) {
                    var child = node.edges[i].to;
                    if (child.flag == 0) {
                        child.flag = 1;
                        remaining.push(child);
                    }
                }
            } else if (node.flag == 2) {
                if (typeof postHandler === 'function') {
                    postHandler.call(this, node, args);
                }
                node.flag = 3;
                remaining.pop();
            }
        }
    };

    Tree.createComplete = function(levelCount, nodeDegree) {
        var tree = new Tree();
        var nodeCount = 1;
        var nodeId = 1;
        for (var i=0; i<levelCount; i++) {
            for (var n=0; n<nodeCount; n++) {
                var parentId = Math.round(nodeId/nodeDegree);
                tree.addNode(tree.nodes[parentId - 1], nodeId, `${parentId} -> ${nodeId}`);
                nodeId++;
            }
            nodeCount  *= nodeDegree;
        }
        return tree;
    }

    //module.exports = Tree;
	public(Tree, 'Tree');
})();
