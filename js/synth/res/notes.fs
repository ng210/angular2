precision mediump float;

#define PI 3.1415926535897932384626433832795
#define SQRT2 1.4142135623730950488016887242097
#define MAXPOINT 100

uniform vec2 uSize;
uniform vec2 uUnit;
uniform vec2 uOffset;
uniform vec2 uZoom;
uniform vec3 uGridColor;
uniform float uFrame;
uniform vec2 uMousePos;
uniform vec2 uDataPoints[MAXPOINT];
uniform int uPointCount;
uniform float uMaxX;

float rand(vec2 co){
   return fract(sin(0.0001*uFrame*dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

bool hasDataPoint(vec2 pos) {
    vec2 maxPos = uSize/uUnit;
    vec2 uc = floor(pos/uUnit);
	for (int i=0; i<=MAXPOINT; i++) {
		if (i == uPointCount) break;
        vec2 point = uDataPoints[i];
        if (distance(point, uc) < 1.0) return true;
	}
   return false;
}

float vignette() {
	return mix(1.0, smoothstep(0.6, 0.1, distance(uSize/2.0, gl_FragCoord.xy)/uSize.x), 1.6);
}

void main()
{
	vec3 col = vec3(0.05, 0.1, 0.25);
    vec2 world = gl_FragCoord.xy + uOffset;
	vec2 grid = mod(world, uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = uGridColor;
	grid = mod(world, vec2(8.0, 5.0)*uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = 1.6*uGridColor;
    if (world.x >= 0.0 && world.x <= float(uMaxX)*uUnit.x) {
        if (hasDataPoint(world)) {
            col += vec3(1.0) - 1.8*uGridColor;
        }
    } else {
		col *= 0.4;
	}
   	vec2 start = floor((uMousePos + uOffset)/uUnit) * uUnit;
   	vec2 diff = world - start;
   	vec2 select = step(0.0, diff) * step(-uUnit, -diff);
   	col += vec3(0.1, 0.1, 0.14) * select.x;
   	col += vec3(0.1, 0.14, 0.1) * select.y;
	col *= 0.9 + 0.2*rand(gl_FragCoord.xy)*vignette();
    gl_FragColor.rgb = col;
}
