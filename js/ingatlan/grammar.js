var grammar = {
    'prototypes': {
        // separator
        ' ': { 'symbol': '' },
        // operator
        '+': { 'symbol': 'A', 'action': (x, y) => x + y },
        '*': { 'symbol': 'M', 'action': (x, y) => x * y },
        '~': { 'symbol': 'S', 'action': (x, y) => x.toString().indexOf(y) != -1 },
        // functions
        'sin':  { 'symbol': 'F', 'action': x => Math.sin(x) },
        'cos':  { 'symbol': 'F', 'action': x => Math.cos(x) },
        'prop': { 'symbol': 'F', 'action': function(name) { return this[name]; } },
        // misc.
        '(': { 'symbol': 'B1' },
        ')': { 'symbol': 'B2' },
        ',': { 'symbol': 'C' },
        //states
        '__A1': { 'symbol': 'A1' },
        '__M1': { 'symbol': 'M1' },
        '__S1': { 'symbol': 'S1' },
        '__F1': { 'symbol': 'F1' },
        '__F2': { 'symbol': 'F2' }
    },
    'rules': [
        { input:'LM',   output:'M1', priority: 44,  action: null },
        { input:'M1L',  output:'L',  priority: 40,  action: null },
        { input:'LA',   output:'A1', priority: 34,  action: null },
        { input:'A1L',  output:'L',  priority: 30,  action: null },
        { input:'LS',   output:'S1', priority: 24,  action: null },
        { input:'S1L',  output:'L',  priority: 20,  action: null },
        { input:'FB1',  output:'F1', priority: 18,  action: null },
        { input:'F1L',  output:'F2', priority: 16,  action: null },
        { input:'F2C',  output:'F1', priority: 14,  action: null },
        { input:'F2B2', output:'L',  priority: 12,  action: null },
        { input:'L',    output:null, priority: 1,   action: null }
    ],
};