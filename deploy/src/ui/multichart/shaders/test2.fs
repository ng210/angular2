precision lowp float;

uniform float uFrame;
uniform vec2 uSize;

void main()
{
   float PI = 3.14159265356;

   //vec2 grid = 1.0 - step(0.1, mod(uSize/10.0*gl_FragCoord.xy, uSize)/uSize);
   //vec2 grid = 1.0 - step(1.0, mod(gl_FragCoord.xy, 10.0));
   vec2 grid = 1.0 - mod(1.0*uFrame/uSize.x + gl_FragCoord.xy, 30.0);
   gl_FragColor = vec4(grid.x, grid.x, grid.x, 1.0);
}