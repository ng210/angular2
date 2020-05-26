include('repo-item.js');
// ********************************************************************************************
//
// Mesh
//
// ********************************************************************************************
(function() {
	function Mesh(id, data) {
		Mesh.base.constructor.call(this, id);
		this.LOD = 0;				// level of detail

		this.VBO = null;			// reference to a (shared) vertex buffer
		this.IBO = null;			// dedicated index buffer

		this.material = null;

		this.attributes = {};
		this.uniforms = {};
	}
	Object.defineProperty(Mesh, 'type', { get: function() { return this.material.type; } });
	extend(webGL.RepoItem, Mesh);

	Mesh.prototype.onunload = function onunload() {
		// unload resources
	};
	
	Mesh.Type = 'mesh';

    webGL.Repository.registerClass(Mesh.Type, Mesh, ['material']);

    public(Mesh, 'Mesh', webGL);
})();
