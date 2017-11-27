'use strict';

function fragmentSource() {
    
    const fsSource = `

    precision mediump float;
    
    #define FAR 400.0
    #define MOD3 vec3(0.1031, 0.11369, 0.13787)
    #define SAMPLES 16
    #define INTENSITY 1.
    #define SCALE 2.5
    #define BIAS 0.05
    #define SAMPLE_RAD 0.02
    #define MAX_DISTANCE 0.07

    uniform sampler2D u_depth_colour_texture;
    uniform sampler2D u_ssao_texture;    
    uniform vec3 u_colour;
    uniform float u_specular;
    uniform float u_transparency;
    uniform float u_reflect;
    uniform float u_shadow;
    uniform float u_fresnel;
    uniform float u_tex;
    uniform vec3 u_eye_position;
    uniform vec3 u_light_position;

    varying vec4 v_shadow_position;
    varying vec3 v_position;
    varying vec3 v_normal;
    
    //Spiral AO logic from reinder
    //https://www.shadertoy.com/view/Ms33WB

    float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
        return dot(o - ro, n) / dot(rd, n);
    }

    //IQs noise
    float noise(vec3 rp) {
        vec3 ip = floor(rp);
        rp -= ip; 
        vec3 s = vec3(7, 157, 113);
        vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);
        rp = rp * rp * (3.0 - 2.0 * rp); 
        h = mix(fract(sin(h) * 43758.5), fract(sin(h + s.x) * 43758.5), rp.x);
        h.xy = mix(h.xz, h.yw, rp.y);
        return mix(h.x, h.y, rp.z); 
    }

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

        return 0.2 + amountInLight * 0.8;
    }

    void main(void) {

        vec3 pc = vec3(0.0); //pixel colour

        vec3 pos = v_position;
        vec3 eye = u_eye_position;
        vec3 ld = normalize(u_light_position - pos); //light direction        
        float lt = length(u_light_position - pos); //distance to light
        vec3 rd = normalize(pos - eye); //eye - hit position ray direction 
        vec3 rrd = reflect(rd, v_normal); //relected ray direction
        vec3 e = -normalize(pos); 
        vec3 h =  normalize(ld + e);
        float diff = max(dot(ld, v_normal), 0.3); //diffuse
        float spec = pow(max(dot(v_normal, h), 0.0), 22.0); //specular
        float fres = pow(max(dot(v_normal, rd) + 1.0, 0.0), 4.0); // fresnel
        float atten = 1.0 / (1.0 + lt * lt * 0.02); //light attenuation

        pc = u_colour * diff;
        /*
        if (u_tex == 1.0) {
            pc *= noise(pos * 20.0);
        }
        */
        pc += vec3(0.02, 0.0, 0.2) * 0.6 * clamp(-v_normal.y, 0.0, 1.0); //uplight
        pc += vec3(0.8, 0.8, 1.0) * 0.03 * clamp(v_normal.y, 0.0, 1.0); //downlight
        pc *= atten;
        pc += vec3(0.8, 0.8, 1.0) * spec * u_specular;
        //pc += vec3(0.8, 0.8, 1.0) * fres * u_fresnel;
        
        //reflections from ceiling
        if (u_reflect > 0.0) {
            vec3 rpc = vec3(0.0);
            float rt = 0.0; //light attenuation
            vec3 co = vec3(0.0, 10.0, 0.0);
            vec3 cn = vec3(0.0, -1.0, 0.0);
            float ct = planeIntersection(pos, rrd, cn, co);
            if (ct > 0.0 && ct < FAR) {
                vec3 rrp = pos + rrd * ct;
                float mz = mod(rrp.z, 16.0) - 8.0;
                rpc = mz > 0.0 ? vec3(1.0) : vec3(0.0);
                rt = 1.0 / (1.0 + ct * ct * 0.05);  
                rpc *= rt * clamp(v_normal.y, 0.0, 1.0);          
            }
            pc += rpc * u_reflect;
        }

        float alpha = 1.0;
        //transparency
        if (u_transparency > 0.0) {
            alpha = 0.5;
        }

        //shadows
        if (u_shadow > 0.0) {
            float amountInLight = pcfFilter();
            pc *= amountInLight;
        }

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
        pc *= ao;

        gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), alpha);          
    }
    
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};