precision highp float;

#define PI 3.1415926535897932384626433832795
#define SQRT2 1.4142135623730950488016887242097
#define MAXPOINT 200

#define MODE 1

uniform vec2 uSize;
uniform vec2 uUnit;
uniform vec2 uOffset;
uniform vec3 uGridColor;
uniform vec3 uColor;
uniform float uFrame;
uniform vec2 uMousePos;
uniform float uDataPoints[MAXPOINT];
uniform int uDataLength;
uniform float uMaxX;
uniform bool uArea;
uniform int uRenderMode;
uniform float uLineWidth;
uniform vec2 uSelectionRect[2];
uniform int uSelectedPoints[MAXPOINT];
uniform int uSelectionLength;

float rand(vec2 co){
   return fract(sin(0.001*uFrame*dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
float vignette() {
	vec2 ratio = vec2(uSize.x/uSize.y, 1.0);
	return mix(1.0, smoothstep(0.8, 0.1, 0.95*distance(vec2(0.5), gl_FragCoord.xy/uSize)), 1.2);
}

float greaterEq(float x, float a) {
	return step(a, x);
}

float lessEq(float x, float a) {
	return step(-a, -x);
}

float between(float a, float b, float x) {
	return greaterEq(x, a)*lessEq(x, b);
}

float between(vec2 a, vec2 b, vec2 v) {
	return between(a.x, b.x, v.x) * between(a.y, b.y, v.y);
}

float checkSelection(int i) {
	float f = 0.0;
		for (int j=0; j<MAXPOINT; j++) {
		if (j == uSelectionLength) break;
		if (uSelectedPoints[j] == i) {
			f = 0.5;
			break;
		}
	}
	return f;
}

float getColorForBar2(vec2 pos) {
    vec2 uc = floor(pos/uUnit);
	int pi = 0;
	for (int i=0; i<MAXPOINT; i+=4) {
		if (i == uDataLength) break;
		vec2 p0 = vec2(uDataPoints[i], uDataPoints[i+1]);
		if (p0.x <= uc.x && uc.x < p0.x + uDataPoints[i+3] && uc.y == p0.y) {
			return 0.6*uDataPoints[i+2]/255.0 + checkSelection(pi);;
		}
		pi++;
	}
	return 0.0;
}

void main() {
	vec3 col = 0.1*uGridColor;
    vec2 world = gl_FragCoord.xy + uOffset;
	float h = floor(mod(world.y/uUnit.y, 12.0));
	if (h == 1.0 || h == 3.0 || h == 6.0 || h == 8.0 || h == 10.0) {
		;
	} else {
		col += 0.4*uGridColor;
	}

	vec2 grid = mod(world, uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = 0.8*uGridColor;
	grid = mod(world, vec2(4.0, 12.0)*uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = 0.1*uGridColor;
	if (uDataLength > 0) {
		if (world.x >= 0.0 && world.x <= float(uMaxX + 1.0)*uUnit.x) {
			float f = getColorForBar2(world);
			col = mix(col, uColor, f+0.1);
		}
	}
   	vec2 start = floor((uMousePos + uOffset)/uUnit) * uUnit;
   	vec2 diff = world - start;
	vec2 select = step(0.0, diff) * step(-uUnit, -diff);
   	col += vec3(0.1, 0.1, 0.14) * select.x;
   	col += vec3(0.1, 0.14, 0.1) * select.y;

	if (between(uSelectionRect[0], uSelectionRect[1], world) == 1.0) {
		col += vec3(0.1, 0.2, 0.24);
	}

	col *= 0.2 + 0.8*vignette()*mix(1.0, rand(gl_FragCoord.xy), 0.2);
    gl_FragColor.rgb = col;
}
