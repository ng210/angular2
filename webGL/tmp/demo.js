var g = {};
var gl = null;

function onPageLoad() {
	GE.init(fw.Config.app.settings, 'canvasContainer');
	if (GE.gl == null) {
		Dbg.prln('webGL not supported!');
		return;
	}
	gl = GE.gl;

    var c = GE.canvas;

    //c = WebGLDebugUtils.makeLostContextSimulatingCanvas(c);
    // tell the simulator when to lose context.
    //c.loseContextInNCalls(1);
    
    init(GE.gl);

    currentAngle = 0;
    incAngle = 0.5;
    framerate = new Framerate("framerate");
    
    GE.start();
    

	
    return;
}

function processInput() {

}

var currentAngle = 0;
function update(f) {
    currentAngle += incAngle;
    if (currentAngle > 360)
        currentAngle -= 360;
}

function render(f) {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Make a model/view matrix.
    g.mvMatrix.makeIdentity();
    g.mvMatrix.rotate(20, 1,0,0);
    g.mvMatrix.rotate(currentAngle, 0,1,0);

    // Construct the normal matrix from the model-view matrix and pass it in
    g.normalMatrix.load(g.mvMatrix);
    g.normalMatrix.invert();
    g.normalMatrix.transpose();
    g.normalMatrix.setUniform(gl, g.u_normalMatrixLoc, false);

    // Construct the model-view * projection matrix and pass it in
    g.mvpMatrix.load(g.perspectiveMatrix);
    g.mvpMatrix.multiply(g.mvMatrix);
    g.mvpMatrix.setUniform(gl, g.u_modelViewProjMatrixLoc, false);

    // Bind the texture to use
    gl.bindTexture(gl.TEXTURE_2D, spiritTexture);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, g.box.numIndices, gl.UNSIGNED_BYTE, 0);

    // Show the framerate
    framerate.snapshot();
}

function init(gl) {
    var program = simpleSetup(
        gl,
        // The ids of the vertex and fragment shaders
        "vshader", "fshader",
        // The vertex attribute names used by the shaders.
        // The order they appear here corresponds to their index
        // used later.
        [ "vNormal", "vColor", "vPosition"],
        // The clear color and depth values
        [ 0, 0, 0.5, 1 ], 10000);

    // Set some uniform variables for the shaders
    gl.uniform3f(gl.getUniformLocation(program, "lightDir"), 0, 0, 1);
    gl.uniform1i(gl.getUniformLocation(program, "sampler2d"), 0);

    // Create a box. On return 'gl' contains a 'box' property with
    // the BufferObjects containing the arrays for vertices,
    // normals, texture coords, and indices.
    g.box = makeBox(gl);

    // Load an image to use. Returns a WebGLTexture object
    spiritTexture = loadImageTexture(gl, "Legoland01.jpg");

    // Create some matrices to use later and save their locations in the shaders
    g.mvMatrix = new J3DIMatrix4();
    g.u_normalMatrixLoc = gl.getUniformLocation(program, "u_normalMatrix");
    g.normalMatrix = new J3DIMatrix4();
    g.u_modelViewProjMatrixLoc = gl.getUniformLocation(program, "u_modelViewProjMatrix");
    g.mvpMatrix = new J3DIMatrix4();

    // Enable all of the vertex attribute arrays.
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    // Set up all the vertex attributes for vertices, normals and texCoords
    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.vertexObject);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.normalObject);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.texCoordObject);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    // Bind the index array
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.box.indexObject);

    // Set the viewport and projection matrix for the scene
    gl.viewport(0, 0, GE.canvas.clientWidth, GE.canvas.clientHeight);
    g.perspectiveMatrix = new J3DIMatrix4();
    g.perspectiveMatrix.perspective(30, GE.canvas.clientWidth / GE.canvas.clientHeight, 1, 10000);
    g.perspectiveMatrix.lookat(0, 0, 7, 0, 0, 0, 0, 1, 0);
    
    return gl;
}

var requestId;

function reshape(gl)
{
    // change the size of the canvas's backing store to match the size it is displayed.
    var canvas = document.getElementById('mainSurface');
//    if (canvas.clientWidth == canvas.width && canvas.clientHeight == canvas.height)
//        return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Set the viewport and projection matrix for the scene
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    g.perspectiveMatrix = new J3DIMatrix4();
    g.perspectiveMatrix.perspective(30, canvas.clientWidth / canvas.clientHeight, 1, 10000);
    g.perspectiveMatrix.lookat(0, 0, 7, 0, 0, 0, 0, 1, 0);
}


