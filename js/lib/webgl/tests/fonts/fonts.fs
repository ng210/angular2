#define MAXLENGTH 255
#define PI 3.1415926535897932384626433832795

precision mediump float;

uniform int uFrame;
uniform vec2 uSize;
uniform float uDuration;

uniform vec4 uText[MAXLENGTH];
uniform int uTextLength;
uniform vec4 uColor;
uniform vec4 uBgColor;

uniform vec3 uFontSize;
//uniform vec3 uFontData[64];
uniform sampler2D uFontTexture;

float inRect(vec2 v, vec2 topRight, vec2 bottomLeft) {
    vec2 s = step(bottomLeft, v) - step(topRight, v);
    return s.x * s.y;   
}

vec2 getTextRect() {
    vec2 rect = vec2(0.0, uFontSize.z);
    for (int i=0; i<MAXLENGTH; i++) {
        vec4 font = uText[i];
        rect.x += font.z;
        rect.y = max(rect.y, font.w);
    }
    return rect;
}

vec4 drawFont(vec4 font, vec2 uv, vec2 size, vec4 color) {
    vec2 scale = size/font.zw;
    if (uv.y < scale.y*(uFontSize.z - font.w)) return vec4(0.0);
    uv.y -= scale.y*(uFontSize.z - font.w);
    uv /= size;
    vec2 texCoord = (font.zw * uv + font.xy)/uFontSize.xy;
    //vec3 shade = mix(vec3(0.8), uv.xyx, 0.8);
    return color * texture2D(uFontTexture, texCoord);   // * vec4(shade, 1.0);
}

vec4 drawText(vec2 uv, vec2 pos, vec2 size, vec4 color) {
    vec4 col = vec4(0.0);
    if (uv.x >= pos.x && uv.y >= pos.y) {
        vec2 rect = getTextRect();
        size = mix(-size*rect, size, step(0.0, size));
        if (uv.x < pos.x+size.x && uv.y < pos.y+size.y) {
            vec2 scale = size/rect;
            for (int i=0; i<MAXLENGTH; i++) {
                if (i == uTextLength) break;
                vec4 font = uText[i];
                size = font.zw*scale;
                if (uv.x < pos.x + size.x) {
                    col = drawFont(font, uv-pos, size, color);
                    break;
                }
                pos.x += size.x;
            }
        }
    }
    return col;
}

vec2 wave(vec2 uv, vec2 size, float t) {
    return cos(2.0*PI*(2.1*t + vec2(-0.96, 9.6)*uv.yx/size.yx));
}

vec2 rand(vec2 pos) {
    vec2 seed = vec2(12.9898, 78.233);
    float arg = dot(pos.xy, seed);
    return fract(vec2(cos(arg), sin(arg)) * 43758.5453);
}

vec2 explode(vec2 uv, vec2 size, float t) {
    return 0.8*uSize*t*(rand(uv)-0.5);
}

void main() {
    vec2 uv = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
    vec4 finalColor = vec4(0.0);
    vec4 color;
    float frame = float(uFrame);
    vec2 size = 2.0*getTextRect();
    vec2 pos = 0.5*(uSize - size);
    float f = mod(frame, uDuration)/uDuration;
    float gain = (1.0-step(0.3, f))*(1.0 - smoothstep(0.0, 0.3, f)) + step(0.7, f)*(smoothstep(0.7, 1.0, f));
    // background
    float unit = 160.0;
    vec2 bxy = 0.05*sin(PI*f)*(uv + 4.0*unit*vec2(cos(2.0*PI*f), sin(2.0*PI*f)));
    vec2 grid = 0.5 + 0.5*sin(4.0*PI*bxy/unit);
    finalColor = length(grid)*vec4(0.04, 0.1, 0.2, 0.5);
    size *= 1.0 + 1.5*gain;
    //pos = 0.5*(uSize - vec2(smoothstep(0.7, 1.0, f), 1.0)*size) + f*vec2(-uSize.x, -50.0);
    pos = 0.5*(uSize - size);
    float opacity = 1.0 - gain;
    vec2 xy = mix(
        23.0*(gain + 0.2)*wave(uv, size, f),
        explode(uv, size, gain),
        0.1);
    color = drawText(uv + xy, pos, size, uColor);
    finalColor = mix(finalColor, color, color.a * opacity);

    gl_FragColor = finalColor;
}
