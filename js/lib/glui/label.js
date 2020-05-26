include('glui/value-control.js');

(function() {

    function Label(id, template, parent) {
        Label.base.constructor.call(this, id, template, parent);
    }
    extend(glui.ValueControl, Label);

    public(Label, 'Label', glui);
})();