include('ge.js');

(function() {

    function BinaryNode(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;

        this.first = null;
        this.second = null;

        this.objects = [];
    }

    function BinaryTree(maxLevel, width, height) {
        this.objectQuadMap = {};
        this.nodes = [];

        // create full binary tree of BinaryNode objects
        var node = null;
        var nodeCount = 1
        var isHorizontal = width > height;
        var width = 1, height = 1;
        // add root
        this.nodes.push(new BinaryNode(0, 0, width, height));
        var ni = 2;
        for (var i=0; i<maxLevel; i++) {
            isHorizontal ? width /= 2 : height /= 2;
            for (var n=0; n<nodeCount; n++) {
                var parent = this.nodes[Math.round(ni/2) - 1];
                if (isHorizontal) {
                    parent.first = new BinaryNode(parent.left, parent.top, width, height);
                    this.nodes.push(parent.first);
                    ni++;
                    parent.second = new BinaryNode(parent.left+width, parent.top, width, height);
                    this.nodes.push(parent.second);
                    ni++;
                } else {
                    parent.first = new BinaryNode(parent.left, parent.top, width, height);
                    this.nodes.push(parent.first);
                    ni++;
                    parent.second = new BinaryNode(parent.left, parent.top+height, width, height);
                    this.nodes.push(parent.second);
                    ni++;
                }
            }
            nodeCount *= 2;
            isHorizontal = !isHorizontal;
        }
    }

    BinaryTree.prototype.insert = function insert(obj, left, top, right, bottom) {
        // find containing quad
        // insert obj
    };

    BinaryTree.prototype.remove = function remove(obj) {
        // get objects
        // remove from quad
    };

    public(BinaryTree, 'BinaryTree', GE);
})();