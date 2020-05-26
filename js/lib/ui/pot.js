include('valuecontrol.js');

(function() {
    var _supportedEvents = ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup', 'dragging'];

    function Pot(id, tmpl, parent) {
        Ui.ValueControl.call(this, id, tmpl, parent);
        this.registerHandler('dragging');
    };
    extend(Ui.ValueControl, Pot);

    Ui.Control.Types['pot'] = { ctor: Pot, tag: 'pot' };

    Pot.prototype.getTemplate = function() {
        var template = Pot.base.getTemplate();
        template.numeric = true;
        template.type = 'pot';
        return template;
    };
    Pot.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };

    Pot.prototype.ondragging = function(e) {
        var value = Math.floor(this.getValue() + -e.deltaY);
        this.setValue(value);
        return false;
    };
    Pot.prototype.onkeyup = function(e) {
        console.log(e.type);
    };

    Ui.Pot = Pot;

})();