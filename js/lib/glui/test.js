include('glui.js');
(function() {

    var _controls = {
        "label": {
            "html": '<label id="label" value="label_value" />'
        }
    };

    var _data1 = {
        "id": "item1",
        "value": 1
    };

    function test_construct() {
        for (var type in _controls) {
            var html = _controls[type].html;
            var element = document.createElement('div');
            element.innerHTML = html;
            test(`Can construct ${type} from DOM node`, ctx => {
                var control = glui.fromNode(element.getElementsByTagName(type)[0]);
                ctx.assert(control, '!=', null);
                ctx.assert(control.id, '=', type);
                ctx.assert(control.value, '=', type+'_value');
            });

            delete element;
        }
    }

    function test_valueControls() {
        var i = 1;
        for (var type in _controls) {
            var id = `ctrl${i}`;
            var control = null;
            test(`Can construct ${type} directly`, ctx => {
                control = Reflect.construct(glui[glui.getTypeName(type)], [id, null, null]);
                ctx.assert(control, '!=', null);
                ctx.assert(control.id, '=', id);
            });

            if (!control) return;
            var link = null;
            test('Can bind data', ctx => {
                link = control.dataBind(_data1, 'value');
                ctx.assert(link, '!=', null);
                ctx.assert(control.getValue(), '=', _data1.value);
            });

            if (!link) return;
            test("Changing data source modifies control's value", ctx => {
                link.value = 2;
                ctx.assert(control.value, '=', 2);
            });
            test("Changing control's value modifies data source", ctx => {
                control.setValue(4);
                ctx.assert(_data1.value, '=', 4);
            });

            i++;
        }
    }

    var tests = () => [ test_construct, test_valueControls ];
    public(tests, 'glUi tests');
})();