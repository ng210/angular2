/******************************************************************************
 * Adapter interface prototype
 *  - should be singleton object
 ******************************************************************************/
include('/ge/player/player.js');
(function() {
    Player = Player || {};
    Player.IAdapter = {
        getInfo: function() { throw new Error('Not implemented!'); },
        registerCommands: function(registry) { throw new Error('Not implemented!'); },
        prepareContext: function(data) { throw new Error('Not implemented!'); },
        createTargets: function(targets, data) { throw new Error('Not implemented!'); },
        processCommand: function(target, command, sequence, cursor) { throw new Error('Not implemented!'); },
        updateRefreshRate: function(target, command) { throw new Error('Not implemented!'); },

        // EDITOR
        getCommandSize: function(command, args) { throw new Error('Not implemented!'); },
        makeCommand: function(command, args) { throw new Error('Not implemented!'); }
    };
})();