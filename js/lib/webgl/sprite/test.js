include('ge/ge.js');
include('webgl/sprite/sprite.js');

(function() {

    var _sprMgr = null;

    function update() {
        _sprMgr.update();
    }

    function render() {
        //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        //gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.02, 0.1, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        _sprMgr.render();
    }

    async function setup() {
        if (document.getElementById('canvas') == null) {
            var canvas = document.createElement('canvas');
            canvas.width = 320; canvas.height = 240;
            canvas.id = 'canvas';
            canvas.style.position = 'absolute';
            canvas.style.left = 0; canvas.style.top = 0;
            canvas.style.zIndex = -1;
            canvas.style.width = '100vw'; canvas.style.height = '100vh';
            GE.init(canvas, 'webgl');
            GE.update = update;
            GE.render = render;
            document.body.appendChild(canvas);
        }
        if (_sprMgr == null) {
            _sprMgr = new webGL.SpriteManager();
            await _sprMgr.initialize('webgl/sprite/fighter.spr');
        }
    }

    async function test_spriteManager() {
        await setup();
        test('Should have a map', context => context.assert(_sprMgr.frameMaps[0], '!=', null));
        test('Should have a texture', context => context.assert(_sprMgr.frameMaps[0].texture, '!=', null));
    }

    async function test_createSprites() {
        await setup();
        var spr = _sprMgr.add(0, 0);
        test('Should create a sprite', context => {
            context.assert(spr.ix, '=', 0);
            context.assert(spr.frame, ':=', [0,0,24,47]);
            context.assert(spr.parent, '=', _sprMgr);
        });
        GE.start();
    }

    var tests = () => [test_spriteManager, test_createSprites];

    public(tests, 'Sprite tests');

})();