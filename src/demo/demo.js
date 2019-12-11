include('ui/datalink.js')
include('/ui/label.js');
include('/ui/textbox.js');
include('/ui/slider.js');
include('/ui/ddlist.js');
include('/ui/checkbox.js');
include('/ui/button.js');
include('/ui/board.js');
include('/ui/grid.js');

(function() {
    function Demo(id, canvas) {
        this.id = id;
        this.selectedControl = null;
        this.canvas = canvas;
        this.ui = new Ui.Board(id+'_ui', { titlebar:id+' settings', type:'board' }); //   { parent: null, id:id+'_ui', controls:{} };
        // create alias for items in the ui
        this.ui.controls = this.ui.items;
        this.config = null;
        this.template = null;
        this.settings = null;

        this.constructor = Demo;
    }
    Demo.prototype.prepare = function() { throw new Error('Not implemented'); };
    Demo.prototype.initialize = function() { throw new Error('Not implemented'); };
    Demo.prototype.processInputs = function() { throw new Error('Not implemented'); };
    Demo.prototype.onchange = function(setting) { throw new Error('Not implemented'); };
    Demo.prototype.update = function(frame, dt) { throw new Error('Not implemented'); };
    Demo.prototype.render = function(frame, dt) { throw new Error('Not implemented'); };
    Demo.prototype.onresize = function(e) { ; };
    Demo.prototype.onfocus = function(ctrl) {
        // save border settings
        ctrl.backgroundColor = ctrl.element.style.backgroundColor;
        ctrl.element.style.backgroundColor = 'lightblue';
    };
    Demo.prototype.onblur = function(ctrl) {
        // restore border settings
        ctrl.element.style.backgroundColor = ctrl.backgroundColor;
    };
    Demo.prototype.createUi = function() {
        this.ui.parent = this;
        Dbg.prln('Create UI for ' + this.id);
        // add controls from template
        for (var key in this.template) {
            var template = this.template[key];
            var control = this.ui.addNew(template, key);
            if (typeof template.label !== 'string') {
                control.label = key;
            }
            // var field = template['data-field'] || key;
            // control.dataBind(this.settings, field);
            // this.data.add(control);
        }
        this.ui.dataBind(this.settings);
        this.data = this.ui.dataSource;
    };
    Demo.prototype.renderUi = function(node) {
        while (node.children.length > 0) {
            node.removeChild(node.children[0]);
        }
        this.ui.render({'element':node});
    };
    Demo.load = async function(name, url) {
        var demo = null;
        var path = name + '/' + name;
        if (url) {
            path = url + '/' + path;
        }
        // load demo files
        var files = [
            { url: path + '.json', contentType: 'text/json' },
            { url: path + '.js', contentType: 'text/javascript' },
            { url: path + '.css', contentType: 'text/css' }
        ];
        // load and check files
        var resources = await load(files);
        if (resources[2].error instanceof Error) {
            // .css is not mandatory
            resources.pop();
        }
        var missing = [];
        for (var i=0; i<resources.length; i++) {
            if (resources[i].error instanceof Error) {
                missing.push(resources[i].url);
            }
        }
        if (missing.length > 0) {
            Dbg.prln('Error loading demo! Missing file(s): (' + missing + ')');
            return null;
        }

        // get the first exported symbol from the demo's URL
        //var url = new Url(res[1].url);
        var mdl = resources[1];
        if (!mdl || mdl.symbols.length == 0) {
            Dbg.prln('Demo script is invalid!');
            return null;
        }
        var DemoClass = Object.values(mdl.symbols)[0];
        demo = new DemoClass(canvas_);
        // a valid demo JSON contains a template and a settings
        demo.config = resources[0].data;
        demo.template = demo.config.template;
        demo.settings = demo.config.settings;
        if (!demo.settings || !demo.template) {
            Dbg.prln('Demo definition is invalid!');
            return null;
        }
        return demo;
    };

    Boot.addToSearchPath();
    public(Demo, 'Demo');

})();