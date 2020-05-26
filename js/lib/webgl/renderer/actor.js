include('repo-item.js');
// ********************************************************************************************
//
// Actor
//
// ********************************************************************************************
(function() {
    function Actor(id, data) {
        Actor.base.constructor.call(this, id);

		this.meshes = [];
		this.materials = [];
		this.bones = [];
        this.logic = [];
        
        if (data) {

        }
    }
	extend(webGL.RepoItem, Actor);

	Actor.prototype.onunload = function onunload() {
		// unload resources
    };
    
    Actor.Type = 'actor';
    webGL.Repository.registerClass(Actor.Type, Actor, ['meshes']);

    public(Actor, 'Actor', webGL);
})();
