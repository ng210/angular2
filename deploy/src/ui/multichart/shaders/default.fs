precision mediump float;

uniform vec2 uSize;
uniform vec2 uUnit;
uniform vec3 uGridColor;
uniform vec2 uOffset;
uniform vec2 uZoom;
uniform float uFrame;
uniform vec2 uMousePos;
uniform int uPointCount;
uniform vec2 uDataPoints[100];
uniform float uRange;

float rand(vec2 co){
   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

bool hasDataPoint(vec2 pos) {
   vec2 start = floor(pos/uUnit);
   vec2 end = start + vec2(1.0, 1.0);
   for (int i=0; i<100; i++) {
      if (i == uPointCount) break;
      vec2 point = uDataPoints[i];
      if (point.x >= start.x && point.x < end.x &&
          point.y >= start.y && point.y < end.y) return true;
      // vec2 diff = point - start;
      // vec2 result = step(-1.0, diff);   // * step(-uUnit, -diff);
      // if (result.x == 0.0) return false;
   }
   return false;
}

vec3 getColor(vec2 displace) {
   vec3 col;
   vec2 start = floor(uMousePos/uUnit) * uUnit;
   vec2 coors = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
   coors += displace;   //*sin(0.0005*uFrame + 20.0*3.14*displace + 0.0*coors.y * 3.14);
   vec2 pos = coors - uOffset;
   vec2 m = mod(pos, uUnit);
   float dist = mix(1.0, smoothstep(0.9, 0.1, distance(uSize/2.0, coors)/uSize.x), 0.6);
   if (!hasDataPoint(pos)) {
      col = mix(1.0, step(-uRange*uUnit.x, -pos.x), 0.7)*uGridColor*(dist + 0.8*(step(uUnit.x-1.0, m.x) + step(uUnit.y-1.0, m.y)));
   } else {
      col = dist*vec3(1.0, 0.8, 0.5);
   }
   vec2 diff = coors - start;
   vec2 select = step(0.0, diff) * step(-uUnit, -diff);
   col += vec3(0.1, 0.1, 0.14) * select.x;
   col += vec3(0.1, 0.14, 0.1) * select.y;
   return col;
}

void main()
{
   vec3 col = 0.8*getColor(vec2(0.0, 0.0));
   //vec2 seed = vec2(8.0, 0.0);   //0.5*sin(0.2*uFrame*gl_FragCoord.xy/uSize*3.14);
   //float raster = mod(3.7*uFrame, uSize.y);
   //vec2 seed = 4.0*vec2(rand(gl_FragCoord.xy), rand(-gl_FragCoord.xy));
   float amp = 0.2;
   float dist = 1.1;
   float f = 0.4; //0.4 * (1.0 + sin(0.4*uFrame));
   //float length = 0.1;
   for (int i=0; i<4; i++) {
      //col += amp*getColor(4.0*sin(6.28*(clamp((raster - gl_FragCoord.y)/uSize.y, 0.0, 0.1) );
      //float theta = 2.0*step(raster, gl_FragCoord.y)*(length - clamp(distance(raster, gl_FragCoord.y)/uSize.y, 0.0, length));
      //col += amp*getColor(dist*sin(6.28*theta));
      vec3 tmp = amp*getColor(vec2(-dist, -dist));
      tmp += amp*getColor(vec2(dist, -dist));
      tmp += amp*getColor(vec2(-dist, dist));
      tmp += amp*getColor(vec2(dist, dist));
      col += tmp/4.0;
      amp *= 0.8;
      dist *= 1.5 + f;
   }
   
   gl_FragColor = vec4(col, 1.0);
}
