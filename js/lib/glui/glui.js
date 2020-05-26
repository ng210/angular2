include('webgl/webgl.js');
include('glui/label.js');

(function() {

    function getTypeName(type) {
        return type.charAt(0).toUpperCase() + type.substring(1).toLowerCase();
    }

    function fromNode(node) {
        var typeName = getTypeName(node.tagName);
        var control = Reflect.construct(glui[typeName], []);
        control.fromNode(node);
        return control;
    }

    public(getTypeName, 'getTypeName', glui);
    public(fromNode, 'fromNode', glui);
})();

