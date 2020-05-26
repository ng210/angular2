include('base/dbg.js');

//var _indentText = ['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;'];
var _indentText = '        ';
var _bulletinSymbols = ['►', '▪', '∙'];
var _pending = 0;
var _indent = 0;

function formatResult(value) {
    return `<pre>${_indentText.substr(0, _indent)}</pre>${_bulletinSymbols[_indent<_bulletinSymbols.length-1 ? _indent : _bulletinSymbols.length-1]} ${value}`;
}

function print(node) {
    if (Array.isArray(node)) {
        for (var i=0; i<node.length; i++) {
            print(node[i], indent+1);
        }
    } else {
        Dbg.pr(formatResult(node));
    }
}

function print_result(context, result) {
    var lbl = context.lbl;
    var errorText = 'Failed';
    if (result instanceof Error) {
        errorText += ' => <div class="error-details"><pre>ERROR: ' + result.stack.replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v])) + '</pre></div>';
    };
    if (context.errors == 0 && !result) {
        Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..[result]`, `${lbl}..<span style="color:#40ff40">Ok</span>`);
    } else {
        Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..[result]`, `${lbl}..<span style="color:#ff4040">${errorText}</span>`);
    }
}

function println(text) {
    print(text+'<br/>');
}

function message(text) {
    println(`<span style="color:#80a080">${text}</text>`);
}

function error(text) {
    println(`<span style="color:#ff4040">${text}</text>`);
}

function test(lbl, action) {
    _indent = 1;
    println(lbl + '..[result]');
    _indent = 2;
    var result = null;
    var context = new test_context(lbl);
    try {
        result = action(context);
    } catch (err) {
        result = err;
    }
    if (result instanceof Promise) {
        _pending++;
        result.lbl = lbl;
        result.then(
            value => { _pending--; print_result(context, value); },
            error => { _pending--; print_result(context, error); }
        );
    } else {
        print_result(context, result);
    }    
}

async function measure(lbl, action, batchSize) {
    batchSize = batchSize || 100;
    var count = 0;
    var duration = 0;
    var lastTick = 0;
    print(`<span style="color:#f0e080">Measuring ${lbl}</span>`);
    await poll( () => {
        if (duration < 1000) {
            var start = new Date().getTime();
            for (var i=0; i<batchSize; i++) action();
            duration += new Date().getTime() - start;
            count += batchSize;
            var tick = Math.floor(duration/100);
            if (tick > lastTick) {
                Dbg.pr('.');
                lastTick = tick;
            }
            return false;
        } else {
            Dbg.prln('done');
            return true;
        }
    }, 5);  
    
    println(`<span style="color:#f0e080">${count} iterations took <b>${duration}ms</b> (avg: ${(duration/count).toPrecision(4)})</span>`);
}

function test_context(lbl) {
    this.lbl = lbl;
    this.errors = 0;
}

function deepCompare(a, b) {
    var result = null;
    if (a != null && b != null) {
        if (typeof a === typeof b) {
            if (typeof a === 'object' || Array.isArray(a)) {
                for (var i in a) {
                    if (a.hasOwnProperty(i)) {
                        var bi = b[i];
                        result = deepCompare(a[i], bi);
                        if (result) {
                            result = '.' + i + result;
                            break;
                        }
                    }
                }
            } else {
                result = equals(a, b) ? null : `(${a} ! ${b})`;
            }
        }
    } else {
        result = equals(a, b) ? null : ` ${a} ! ${b}`;
    }
    return result;
}

function testDeepCompare() {
    var obj = {'a': 1, 'b':[1,2,3], 'c': { 'a': 2, 'b': 'B'}};
    var obj2 = {'c': 3, 'o': obj };
    console.log(deepCompare('a', 'b'));
    console.log(deepCompare('b', 'b'));
    console.log(deepCompare(1, 2));
    console.log(deepCompare(null, null));
    console.log(deepCompare(obj, null));
    console.log(deepCompare(obj, obj));
    console.log(deepCompare(obj, obj2));
    console.log(deepCompare(obj2, obj2));
    console.log(deepCompare(obj2.o, obj2));
    console.log(deepCompare(obj2.o, obj));
}

function equals(a, b) {
    var result = false;
    // cast b to the type of a
    switch (typeof a) {
        case 'number': result = Math.abs(a - b) <= Number.EPSILON; break;
        default: result = a == b;
    }
    return result;
}

function isEmpty(a) {
    return typeof a === 'object' && Object.keys(a).length == 0 || Array.isArray(a) && a.length == 0;
}

var _assertion_operators = {
        "=": { "term": "equal", "action": (a, b) => equals(a,b) },
       "!=": { "term": "not be", "action": (a, b) => a != b },
        "<": { "term": "be less", "action": (a, b) => a < b },
        ">": { "term": "be greater", "action": (a, b) => a > b },
        "<": { "term": "be less or equal", "action": (a, b) => a <= b },
        ">": { "term": "be greater or equal", "action": (a, b) => a >= b },
       ":=": { "term": "match", "action": (a, b) => deepCompare(a, b) },
    "empty": { "term": "be empty", "action": a => isEmpty(a) },
   "!empty": { "term": "have an element", "action": a => !isEmpty(a) }
};

test_context.prototype.assert = function assert(value, operator, expected) {
    var op = _assertion_operators[operator];
    if (op) {
        var result = op.action(value, expected);
        if (operator == ':=') {
            if (result != null) {
                var err = new Error();
                var tokens = err.stack.split('\n');
                error(`<b>${result}</b> should match! ${tokens[2].replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v]))}`);
                this.errors++;
            }
        } else if (!result) {
            var err = new Error();
            var tokens = err.stack.split('\n');
            var expectedText = expected !== undefined ? ` <b>${expected}</b>` : '';
            error(`<b>${value}</b> should ${op.term}${expectedText}! ${tokens[2].replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v]))}`);
            this.errors++;
        }
    } else throw new Error(`Unknown assertion operator '${operator}'!`);
};

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    // testDeepCompare();

    var url = new Url(location.href);
    var testUrl = new Url(`${url.fragment}/test.js`);
    Dbg.prln(`Load '${testUrl}'`);
    var module = await load(testUrl.toString());
    await load(new Url(`${url.fragment}/test.css`).toString());
    if (module && module.error == null && module.symbols != null) {
        var testName = Object.keys(module.symbols)[0];
        var test = module.symbols[testName];
        if (typeof test === 'function') {
            Dbg.prln(`<b>Running '<i>${testName}</i>'...</b>`);
            var tests = test();
            for (var i=0; i<tests.length; i++) {
                _indent = 0;
                if (typeof tests[i] === 'function') {
                    await tests[i]();
                }
            }
            poll( () => {
                if (_pending == 0) {
                    Dbg.prln('<b>Test finished</b>');
                    return true;
                }
            }, 100);            
        }
    } else {
        Dbg.prln(`Error loading ${module.error}`);
    }
}