include('board.js');

// unstructured container of controls
(function() {
	function Panel(id, template, parent) {
        Ui.Container.call(this, id, template, parent);
        //this.container = new Ui.Board(`${this.id}#content`, { titlebar:false, css:'content' }, this);
        //this.container.renderItems = Panel.renderItems;
        this.split = this.template.split;
	};
	extend(Ui.Container, Panel);
    Ui.Control.Types['panel'] = { ctor: Panel, tag: 'PANEL' };

    // Object.defineProperties(Panel.prototype, {
    //     'count': { get: function() { return Object.keys(this.container.items).length; }},
    //     'items': { get: function() { return this.container.items; }}
    // });

	Panel.prototype.getTemplate = function() {
		var template = Panel.base.getTemplate.call(this);
        template.type = 'panel';
        template.split = [];
        template.items = {};
        template.handlerSize = 4;
        template.fixed = false;
        if (!template.events.includes('dblclick'))  template.events.push('dblclick');
		return template;
    };
	Panel.prototype.registerHandler = function(event) {
		if (['dblclick'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };
    Panel.prototype.renderItems = async function(ctx) {
        ctx = ctx || {element: this.content.element };
        var cnt = ctx.element;
        cnt.style.display = 'flex';
        //cnt.style['box-sizing'] = 'border-box';
        cnt.style.flexDirection = this.layout == Ui.Container.Layout.Horizontal ? 'row' : 'column';
        //cnt.style.alignItems = 'stretch';

        if (this.rebuild) {
            while (cnt.children.length > 0) {
                cnt.removeChild(cnt.children[0]);
            }
        }
        var context = {element:cnt};
        var restCount = this.itemOrder.length;
        var clientWidth = cnt.clientWidth - (restCount-1)*this.template.handlerSize;
        var restWidth = clientWidth;
        var clientHeight = cnt.clientHeight - (restCount-1)*this.template.handlerSize;
        var restHeight = clientHeight;
        var restSize = 1;
        for (var i=0; i<this.itemOrder.length; i++) {
            var lastButOneItem = i == this.itemOrder.length-1;
            var item = this.item(i);
            await item.render(context);
            var style = item.element.style;
            //style.display = 'flex';
            style['box-sizing'] = 'border-box';
            var size = this.split[i] || restSize/restCount;
            if (size < 1) restSize -= size;
            if (this.layout == Ui.Container.Layout.Horizontal) {
                var width = !lastButOneItem ? (size < 1 ? Math.floor(clientWidth*size) : size) : restWidth;
                style.width = width + 'px';
                restWidth -= width;
            } else {
                var height = !lastButOneItem ? (size < 1 ? Math.floor(clientHeight*size) : size) : restHeight;
                style.height = height + 'px';
                restHeight -= height;
            }
            style.flex = '1 1 auto';
            if (!lastButOneItem && !this.template.fixed) {
                var handler = new Ui.Label(`${this.id}#handler`, { css:'handler', value:'', events:['dragging'] }, this.content);
                handler.panel = this;
                await handler.render(context);
                handler.element.style.boxSizing = 'border-box';
                if (this.layout == Ui.Container.Layout.Horizontal) {
                    handler.element.style.width = this.template.handlerSize + 'px';
                    handler.element.style.cursor = 'col-resize';
                    //restWidth -= this.template.handlerSize;
                } else {
                    handler.element.style.height = this.template.handlerSize + 'px';
                    handler.element.style.cursor = 'row-resize';
                    //restHeight -= this.template.handlerSize;
                }        
            }
        }
    };
    Panel.prototype.render = async function(ctx) {
        if (!this.css.includes('panel') && !(this.parent instanceof Ui.Panel)) {
            this.css.push('panel');
        }
        // this.container = this.container || new Ui.Control(`${this.id}_content`, null, this);
        Panel.base.render.call(this, ctx);
        //console.log(['this: ' + this.id, 'element.parentNode: ' + this.element?.parentNode?.id, 'parent.element: ' + this.parent?.element?.id, 'element: ' + this.element?.id]);
        //this.container.render(ctx);

        //this.container.render({element:this.element});
    };
    
    Panel.prototype.ondragging = function(e) {
        var handler = e.control.element;
        var panel = e.control.panel;
        var prev = handler.previousSibling;
        var next = handler.nextSibling;
        if (panel.layout == Ui.Container.Layout.Horizontal) {
            var width = prev.offsetWidth + next.offsetWidth;
            var leftWidth = Math.round(e.clientX - prev.control.left);
            if (leftWidth < this.template.handlerSize) leftWidth = this.template.handlerSize;
            else if (leftWidth > width-this.template.handlerSize) leftWidth = width-this.template.handlerSize;
            var rightWidth = width - leftWidth;
            prev.style.width = leftWidth + 'px';
            next.style.width = rightWidth + 'px';
console.log([width, leftWidth, prev.offsetWidth, rightWidth, next.offsetWidth]);
        } else {
            var height = prev.offsetHeight + next.offsetHeight;
            var topHeight = Math.round(e.clientY - prev.control.top);
            if (topHeight < this.template.handlerSize) topHeight = this.template.handlerSize;
            else if (topHeight > height-this.template.handlerSize) topHeight = height-this.template.handlerSize;
            var bottomHeight = height - topHeight;
            prev.style.height = topHeight + 'px';
            next.style.height = bottomHeight + 'px';
        }
        return true;
    };

    Panel.prototype.ondblclick = function(e) {
        if (this.onSplit) {
            var itemBefore = e.target.control;
            var newItem = this.onSplit(itemBefore);
            e.control.add(`${e.target.control.panel.id}#${e.target.control.panel.count}`, newItem, itemBefore);
            e.control.render();
            return true;
        }
    };

	Ui.Panel = Panel;
})();