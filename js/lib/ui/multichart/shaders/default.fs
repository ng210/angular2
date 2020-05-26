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

float greater(float x, float a) {
	return 1.0 - step(-a, -x);
}

float less(float x, float a) {
	return 1.0 - step(a, x);
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

float getColorForDefault(vec2 pos) {
    vec2 uc = floor(pos/uUnit);
	int pi = 0;
	for (int i=0; i<MAXPOINT; i+=2) {
		if (i == uDataLength) break;
		vec2 p0 = vec2(uDataPoints[i], uDataPoints[i+1]);
		if (distance(p0, uc) < 1.0) {
			return 0.5 + checkSelection(pi);
		}
		pi++;
	}
	return 0.0;
}

float getColorForBar(vec2 pos) {
    vec2 uc = floor(pos/uUnit);
	int pi = 0;
	for (int i=0; i<MAXPOINT; i+=2) {
		if (i == uDataLength) break;
		vec2 p0 = vec2(uDataPoints[i], uDataPoints[i+1]);
		if (distance(p0.x, uc.x) < 1.0 && uc.y <= p0.y) {
			return 0.5 + checkSelection(pi);
		}
		pi++;
	}
	return 0.0;
}

float getColorForArea(vec2 pos) {
    vec2 uc = floor(pos/uUnit);
	int pi = 0;
	vec2 p0 = vec2(uDataPoints[0], uDataPoints[1]);
	for (int i=0; i<MAXPOINT; i+=2) {
		if (i == uDataLength-2) break;
		vec2 p1 = vec2(uDataPoints[i+2], uDataPoints[i+3]);
		if (p0.x <= uc.x && uc.x < p1.x && uc.y <= p0.y) {
			return 0.5 + checkSelection(pi);
		}
		p0 = p1;
		pi++;
	}
	return 0.0;
}

float getColorForDot(vec2 pos) {
	vec2 uc = pos/uUnit - 0.5;
	int pi = 0;
	for (int i=0; i<MAXPOINT; i+=2) {
		if (i == uDataLength) break;
		vec2 p0 = vec2(uDataPoints[i], uDataPoints[i+1]);
		float d = distance(uc, p0);
		if (d < 0.25) return 5.0*(0.3 - d) + checkSelection(pi);
		pi++;
	}
   return 0.0;
}

float getColorForLine(vec2 pos) {
	if (uDataLength > 0) {
		vec2 uc = (pos - 0.5*(uUnit + vec2(1.0)))/uUnit;
		vec2 p0 = vec2(uDataPoints[0], uDataPoints[1]);
		float d = distance(uc, p0);
		if (d < 0.25) return 5.0*(0.3 - d) + checkSelection(0);
		int pi = 1;
		bool result = false;
		for (int i=2; i<MAXPOINT; i+=2) {
			if (i == uDataLength) break;
			vec2 p1 = vec2(uDataPoints[i], uDataPoints[i+1]);
			d = distance(uc, p1);
			if (d < 0.25) return 5.0*(0.3 - d) + checkSelection(pi);
			vec2 delta = p1 - p0;
			float y1 = min(p0.y, p1.y);
			float y2 = max(p0.y, p1.y);
			if (p0.x - uLineWidth <= uc.x && uc.x <= p1.x + uLineWidth && y1 - uLineWidth <= uc.y && uc.y <= y2 + uLineWidth &&
				abs(delta.y*uc.x - delta.x*uc.y + p1.x*p0.y - p1.y*p0.x)/length(delta) <= uLineWidth) return 0.5 + checkSelection(pi-1);
			p0 = p1;
			pi++;
		}
	}
   return 0.0;
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

float getColorForLine2(vec2 pos) {
	if (uDataLength > 0) {
		vec2 uc = (pos - 0.5*(uUnit + vec2(1.0)))/uUnit;
		vec2 p0 = vec2(uDataPoints[0], uDataPoints[1]);
		float d = distance(uc, p0);
		if (d < 0.25) return 5.0*(0.3 - d) + 0.4*checkSelection(0);
		int pi = 1;
		bool result = false;
		for (int i=2; i<MAXPOINT; i+=2) {
			if (i == uDataLength) break;
			vec2 p1 = vec2(uDataPoints[i], uDataPoints[i+1]);
			d = distance(uc, p1);
			if (d < 0.25) return 5.0*(0.3 - d) + 0.4*checkSelection(pi);
			float y = (p1.y - p0.y)/(p1.x - p0.x)*(uc.x - p0.x) + p0.y;
			if (uc.y <= y && p0.x < uc.x && uc.x < p1.x) return 0.3  + checkSelection(pi-1);
			p0 = p1;
			pi++;
		}
	}
   return 0.0;
}

void main() {
	vec3 col = 0.5*uGridColor;
    vec2 world = gl_FragCoord.xy + uOffset;
	vec2 grid = mod(world, uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = uGridColor;
	grid = mod(world, vec2(8.0, 5.0)*uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = 1.6*uGridColor;
	if (uDataLength > 0) {
		if (world.x >= 0.0 && world.x <= float(uMaxX + 1.0)*uUnit.x) {
			float f = 0.0;
			if (uRenderMode == 0) {
				f = getColorForDefault(world);
			} else if (uRenderMode == 1) {
				f = getColorForBar(world);
			} else if (uRenderMode == 2) {
				f = getColorForDot(world);
			} else if (uRenderMode == 3) {
				f = getColorForLine(world);
			} else if (uRenderMode == 4) {
				f = getColorForBar2(world);
			} else if (uRenderMode == 5) {
				f = getColorForArea(world);
			} else if (uRenderMode == 6) {
				f = getColorForLine2(world);
			}
			col = mix(col, uColor, f+0.08);
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
