'use strict';

function fragmentSource() {
    
    const fsSource = `

    precision mediump float;
    
    #define MOD3 vec3(0.1031, 0.11369, 0.13787)
    #define SAMPLES 16
    #define INTENSITY 1.
    #define SCALE 2.5
    #define BIAS 0.05
    #define SAMPLE_RAD 0.02
    #define MAX_DISTANCE 0.07

    uniform sampler2D u_depth_colour_texture;
    uniform sampler2D u_ssao_texture;
    
    varying vec2 v_depth_uv;
    varying vec4 v_shadow_position;
    varying vec3 v_colour;
    varying vec3 v_normal;
    varying mat4 v_projection_matrix;
    
    const int kernelSize = 16;  
	const float radius = 0.1;
    
    float decodeFloat (vec4 colour) {
        const vec4 bitShift = vec4(1.0 / (256.0 * 256.0 * 256.0),
                                   1.0 / (256.0 * 256.0),
                                   1.0 / 256.0,
                                   1.0);
        return dot(colour, bitShift);
    } 
    
    float hash12(vec2 p) {
        vec3 p3  = fract(vec3(p.xyx) * MOD3);
        p3 += dot(p3, p3.yzx + 19.19);
        return fract((p3.x + p3.y) * p3.z);
    }

    vec2 hash22(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * MOD3);
        p3 += dot(p3, p3.yzx+19.19);
        return fract(vec2((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y));
    }

    vec3 getPosition(vec2 uv) {
        float fl = 1.5; 
        float d = decodeFloat(texture2D(u_ssao_texture, uv));   
        vec2 p = uv*2.-1.;
        mat3 ca = mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0 / 1.5);
        vec3 rd = normalize(ca * vec3(p, fl));
        vec3 pos = rd * d;
        return pos;
    }

    vec2 getRandom(vec2 uv) {
        return normalize(hash22(uv * 126.1231) * 2.0 - 1.0);
    }

    float doAmbientOcclusion(vec2 tcoord, vec2 uv, vec3 p, vec3 cnorm) {
        vec3 diff = getPosition(tcoord + uv) - p;
        float l = length(diff);
        vec3 v = diff / l;
        float d = l * SCALE;
        float ao = max(0.0, dot(cnorm, v) - BIAS) * (1.0 / (1.0 + d));
        ao *= smoothstep(MAX_DISTANCE,MAX_DISTANCE * 0.5, l);
        return ao;
    }

    float spiralAO(vec2 uv, vec3 p, vec3 n, float rad) {
        float goldenAngle = 2.4;
        float ao = 0.0;
        float inv = 1.0 / float(SAMPLES);
        float radius = 0.0;
        float rotatePhase = hash12(uv * 100.0) * 6.28;
        float rStep = inv * rad;
        vec2 spiralUV;
        for (int i = 0; i < SAMPLES; i++) {
            spiralUV.x = sin(rotatePhase);
            spiralUV.y = cos(rotatePhase);
            radius += rStep;
            ao += doAmbientOcclusion(uv, spiralUV * radius, p, n);
            rotatePhase += goldenAngle;
        }
        ao *= inv;
        return ao;
    }

    float pcfFilter() {

        vec3 fragmentDepth = v_shadow_position.xyz;
        float shadowAcneRemover = 0.007;
        fragmentDepth.z -= shadowAcneRemover;

        float texelSize = 1.0 / 2048.0;
        float amountInLight = 0.0;

        // Check whether or not the current fragment and the 8 fragments surrounding
        // the current fragment are in the shadow. We then average out whether or not
        // all of these fragments are in the shadow to determine the shadow contribution
        // of the current fragment.
        // So if 4 out of 9 fragments that we check are in the shadow then we'll say that
        // this fragment is 4/9ths in the shadow so it'll be a little brighter than something
        // that is 9/9ths in the shadow.
        for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
                float texelDepth = decodeFloat(texture2D(u_depth_colour_texture, fragmentDepth.xy + vec2(x, y) * texelSize));
                if (fragmentDepth.z < texelDepth) {
                    amountInLight += 1.0;
                }
            }
        }
        amountInLight /= 9.0;

        return amountInLight;
    }

    void main(void) {

        //ssao
        vec2 iResolution = vec2(640.0, 480.0);
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec3 p = getPosition(uv);
        vec3 n = normalize(v_normal);
        float ao = 0.0;
        float rad = SAMPLE_RAD / p.z;
        ao = spiralAO(uv, p, n, rad);
        ao = 1.0 - ao * INTENSITY;
        //gl_FragColor = vec4(ao, ao, ao, 1.0);

        //shadow
        float amountInLight = pcfFilter();;
        gl_FragColor = vec4(v_colour * amountInLight * ao, 1.0);
    }

    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};