include('/ui/control.js');

// Abstract base type for container controls
(function() {
    Ui.Container = function(id, template, parent) {
        Ui.Control.call(this, id, template, parent);
        // template
        // - titlebar (bool|text): titlebar
        // - fixed (bool): moveable and resizeabe
        this.template = template || { fixed: false, titlebar: id, type:'container' };
        this.titleBar = null;
    }
    Ui.Container.base = Ui.Control.prototype;
    Ui.Container.prototype = new Ui.Control();

	Ui.Container.prototype.registerHandler = function(event) {
        if (['click', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Ui.Container.prototype.render = function(node) {
        Ui.Container.base.render.call(this, node);
        // eventually create titlebar
        if (this.titleBar === null && this.template.titlebar) {
            this.titleBar = document.createElement('div');
            this.titleBar.id = this.id + '#title';
            this.titleBar.className = this.cssText + 'titlebar';
            this.titleBar.innerHTML = this.template.titlebar;
            this.titleBar.control = this;
            this.element.insertBefore(this.titleBar, this.element.childNodes[0]);
        }
    };

})();