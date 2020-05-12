include('/base/dbg.js');

//var _indentText = ['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;'];
var _indentText = '        ';
var _bulletinSymbols = ['►', '▪', '∙'];
var _pending = 0;
var _indent = 0;

function formatResult(value) {
    return `<pre>${_indentText.substr(0, _indent)}</pre>${_bulletinSymbols[_indent<_bulletinSymbols.length-1 ? _indent : _bulletinSymbols.length-1]} ${value}`;
}

function print(node) {
    // if (node instanceof Promise) {
    //     _pending++;
    //     var p = node;
    //     var lbl = p.lbl;
    //     Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..[result]`, `${lbl}..<span style="color:#ffff40">...pending</span>'`);
    //     p.then( value => {
    //         var text = '' ;
    //         if (Array.isArray(value) && value.length) {
    //             text += '<span style="color:#ff4040">Failed</span><br/>'
    //             text += formatResult(value, indent);
    //         } else {
    //             text += '<span style="color:#40ff40">Ok</span>';
    //         }
    //         Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..pending.`, `${lbl}..${text}`);
    //         _pending--;
    //     });
    // } else
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
        Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..[result]`, `${lbl}..<span style="color:#40ff40">Ok</span>'`);
    } else {
        Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..[result]`, `${lbl}..<span style="color:#ff4040">${errorText}</span>'`);
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

function test_context(lbl) {
    this.lbl = lbl;
    this.errors = 0;
}

var _assertion_operators = {
    "=":  { "term": "equal", "action": (a, b) => a == b },
    "!=": { "term": "not be", "action": (a, b) => a != b },
    "<":  { "term": "be less", "action": (a, b) => a < b },
    ">":  { "term": "be greater", "action": (a, b) => a > b },
    "<":  { "term": "be less or equal", "action": (a, b) => a <= b },
    ">":  { "term": "be greater or equal", "action": (a, b) => a >= b }
};

test_context.prototype.assert = function assert(value, operator, expected) {
    var op = _assertion_operators[operator];
    if (op) {
        if (!op.action(value, expected)) {
            var err = new Error();
            var tokens = err.stack.split('\n');
            error(`<b>${value}</b> should ${op.term} <b>${expected}</b>! ${tokens[2].replace(/[<>&]/g, v => ({'<':'&lt;', '>':'&gt;', '&':'&amp;'}[v]))}`);
            this.errors++;
        }
    } else throw new Error(`Unknown assertion operator '${operator}'!`);
};

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

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
            await test();
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