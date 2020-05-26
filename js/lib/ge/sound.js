/*******************************************************************************
 * Streamed sound playback
 ******************************************************************************/
(function(){
    var sound = {
        status: 0,
        context: null,
        audioNode: null,
        smpRate: 0,

        init: function(smpRate, callback) {
            this.smpRate = smpRate || 48000;
            this.context = window.AudioContext ? new window.AudioContext() :
                window.webkitAudioContext ? new window.webkitAudioContext() :
                window.mozAudioContext ? new window.mozAudioContext() :
                window.oAudioContext ? new window.oAudioContext() :
                window.msAudioContext ? new window.msAudioContext() :
                undefined;
            if (!this.context) throw new Error('Could not create sound context!');
            this.audioNode = this.context.createScriptProcessor(this.BUFFER_SIZE, 0, 2);
            this.audioNode.onaudioprocess = function(audioProcessingEvent) {
                var outputBuffer = audioProcessingEvent.outputBuffer;
                var left = outputBuffer.getChannelData(0);
                var right = outputBuffer.getChannelData(1);
                sound.fillBuffer(left, right, outputBuffer.length, 0);
            };
            this.fillBuffer = callback || function(buffer, count) {};
            this.audioNode.connect(this.context.destination);
            this.context.suspend();
        },

        start: function() {
            this.context.resume();
        },
        stop: function() {
            this.context.suspend();
        }
    };
    public(sound, 'sound');
})();