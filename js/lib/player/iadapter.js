/******************************************************************************
 * Adapter interface prototype
 *  - should be singleton object
 ******************************************************************************/
include('data/stream.js');
(function() {
    var Ps = window.Ps || {};
    function IAdapter() {
        this.devices = [];
    }
    IAdapter.prototype.getInfo = function() { throw new Error('Not implemented!'); };
    IAdapter.prototype.registerCommands = function(registry) { throw new Error('Not implemented!'); };
    IAdapter.prototype.prepareContext = function(data) {
        if (data) {
            var cursor = 0;
            var deviceCount = data.readUint8(cursor++);
            for (var i=0; i<deviceCount; i++) {
                this.createDevice(data.readUint8(cursor++));
            }
        }
    };
    IAdapter.prototype.createDevice = function(deviceId, initData) { throw new Error('Not implemented!'); };
    IAdapter.prototype.processCommand = function(device, command, sequence, cursor) { throw new Error('Not implemented!'); };
    IAdapter.prototype.updateRefreshRate = function(fps) {
        for (var i=0; i<this.devices.length; i++) {
            this.devices[i].updateRefreshRate(fps)
        }
    };

    public(Ps, 'Ps');
    public(IAdapter, 'IAdapter', Ps);
})();