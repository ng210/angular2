include('board.js');

(function() {
	function Menu(id, template, parent) {
        this.isSubmenu = false;
        Ui.Board.call(this, id, template, parent);
        this.effect = this.template.effect;
        this.layout = this.template.layout;
        if (!parent || parent.info.ctor != Menu) {
            //this.addClass('menu');
            this.state = Ui.Menu.States.Open;
            //this.content.addClass(`${this.effect}-in`);
        } else {
            this.state = Ui.Menu.States.Closed;
            this.content.addClass(`${this.effect}-closed`);
        }
        this.setLevel();
	};
	extend(Ui.Board, Menu);
    Ui.Control.Types['menu'] = { ctor: Menu, tag: 'MENU' };

	Menu.prototype.getTemplate = function() {
		var template = Menu.base.getTemplate.call(this);
        template.type = 'menu';
        template.layout = Ui.Container.Layout.Vertical;
        template.effect = 'xfade';
        if (!template.events.includes('click')) template.events.push('click');
        if (!template.events.includes('MenuSelect')) template.events.push('MenuSelect');
		return template;
    };

    Menu.prototype.registerHandler = function(event) {
		if (['MenuSelect', 'click'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};

    Menu.prototype.render = async function(ctx) {
        this.addClass(this.level > 0 ? 'submenu' + this.level : 'menu');
        Ui.Menu.base.render.call(this, ctx);
        if (this.isSubmenu) {
            this.titleBar.addHandler('mouseover', Ui.Menu.onopen);
            this.titleBar.addHandler('mouseout', Ui.Menu.onclosing);
            this.content.addHandler('mouseover', Ui.Menu.onopen);
            this.content.addHandler('mouseout', Ui.Menu.onclosing);
        }

        if (this.layout == Ui.Container.Layout.Submenu) {
            this.element.style['flex-direction'] = 'row';
            this.content.element.style['flex-direction'] = 'column';
        }
    };

    Menu.prototype.renderItems = async function(ctx) {
        //this.cssText = this.cssText.replace(' menu', '');
        for (var i in this.items) {
            var item = this.items[i];
            if (!(item instanceof Ui.Menu)) {
                item.addClass('menuitem');
            }
            await item.render(ctx);
        }
    };

    Menu.prototype.add = function(key, ctrl, itemBefore) {
        if (ctrl != this.titleBar && ctrl != this.content) {
            if (ctrl.info.ctor == Ui.Menu) {
                ctrl.isSubmenu = true;
            }
        }
        //console.log(this.id + '>>' + ctrl.id +' : ' + ctrl.css);
        Menu.base.add.call(this, key, ctrl, itemBefore);
    };

    Menu.prototype.addItem = function(key, value) {
        if (value == undefined) value = key;
        this.addNew(key, { type:'label', value: value });
    };
    Menu.prototype.setLevel = function() {
        var ctrl = this.parent;
        this.level = 0;
        while (ctrl != null && ctrl instanceof Ui.Menu) {
            this.level++;
            ctrl = ctrl.parent;
        }
    }

    Menu.onopen = function(e) {
        var control = e.target.control;
        if (control && control.parent && control.parent.info.ctor == Ui.Menu) {
            var menu = control.parent;
            if (!menu.disabled) {
                //console.log(['opening', control.id, control.parent.id, menu.state]);
                if (menu.titleBar == control || menu.state == Ui.Menu.States.Closing || menu.state == Ui.Menu.States.Pending/* && (menu.content == control || menu.content == control.parent)*/) {
                    //console.log(['open', control.id, control.parent.id, menu.state]);
                    //menu.content.element.removeEventListener('animationend', Menu.onclose);
                    menu.content.removeClass(`${menu.effect}-closed`);
                    menu.content.addClass(`${menu.effect}-in`, true);
                    menu.state = Ui.Menu.States.Open;
                    if (menu.isSubmenu) {
                        menu.parent.state = Ui.Menu.States.Pending;
                        menu.titleBar.addClass('open', true);
                        menu.content.addClass('open', true);
                    }
                }
            }
        }
    };

    Menu.onclosing = function(e) {
        var control = e.target.control;
        if (control && control.parent && control.parent.info.ctor == Ui.Menu) {
            var menu = control.parent;
            if (menu.state == Ui.Menu.States.Open) {
                //console.log(['closing1', control.id, control.parent.id, menu.state]);
                menu.state = Ui.Menu.States.Closing;
                setTimeout( () => {
                    //console.log(['closing2', control.id, control.parent.id, menu.state]);
                    if (menu.state == Ui.Menu.States.Closing) {
                        //console.log(['closed', control.id, control.parent.id, menu.state]);
                        menu.content.removeClass(`${menu.effect}-in`);
                        menu.content.addClass(`${menu.effect}-out`, true);
                        menu.state = Ui.Menu.States.Closed;
                        menu.titleBar.removeClass('open', true);
                        menu.content.element.addEventListener('animationend', Menu.onclose);
                    }
                }, 40);
            } else if (menu.state == Ui.Menu.States.Pending) {
                menu.content.removeClass('open', true);
            }
        }
        //return true;
    };

    Menu.onclose = function(e) {
        var control = e.target.control;
        var menu = control.parent;
        menu.content.element.removeEventListener('animationend', Menu.onclose);
        menu.content.removeClass(`${menu.effect}-out`);
        menu.content.addClass(`${menu.effect}-closed`, true);
        if (menu.level > 1 && menu.parent.state == Ui.Menu.States.Pending) {
            menu.parent.state = Ui.Menu.States.Open;
            Menu.onclosing({target:menu.element});
        }
    };

    Menu.prototype.onclick = function(e) {
        var index = 0;
        for (var key in this.items) {
            var item = this.items[key];
            if (e.target.control == item && !item.disabled) {
                var path = this.element.id.split('_');
                path.push(key);
                Menu.onclosing(e);
                this.callHandler({type:'MenuSelect', target:this}, context => path);
                break;
            }
            index++;
        }
        return true;
    };

    Menu.States = {
        Closed: 'closed',
        Opening: 'opening',
        Open: 'open',
        Closing: 'closing',
        Pending: 'pending'
    };


    Ui.Menu = Menu;
})();