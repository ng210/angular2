var _tones = [ 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H', 'C', 'C#', 'D', 'D#' ];
var _toneRe = /(\w#?)(\d)/;

function writeNoteCommand(sequence, command, velocity) {
    var match = command.edges[0].to.data.value.match(_toneRe);
    if (match.length == 3) {
        sequence.writeCommand(psynth.SynthAdapter.SETNOTE);
        var tone = _tones.indexOf(match[1]);
        if (tone == -1) {
            Dbg.prln(`Invalid note '${match[1]}'`);
        } else {
            sequence.writeUint8(tone + 12*parseInt(match[2]));
            sequence.writeUint8(velocity);
        }
    } else {
        Dbg.prln(`Invalid command (${command.edges.map(e => e.to.data.term)})`);
    }
}

var _grammar = {
    'prototypes': {
        // separator
        ' ': { 'symbol': '' },
        // operator
        'frame':  { 'symbol': 'F', 'action': function(delta) {
            if (this.cursor == 0) {
                this.writeHeader();
            }
            this.writeDelta(delta.data.value);
            var hasEnd = false;
            for (var i=1; i<arguments.length; i++) {
                var command = arguments[i];
                switch (command.data.term) {
                    case 'on':
                        writeNoteCommand(this, command, command.edges[1].to.data.value);
                        break;
                    case 'off':
                        writeNoteCommand(this, command, 0);
                        break;
                    case 'end':
                        hasEnd = true;
                        this.writeEOS();
                        break;
                }
            }
            if (!hasEnd) {
                this.writeEOF();
            }
            return hasEnd;
        } },
        'on': { 'symbol': 'C', 'action': null },
        'off':  { 'symbol': 'C', 'action': null },
        'end': { 'symbol': 'E', 'action': null },
        // syntax elements
        '(':     { 'symbol': 'B1' },
        ')':     { 'symbol': 'B2' },
        ',':     { 'symbol': 'S' },
        //states
        '__C1': { 'symbol': 'C1' },
        '__C2': { 'symbol': 'C2' },
        '__C3': { 'symbol': 'C3' },
        '__F1': { 'symbol': 'F1' },
        '__F2': { 'symbol': 'F2' },
        '__F3': { 'symbol': 'F3' },
        '__F4': { 'symbol': 'F4' },
        '__F5': { 'symbol': 'F5' }
    },
    'rules': [
        { input:'CB1', output:'C1', priority: 50,  action: null },
        { input:'C1L', output:'C2', priority: 45,  action: null },
        { input:'C2S', output:'C1', priority: 40,  action: null },
        { input:'C2B2', output:'C3', priority: 30,  action: null },
        { input:'FB1', output:'F1', priority: 20,  action: null },
        { input:'F1L', output:'F2', priority: 18,  action: null },
        { input:'F2S', output:'F3', priority: 16,  action: null },
        { input:'F3E', output:'F4', priority: 47,  action: null },
        { input:'F3C3', output:'F4', priority: 14,  action: null },
        { input:'F4S', output:'F3', priority: 12,  action: null },
        { input:'F4B2', output:'F5', priority: 10,  action: null },
        { input:'F5', output:null, priority: 1,  action: null }
    ],
};