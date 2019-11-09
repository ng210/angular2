precision lowp float;

uniform vec2 uSize;
uniform vec2 uUnit;
uniform vec3 uGridColor;
uniform vec2 uOffset;
uniform vec2 uZoom;
uniform float uFrame;
uniform vec2 uMousePos;

void main()
{
   //vec2 mpos = vec2(123.0, 87.0);
   vec2 start = floor(uMousePos/uUnit) * uUnit;
   vec2 end = start + uUnit;

   vec2 pos = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
   vec2 m = mod(pos, uUnit);
   float dist = smoothstep(0.9, 0.1, distance(uSize/2.0, pos)/uSize.x);
   float f = 0.8*dist + 0.5*(step(uUnit.x-1.0, m.x) + step(uUnit.y-1.0, m.y));
   vec3 col = f*uGridColor;
   vec2 diff = pos - start;
   col += vec3(0.1, 0.1, 0.14) * (step(0.0, diff.x) * step(-uUnit.x, -diff.x));
   col += vec3(0.1, 0.14, 0.1) * (step(0.0, diff.y) * step(-uUnit.y, -diff.y));
   gl_FragColor = vec4(col, 1.0);
}
