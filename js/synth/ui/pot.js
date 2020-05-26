(function(){
    Object.defineProperty(window, 'Pot', {
        "enumerable": false,
        "configurable": false,
        "writable": false,
        "value": {
            "selectedItem": null,
            "oldOnMouseMove": null,
            "oldOnMouseUp": null,
            "dragPoint": [0, 0],
            "dragSpeed": 0.5,
        
            "onmousedown": function(e) {
                if (Pot.selectedItem != null) {
                    //Pot.selectedItem.style.border = 'none';
                    Pot.selectedItem.style.background = '#000000';
                    Pot.selectedItem.style.color = Pot.selectedItem.color;
                }
                Pot.selectedItem = e.target;
                Pot.dragPoint[0] = e.screenX;
                Pot.dragPoint[1] = e.screenY;
                //Pot.selectedItem.style.border = 'solid 1px #4060a0';
                Pot.selectedItem.style.background = '#803010';
                Pot.selectedItem.color = Pot.selectedItem.style.color;
                Pot.selectedItem.style.color = '#ffc0a0';
                Pot.oldOnMouseMove = document.onmousemove;
                Pot.oldOnMouseUp = document.onmouseup;
                document.onmousemove = Pot.onmousemove;
                document.onmouseup = Pot.onmouseup;
                e.preventDefault();
            },
            "onmouseup": function(e) {
                document.onmousemove = Pot.oldOnMouseMove;
                document.onmouseup = Pot.oldOnMouseUp;
                e.preventDefault();
            },
            "onmousemove": function(e) {
                //var deltaX = e.screenX - Pot.dragPoint[0];
                var deltaY = e.screenY - Pot.dragPoint[1];
                var sgn = deltaY < 0 ? 1 : -1;
                //Pot.dragPoint[0] = e.screenX;
                Pot.dragPoint[1] = e.screenY;
                var item = Pot.selectedItem;
                var delta = Pot.dragSpeed/item.scale * sgn * deltaY*deltaY;
                var value = item.pot.set(item.pot.value + delta);
                value = Math.floor(value * item.scale);
                item.innerHTML = !item.digits ? value : (item.digits + value).slice(-item.digits.length);
                if (typeof item.onchange === 'function') {
                    item.onchange.call(item);
                }
            },
            "update": function(el) {
                var pot = el.pot;
                var value = pot.value;
                value = Math.floor(value * el.scale);
                el.innerHTML = !el.digits ? value : (el.digits + value).slice(-el.digits.length);
            },
            "bind": function(el, parent) {
                // el.onmouseover = Pot.onmouseover;
                // el.onmouseout = Pot.onmouseout;
                // el.onclick = Pot.onclick;
                el.onmousedown = Pot.onmousedown;
                el.onmouseup = Pot.onmouseup;
            
                var min = parseFloat(el.getAttribute('min')) || 0;
                var max = parseFloat(el.getAttribute('max')) || 1;
                var value = parseFloat(el.getAttribute('value'));
                el.digits = el.getAttribute('digits');
                var ctrlId = el.getAttribute('bind');
                el.scale = parseFloat(el.getAttribute('scale')) || 100;
                var pot = parent instanceof psynth.Synth ? parent.getControl(psynth.Ctrl[ctrlId]) : parent;
                if (pot != null) {
                    el.pot = pot;
                    pot.element = el;
                    pot.min = min;
                    pot.max = max;
                    if (isNaN(value)) {
                        value = pot.value;
                    } else {
                        value = pot.set(value);
                    }
                    value = Math.floor(value * el.scale);
                    el.innerHTML = !el.digits ? value : (el.digits + value).slice(-el.digits.length);
                } else {
                    console.log('Unknown control "' + ctrlId + '"');
                }                
            },

        }
    });
    //public(Pot, 'Pot');
})();