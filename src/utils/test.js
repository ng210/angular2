include('/utils/syntax.js');
(function(){

    var grammar = {
        'prototypes': {
            // separator
            ' ': { 'symbol': '' },
            // operator
            '+':    { 'symbol': 'A', 'action': (x, y) => x + y },
            '*':    { 'symbol': 'M', 'action': (x, y) => x * y },
            'pow':  { 'symbol': 'F', 'action': (a, p) => Math.pow(a, p) },
            'sqrt': { 'symbol': 'F', 'action': (x) => Math.sqrt(x) },
            'get':  { 'symbol': 'F', 'action': function(name) { return this[name]; } },
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
            { input:'LM',   output:'M1', priority: 50,  action: null },
            { input:'M1L',  output:'L',  priority: 40,  action: null },
            { input:'LA',   output:'A1', priority: 25,  action: null },
            { input:'A1L',  output:'L',  priority: 30,  action: null },
            { input:'FB1',  output:'F1', priority: 28,  action: null },
            { input:'F1L',  output:'F2', priority: 26,  action: null },
            { input:'F2C',  output:'F1', priority: 24,  action: null },
            { input:'F2B2', output:'L',  priority: 22,  action: null },
            { input:'B1LB2',output:'L',  priority: 10,  action: (b1,l,b2) => l },
            { input:'L',    output:null, priority: 1,   action: null }
        ],
    };

    function test_syntax() {
        Dbg.prln('Test syntax');
        var errors = [];
        var tests = {
        //     '6': '1+2+3',
        //     '7': '1+2*3',
        //     '5': '1*2+3',
        //     '6': '1*2*3',
        //    '11': '1+2*3+4',
        //    '14': '1*2+3*4',
        //    '10': '1*2*3+4',
        //    '25': '1+2*3*4',
        //    '9': '(1+2)*3',
           '65': '((1+2)*3+4)*5'
        //    '20': 'pow(2,4)+sqrt((4+4)*2)',
        //    '60': '2*pow(4,2)+sqrt(pow(5,4))+3',
        //    '30': '2*get(id)+get(key)+1'
        };
        var syntax = new Syntax(grammar);
        var obj = {
            'id': 12,
            'key': 5
        };
        for (var r in tests) {
            var expr = syntax.parse(tests[r]);
            var result = expr.resolve().evaluate(obj);
            Dbg.prln(`${tests[r]} returns ${result} and should be ${r}`);
            if (result != parseInt(r)) {
                errors.push(`${tests[r]} is not ${r}`);
            }
        }
        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

var tests = async function() {
    Dbg.prln(test_syntax());
    return 0;
};
public(tests, 'Util tests');
})();