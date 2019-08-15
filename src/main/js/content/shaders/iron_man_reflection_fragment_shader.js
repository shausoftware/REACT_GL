'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

    precision mediump float;
    
    #define FAR 400.0
    #define EPS 0.005

    uniform float u_light_strength;
    uniform vec3 u_colour;
    uniform float u_specular;
    uniform float u_transparency;
    uniform float u_reflect;
    uniform float u_shadow;
    uniform float u_fresnel;
    uniform float u_tex;
    uniform vec3 u_eye_position;
    uniform vec3 u_light_position;

    //varying
    in vec4 v_shadow_position;
    in vec3 v_position;
    in vec3 v_normal;
    in vec3 v_w_position;
    in vec3 v_w_normal;
    in float v_discard;

    out vec4 outputColour;

    //Spiral AO logic from reinder
    //https://www.shadertoy.com/view/Ms33WB

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

    vec3 bump(vec3 rp, vec3 n, float ds) {
        vec2 e = vec2(EPS, 0.0);
        float n0 = noise(rp);
        vec3 d = vec3(noise(rp + e.xyy) - n0, noise(rp + e.yxy) - n0, noise(rp + e.yyx) - n0) / e.x;
        n = normalize(n - d * 2.5 / sqrt(ds));
        return n;
    }

    void main(void) {

        vec3 pc = vec3(0.0); //pixel colour

        vec2 iResolution = vec2(640.0, 480.0);
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec3 pos = v_w_position;
        vec3 eye = u_eye_position;
        vec3 n = v_w_normal;
        vec3 ld = normalize(u_light_position - pos); //light direction     
        float lt = length(u_light_position - pos); //distance to light
        vec3 rd = normalize(pos - eye); //eye - hit position ray direction 
        float dt = length(pos - eye); //distance from eye to surface

        if (u_tex == 1.0) {
            //floor
            n = bump(pos * 10.0, n, dt);
        }

        float diff = max(dot(ld, n), 0.05); //diffuse
        float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 32.0); //specular
        float fres = pow(clamp(dot(n, rd) + 1.0, 0.0, 1.0), 64.0); // fresnel
        float atten = 1.0 / (1.0 + lt * lt * 0.02); //light attenuation

        pc = u_colour * diff;

        pc += vec3(0.0, 0.2, 0.02) * 0.4 * clamp(-n.y, 0.0, 1.0) * u_specular; //uplight
        pc += vec3(1.0) * spec * u_specular;
        pc = mix(pc, vec3(0.9, 0.7, 1.0) * fres * 0.3, u_fresnel * 0.5);
        pc *= atten;
        
        pc *= clamp(u_light_strength, 0.1, 1.0);

        outputColour = vec4(sqrt(clamp(pc, 0.0, 1.0)), abs(pos.y));          
    }
    
    `;
    
    return fsSource;
};