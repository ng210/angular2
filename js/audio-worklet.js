var pitch = 0;
var smpRate = 0;
var theta = 0;
var acc = 0;
var vibrato = 110;
var vibratoAcc = 0;
var threshold = 0.01;
var delta = 0;
var phase = 0;
var amp = 1.0;
var ampFactor = 1.0;

var synth = null;


class AudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.port.onmessage = msg => {
            switch (msg.data.code) {
                case 'init':
                    theta = 2*Math.PI/sampleRate;
                    // delta = 0.4/sampleRate;
                    // ampFactor = 4/sampleRate;
                    console.log(`Init: samplint rate = ${sampleRate}, theta = ${theta}`);
                    break;
                case 'setControl':
                    synth.getControl(msg.data.id).value = msg.data.value;
                    break;
                case 'setNote':
                    synth.setNote(msg.data.note, msg.data.velocity);
                    break;
            }
            
        }
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        var channel = output[0];
        synth.run(output[0], output[1], channel.length);

        // for (var i=0; i<channel.length; i++) {
        //     synth.run(output, 0, channel.length);
        //     if (phase == 0) {
        //         if (threshold < 1) threshold += delta;
        //         else phase = 1;
        //     } else {
        //         if (threshold > 0) threshold -= delta;
        //         else phase = 0;
        //     }
        //     var smp = Math.sin(theta * acc) + Math.sin(theta*vibratoAcc);
        //     smp = smp < threshold ? (smp > -threshold ? smp : -threshold) : threshold;
        //     channel[i] = amp*smp/threshold;
        //     if ((acc += pitch) > smpRate) acc -= smpRate;
        //     if ((vibratoAcc += 3.01*pitch) > smpRate) vibratoAcc -= smpRate;
        //     if ((amp -= ampFactor) < 0) amp = 0;
        // }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);


// self.onmessage = function (msg) {
//     console.log(msg.data.code);
//     switch (msg.data.code) {
//         case 'init':
//             sound.init(msg.data.smpRate);
//             theta = 2*Math.PI/msg.data.smpRate;
// console.log('smpRate = ' + msg.data.smpRate);
//             break;
//         case 'set':
//             _pitch = msg.data.pitch;
//             break;
//         default:
//             throw 'Invalid message: ' + msg.data.code;
//     }
// }

// function fillBuffer(left, right, count) {
//     for (var i=0; i<count; i++) {
//         var smp = Math.sin(pitch*(theta + acc));
//         left[i] = right[i] = smp;
//         if (acc++ > smpRate) acc -= smpRateSuche;
//     }
// }


// var sound = {
//     status: 0,
//     context: null,
//     audioNode: null,
//     smpRate: 0,

//     init: function(smpRate, callback) {
//         this.smpRate = smpRate || 48000;
//         this.context = AudioContext ? new AudioContext() :
//             webkitAudioContext ? new webkitAudioContext() :
//             mozAudioContext ? new mozAudioContext() :
//             oAudioContext ? new oAudioContext() :
//             msAudioContext ? new msAudioContext() :
//             undefined;
// console.log(this.context);
//         if (!this.context) throw new Error('Could not create sound context!');
//         this.audioNode = this.context.createScriptProcessor(this.BUFFER_SIZE, 0, 2);
//         this.audioNode.onaudioprocess = function(audioProcessingEvent) {
//             var outputBuffer = audioProcessingEvent.outputBuffer;
//             var left = outputBuffer.getChannelData(0);
//             var right = outputBuffer.getChannelData(1);
//             fillBuffer(left, right, outputBuffer.length, 0);
//         };
//         //this.fillBuffer = callback || function(buffer, count) {};
//         this.audioNode.connect(this.context.destination);
//         this.context.suspend();
//     },

//     start: function() {
//         this.context.resume();
//     },
//     stop: function() {
//         this.context.suspend();
//     }
// };