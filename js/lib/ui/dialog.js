include('board.js');

(function() {
    var _overlay = document.createElement('div');
    _overlay.id = 'overlay';

	function Dialog(id, template, parent) {
        Ui.Board.call(this, id, template, parent);
        this.app = null;
        this.buttons = new Ui.Board('Buttons', {titlebar: false, css:'buttons'}, this);
        for (var i=0; i<this.template.buttons.length; i++) {
            var button = this.template.buttons[i];
            for (var key in Ui.Dialog.Buttons) {
                if (Ui.Dialog.Buttons[key] == button) {
                    this.buttons.addNew(key, { type:'button', css:'button', value:key});
                }
            }            
        }

	};
	extend(Ui.Board, Dialog);

	Ui.Control.Types['dialog'] = { ctor: Dialog, tag: 'DIALOG' };

	Dialog.prototype.getTemplate = function() {
        var template = Dialog.base.getTemplate.call(this);
        template.type = 'dialog';
        template.modal = true;
        template.buttons = [Ui.Dialog.Buttons.Ok];
        return template;
	};
	Dialog.prototype.registerHandler = function(event) {
		if (['dragging', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};
	Dialog.prototype.render = async function(ctx) {
        Dialog.base.render.call(this, ctx);
        this.buttons.render({element:this.element});
    };
    Dialog.prototype.show = function(visible) {
        if (visible) {
            if (this.template.modal) {
                document.body.appendChild(_overlay);
            }
            this.render();
        } else {
            if (this.template.modal) {
                document.body.removeChild(_overlay);
            }
            this.element.parentNode.removeChild(this.element);
        }
    };
    Dialog.prototype.open = function(app, data) {
        this.parent = app.ui;
        this.app = app;
        this.show(true);
    };
    Dialog.prototype.close = function(result) {
        this.show(false);
        if (this.app && typeof this.app.onDialog === 'function') this.app.onDialog(this, result);
    };

    Dialog.Buttons = {
        "Ok":       "ok",
        "Cancel":   "cancel",
        "Yes":      "yes",
        "No":       "no",
        "Save":     "save",
        "Create":   "create"
    };

	Ui.Dialog = Dialog;

})();