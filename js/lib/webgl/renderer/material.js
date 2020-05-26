include('repo-item.js');
include('pass.js');
// ********************************************************************************************
//
// Material
//
// ********************************************************************************************
(function() {
	function Material(id, data) {
		Material.base.constructor.call(this, id);
		// queryable attributes
		this.type = webGL.Pass.Types.Opaque;

		this.program = null;
		this.textures = [];
		this.parameters = {};
	}
	extend(webGL.RepoItem, Material);

	Material.prototype.onunload = function onunload() {
		// unload resources
	};

	Material.prototype.addProgram = function addProgram(shaders) {
		// compile shaders
		// and set program
	}

	Material.Type = 'material';

    webGL.Repository.registerClass(Material.Type, Material, ['type']);

    public(Material, 'Material', webGL);
})();
