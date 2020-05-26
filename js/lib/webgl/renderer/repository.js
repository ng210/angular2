include('webgl/webgl.js');
// ********************************************************************************************
// 	Repository
// 	{
// 		"actor": {
// 			"actor1": {...},
// 			"actor2": {...}
// 		},
// 		"mesh": {
// 			"actor1-mesh1": {...},
// 			"actor1-mesh2": {...},
// 			"actor2-mesh1": {...}
// 		},
// 		"material": {
// 			"actor1-material1": {...},
// 			"actor1-material2": {...},
// 		},
// 		"processing": {
// 			"blur": {...}
// 		}
// 	}
// ********************************************************************************************
(function() {
    function Repository() {
        this.actor = {};
        this.mesh = {};
        this.material = {};
        this.processing = {};
    }

    /**************************************************************************
     * Repository of resources
     * - partitioned by resource classes (Material, Mesh, Actor, ...)
     * - stores constructor of the class to create new instances
     * - stores indices of a class used to accelerate queries
     * - the indices array in the type definition contains those attribute names
     *   of the resource class that require indexing
     * - thus, indices is an object with attribute names as keys
     * - an index is a map between attribute value and list of resources
     * Example
     *  mat1['shader'] = 'wood', mat11['shader'] = 'wood'
     *  Repository.Types['Material'].indices['shader']['wood'] returns ['Mat1', 'Mat11'];

     **************************************************************************/
    Repository.registerClass = function registerClass(type, ctor, indices) {
        if (type == undefined || typeof ctor !== 'function') throw new Error(`Type and constructor must be valid!`);
        if (Repository.Types[type]) throw new Error(`Type '${type} already registered!`);
        Repository.Types[type] = { type: type, ctor: ctor, indices: {} };
        for (var i=0; i<indices.length; i++) {
            Repository.Types[type].indices[indices[i]] = {};
        }
    }

    Repository.prototype.updateIndices = function updateIndices(type, res) {
        var indices = Repository.Types[type].indices;
        var keys = Object.keys(indices);
        for (var i=0; i<keys.length; i++) {
            if (indices[keys[i]][res[i]] == undefined) {
                indices[keys[i]][res[i]] = [];
            }
            indices[keys[i]][res[i]].push(res);
        }
    };

    Repository.prototype.addResource = async function addResource(type, id, source) {
        var typeInfo = Repository.Types[type];
        if (typeInfo == undefined) throw new Error(`Resource type '${type}' is not supported!`);
        var data = source;
        if (typeof source === 'string') {
            var resource = await load(source);
            if (resource.error) {
                throw new Error(`Could not load '${source}'!`);
            }
            data = resource.data;
        }

        var res = Reflect.construct(typeInfo.ctor, [id, data]);
        this[type][id] = res;

        this.updateIndices(type, res);

        return res;
    };

    Repository.prototype.queryResources = function queryResources(attributes, values) {
        for (var i=0; i<attributes.length; i++) {

        }
    };

    Repository.prototype.selectResources = function selectResources(type, ids) {
        var typeInfo = Repository.Types[type];
        if (typeInfo == undefined) throw new Error(`Resource type '${type}' is not supported!`);
        var set = [];
        for (var i=0; i<this.ids.length; i++) {
            set.push(type[ids[i]]);
        }
        return set;
    };

    Repository.Types = { };


    public(Repository, 'Repository', webGL);
})();