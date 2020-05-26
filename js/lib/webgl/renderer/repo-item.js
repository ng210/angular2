include('webgl/webgl.js');

(function() {

    function RepoItem(id) {
        this.id = id;
        this.references = [];
    }
    //RepoItem.prototype.load = function load(id, source) { throw new Error('Not implemented!'); }
    RepoItem.prototype.unload = function unload() {
		var isUnreferenced = (--this.references == 0);
		if (isUnreferenced) {
			this.onunload();
		}
        return isUnreferenced;
    }

    RepoItem.prototype.onunload = function onunload() { throw new Error('Not implemented!'); }

    public(RepoItem, 'RepoItem', webGL);
})();