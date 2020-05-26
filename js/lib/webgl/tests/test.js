include('webgl/renderer/renderer.js');

(function() {

    var _repository = null;


    function test_registered_classes() {
        test('Should have registered classes', context => {
    //debugger
            context.assert(webGL.Actor.Type, '!=', undefined);
            context.assert(webGL.Mesh.Type, '!=', undefined);
            context.assert(webGL.Material.Type, '!=', undefined);
        });
    }

    function test_repository() {
        _repository = new webGL.Repository();

        test("Should have an index on 'type' for material", async function(context) {
            // load material to trigger index update
            await _repository.addResource('material', 'flat', '/lib/webgl/tests/res/flat.mat');
            context.assert(Object.keys(webGL.Repository.Types[webGL.Material.Type].indices).includes('type'), '=', true);
        });

        test('Should load 1 material', async function (context) {
            var material = await _repository.addResource('material', 'flat', '/lib/webgl/tests/res/flat.mat');
            context.assert(_repository.material.flat, '!=', undefined);
            context.assert(material.id, '=', 'flat');
            material.unload();
        });

        test('Should load 1 mesh', async function (context) {
            var mesh = await _repository.addResource('mesh', 'cube', '/lib/webgl/tests/res/cube.mesh');
            context.assert(_repository.mesh.cube, '!=', undefined);
            context.assert(mesh.id, '=', 'cube');
            mesh.unload();
        });

        test('Should load 1 actor from URL', async function (context) {
            var actor = await _repository.addResource('actor', 'cube', '/lib/webgl/tests/res/cube.actor');
            context.assert(_repository.actor.cube, '!=', undefined);
            context.assert(actor.id, '=', 'cube');
            actor.unload();
        });
    }

    var tests = () => [ test_registered_classes, test_repository ];

    public(tests, 'webGL tests');

})();