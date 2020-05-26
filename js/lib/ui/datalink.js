(function() {
    // 1. datalink transparent: accessing datalink.field is equal to accessing datalink.obj.field
    // 2. subscribe for changes: datalink.field changed triggers handlers
    // 3. way for direct write access without triggering handlers => synchronization
    //      A subscribes on B, B subscribes on A => values of A and B are kept synchronized
    //      Changing A triggers handler of B that changes B, this must not trigger the handler of A or it gets into an infinite loop

    function DataLink(obj) {
        this.obj = obj;
        Object.defineProperties(this, {
            'obj': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: obj
            },
            'triggers': {
                enumerable: false,
                configurable: false,
                writable: false,
                value: {}
            }
        });
    }
    DataLink.prototype.add = function add(field, handler, target, field2) {
        if (this.obj[field] != undefined) {
            if (!Object.keys(this).includes(field)) {
                Object.defineProperty(this, field, {
                    enumerable: true,
                    configurable: false,
                    get: function () {
                        return this.obj[field];
                    },
                    set: function (value) {
                        var oldValue = this.obj[field];
                        this.obj[field] = value;
                        var triggers = this.triggers[field];
                        for (var i=0; i<triggers.length; i++) {
                            var returns = triggers[i].fn.call(triggers[i].obj, value, oldValue, field);
                            var link = triggers[i].link;
                            if (returns != undefined && link) {
                                if (link.target instanceof DataLink) {
                                    link.target.obj[link.field] = returns;
                                } else {
                                    link.target[link.field] = returns;    
                                }
                            }
                        }
                    }
                });
                this.triggers[field] = [];
            };

            if (typeof handler === 'function') {
                var link = target && field2 ? {'target':target, 'field':field2} : null;
                var trigger = { 'fn':handler, 'link': link };
                this.triggers[field].push(trigger);
            }
        }
    };

    DataLink.prototype.link = function link(srcField, dst, dstField, srcToDst, dstToSrc) {
        this.add(srcField, srcToDst || DataLink.defaultHandler, dst, dstField);
        dst.add(dstField, dstToSrc || DataLink.defaultHandler, this, srcField);
    };
    DataLink.defaultHandler = v => v;

    var Ui = window.Ui || { DataLink: DataLink};
    public(Ui, 'Ui');
})();