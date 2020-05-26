include('webgl/webgl.js');
// ********************************************************************************************
//
// Scene
//
// ********************************************************************************************
(function() {
    function Scene() {
		this.passes = [];
		this.actors = [];
		this.views = [];

		this.meshes = [];
		this.materials = [];

		this.postProcesses = [];
		this.renderTargets = [];

		this.cache = {};
	}

	Scene.prototype.prepare = async function prepare(repository, actorIds, postProcessingIds) {
		// get actors
		for (var i=0; i<this.actorIds.length; i++) {
			this.actors.push(repository.actors[actorIds[i]]);
		}
		for (var i=0; i<this.actorIds.length; i++) {
			this.actors.push(repository.actors[actorIds[i]]);
		}
		// get post processings
		// create render targets
	};

	Scene.prototype.addPass = function addPass(type, selectors, target) {
		if (!this.passes[type]) {
			this.passes[type] = new Pass(type, selectors, target);
		}
	};
	Scene.prototype.addActor = function addActor() {

	};
	Scene.prototype.addView = function addView() {

    };
    
    public(Scene, 'Scene', webGL);
})();