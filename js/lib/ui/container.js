include('control.js');

// Abstract base type for container controls
(function() {
    function Container(id, template, parent) {
        Ui.Control.call(this, id, template, parent);
        this.content = new Ui.Control(`${this.id}_content`, { css:'content' }, this);
        this.titleBarText = null;
        if (this.template.titlebar != undefined && this.template.titlebar !== false && this.template.titlebar != '') {
            this.titleBarText = this.template.titlebar === true ? this.id : this.template.titlebar;
        }
        this.titleBar = null;
        this.layout = this.template.layout;
		this.itemOrder = [];
		this.items = {};
        if (this.template.items) {
            for (var key in this.template.items) {
				if (this.template.items.hasOwnProperty(key)) {
					var itemId = this.template.items[key].id || key;
					this.addNew(itemId, this.template.items[key]);
				}
            }
        }
		this.rebuild = true;
    }
    extend(Ui.Control, Container);

	Container.prototype.getTemplate = function() {
        var template = Container.base.getTemplate.call(this);
        template.fixed = false;
        template.titlebar = this.id;
        template.items = {};
        template.layout = Ui.Container.Layout.Horizontal;
        return template;
	};
	Container.prototype.registerHandler = function(event) {
        if (['click', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Container.prototype.render = async function(ctx) {
        // remove elements
		if (this.element) {
			while (this.element.children.length > 0) {
				this.element.removeChild(this.element.children[0]);
			}
		}
		Container.base.render.call(this, ctx);
        // eventually create titlebar
        if (this.titleBar == null && this.titleBarText) {
            this.titleBar = new Ui.Label(this.id + '_title', {css:'titlebar', events:['click']}, this);
        }
        if (this.titleBar != null) {
            this.titleBar.value = this.titleBarText;
            this.titleBar.render({element:this.element});
        }
        var layout = this.layout == Ui.Container.Layout.Vertical ? 'column' : 'row';
        this.element.style.display = 'flex';
        this.element.style['flex-direction'] = 'column';    //layout;
        // create content element
        this.content.render({element:this.element});
        if (this.layout != Ui.Container.Layout.Free) {
            this.content.element.style.display = 'flex';
            this.content.element.style['flex-direction'] = layout;
        } else {
            this.content.element.style.display = 'block';
        }
        //this.content.element.style.height = '100%';

        while (this.content.element.children.length > 0) {
            this.content.element.removeChild(this.content.element.children[0]);
        }
        this.renderItems({element:this.content.element});
    };
    Container.prototype.renderItems = async function(ctx) {
        for (var i in this.items) {
            this.items[i].render(ctx);
        }
    };
	Container.prototype.add = function(key, ctrl, itemBefore) {
		var ix = -1;
		if (itemBefore) {
			ix = this.itemOrder.findIndex(x => this.items[x] == itemBefore) + 1;
		}
		ctrl.addClass(key);
		if (ix > 0 && ix < this.itemOrder.length) {
			this.itemOrder.splice(ix, 0, key);
		} else {
			this.itemOrder.push(key);
		}
		this.items[key] = ctrl;
		ctrl.parent = this;
		return ctrl;
	};
	Container.prototype.addNew = function(key, template, itemBefore) {
		var ctrl = Ui.Control.create(`${this.id}_${key}`, template, this);
		this.add(key, ctrl, itemBefore);
		return ctrl;
    };
    Container.prototype.remove = function(key) {
        var ix = this.itemOrder.findIndex(x => x == key);
        if (ix != -1) {
            this.itemOrder.splice(ix, 1);
            delete this.items[key];
        }
    };
	Container.prototype.item = function(ix) {
		return this.items[this.itemOrder[ix]];
    };
    Container.prototype.count = function() {
        return this.itemOrder.length;
    }


    // 1. vertical
    //      title
    //      item1
    //      item2
    // 2. horizontal
    //      title item1 item2
    // 3. submenu
    //      title > item1
    //              item2
    Container.Layout = {
        Vertical: 'vertical',
        Horizontal: 'horizontal',
        Submenu: 'submenu',
        Free: 'free'
    };

    Ui.Container = Container;

})();