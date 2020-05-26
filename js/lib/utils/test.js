include('syntax.js');
(function(){

    var grammar = {
        'prototypes': {
            // separator
            ' ': { 'symbol': '' },
            // operator
            '+':    { 'symbol': 'A', 'action': function(x, y) { return x.data.value + y.data.value; } },
            '*':    { 'symbol': 'M', 'action': (x, y) => x.data.value * y.data.value },
            'pow':  { 'symbol': 'F', 'action': (a, p) => Math.pow(a.data.value, p.data.value) },
            'sqrt': { 'symbol': 'F', 'action': (x) => Math.sqrt(x.data.value) },
            'get':  { 'symbol': 'F', 'action': function(name) { return this[name.data.value]; } },
            // syntax elements
            '(':    { 'symbol': 'B1' },
            ')':    { 'symbol': 'B2' },
            ',':    { 'symbol': 'C' },
            //states
            '__A1': { 'symbol': 'A1' },
            '__A2': { 'symbol': 'A2' },
            '__M1': { 'symbol': 'M1' },
            '__M2': { 'symbol': 'M2' },
            '__F1': { 'symbol': 'F1' },
            '__F2': { 'symbol': 'F2' }
        },
        'rules': [
            { input:'FB1',  output:'F1', priority: 100,  action: null },
            { input:'B1LB2',output:'L',  priority:  90,  action: (b1,l,b2) => l },
            { input:'M1L',  output:'L',  priority:  80,  action: null },
            { input:'LM',   output:'M1', priority:  70,  action: null },
            { input:'A1L',  output:'L',  priority:  60,  action: null },
            { input:'LA',   output:'A1', priority:  50,  action: null },
            { input:'F1L',  output:'F2', priority:  46,  action: null },
            { input:'F2C',  output:'F1', priority:  30,  action: null },
            { input:'F2B2', output:'L',  priority:  20,  action: null },
            { input:'L',    output:null, priority:  10,   action: null }
        ],
    };

    function test_syntax() {
        var results = [
            'Test syntax'
        ];
        var tests = {
            '6': '1+2+3',
            '7': '1+2*3',
            '5': '1*2+3',
            '6': '1*2*3',
           '11': '1+2*3+4',
           '14': '1*2+3*4',
           '10': '1*2*3+4',
           '25': '1+2*3*4',
           '9': '(1+2)*3',
           '65': '((1+2)*3+4)*5',
           '20': 'pow(2,4)+sqrt((4+4)*2)',
           '60': '2*pow(4,2)+sqrt(pow(5,4))+3',
           '30': '2*get(id)+get(key)+1'
        };
        var syntax = new Syntax(grammar, true);
        var obj = {
            'id': 12,
            'key': 5
        };
        for (var r in tests) {
            var expr = syntax.parse(tests[r]);
            var result = expr.resolve().evaluate(obj);
            test(`Should evaluate to ${r}`, context => context.assert(r, '=', result));
        }

        return results;

    }

    var tests = async function() {
        return [
            test_syntax()
        ];
    };

    public(tests, 'Util tests');
})();