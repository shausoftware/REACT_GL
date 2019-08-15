'use strict';

export function fragmentSource() {
    
    const fsSource = `#version 300 es

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform int u_frame;

        #define T u_time * 0.5
        #define EPS 0.005
        #define FAR 100.0 
        #define PI 3.14159265359
        #define FLOOR 1.0
        #define SPHERE 2.0

        out vec4 outputColour;

        vec3 lp = vec3(4.0, 5.0, 2.0);
        vec4 sphere = vec4(0.0, 0.0, 0.0, 1.5);
        vec3 fo = vec3(0.0, -2.0, 0.0);
        vec3 fn = vec3(0.0, 1.0, 0.0);
        vec3 pp = vec3(0.0, 1.5 - EPS, 0.0); //projection point just under topmost pole of sphere
        
        float rotation = 0.0;
        float displayScene = 0.0;
        float displayProjection = 0.0;
        float rotateProjection = 0.0;
        
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        
        //IQ Sphere functions
        
        vec2 sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
            vec3 oc = ro - sph.xyz;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - sph.w * sph.w;
            float h = b * b - c;
            if (h < 0.0) return vec2(0.0);
            h = sqrt(h);
            float tN = -b - h;
            float tF = -b + h;
            return vec2(tN, tF);
        }
        
        float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
            return dot(o - ro, n) / dot(rd, n);
        }

        vec3 sphNormal(in vec3 pos, in vec4 sph) {
            return normalize(pos - sph.xyz);
        }
        
        float sphSoftShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
            vec3 oc = ro - sph.xyz;
            float r = sph.w * sph.w;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - r;
            float h = b * b - c;
            float d = -sph.w + sqrt(max(0.0, r - h));
            float t = -b - sqrt(max(0.0, h));
            return (t < 0.0) ? 1.0 : smoothstep(0.0, 1.0, k * d / t);
        }
        
        struct Scene {
            float t;
            vec3 n;
            float id;
            float bft;
        };

        Scene drawScene(vec3 ro, vec3 rd) {
            
            float mint = FAR;
            float bft = 0.0;
            vec3 minn = vec3(0.0);
            float id = 0.0;
            
            float ft = planeIntersection(ro, rd, fn, fo);
            if (ft > 0.0) {
                mint = ft;
                minn = fn;
                id = FLOOR;
            }
            
            vec2 st = sphIntersect(ro, rd, sphere);
            if (st.x > 0.0 && st.x < mint) {
                
                vec3 rp = ro + rd * st.x;
           
                mint = st.x;
                bft = st.y;
                minn = sphNormal(rp, sphere);
                id = SPHERE;
            }
            
            return Scene(mint, minn, id, bft);
        }

        vec3 gridColour(vec3 rp, vec3 col) {
            
            vec3 pc = vec3(0.0);
            
            vec2 grid = fract(rp.xz * 2.0);
            pc += col * (step(grid.x, 0.1) + step(0.9, grid.x));
            pc += col * (step(grid.y, 0.1) + step(0.9, grid.y));    
            pc *= step(abs(rp.x), 2.55) * step(abs(rp.z), 2.55);
        
            return pc;
        }
        
        vec3 sphereProjectionColour(vec3 rp, vec3 col) {
            
            vec3 pc = vec3(0.0);
        
            rp.xy *= rot(rotation * rotateProjection);
                
            vec3 pd = normalize(rp - pp);
            float ft = planeIntersection(pp, pd, fn, fo);
            if (ft > 0.0) {
                vec3 prp = pp + pd * ft; 
                pc += gridColour(prp, col);
            }
        
            return pc;
        }

        vec3 floorProjectionColour(vec3 rp, vec3 col) {
            
            vec3 pc = vec3(0.0);
            
            vec3 pd = normalize(pp - rp);
            vec2 st = sphIntersect(rp, pd, sphere);
            if (st.x > 0.0) {
                vec3 srp = rp + pd * st.x;
                pc += sphereProjectionColour(srp, col);            
            }
            
            return pc * 0.4;
        }
           
        vec3 colourScene(vec3 ro, vec3 rd, Scene scene) {
        
            vec3 pc = vec3(0.0);
            
            vec3 rp = ro + rd * scene.t;
            vec3 ld = normalize(lp - rp);
            float lt = length(lp - rp);
            float diff = max(dot(ld, scene.n), 0.01);
            float spec = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 16.0);
            float atten = 1.0 / (1.0 + lt * lt * 0.008);
            float sh = 1.0; 
            
            //scene colour
            vec3 sc = vec3(0.05, 0.0, 0.3) * 0.1 * clamp(scene.n.y * -1.0, 0.0, 1.0);
            sc += vec3(0.0, 0.5, 0.0) * diff; 
            sc += vec3(1.0) * spec;
            sc *= atten;
            
            //projection colour
            vec3 prc = vec3(0.0);
            
            if (scene.id == FLOOR) {
                
                sh = sphSoftShadow(rp - (rd * EPS), ld, sphere, 2.0);
                
                prc += floorProjectionColour(rp, vec3(0.0, 1.0, 0.0));
        
            } else if (scene.id == SPHERE) {
                                
                prc += sphereProjectionColour(rp, vec3(0.0, 1.0, 0.0));
                //back face
                vec3 bfrp = ro + rd * scene.bft;
                prc += sphereProjectionColour(bfrp, vec3(0.0, 1.0, 0.0)) * (1.0 - displayScene) * 0.8;
        
                //see through to floor
                vec3 fpc = vec3(0.0);
                float ft = planeIntersection(ro, rd, fn, fo);
                if (ft > 0.0) {
                    vec3 frp = ro + rd * ft;
                    fpc = floorProjectionColour(frp, vec3(0.0, 1.0, 0.0)) * (1.0 - displayScene);
                }  
                //TODO: this is a bit crap
                prc += fpc;
            }
            
            sc *= sh;
            pc += sc * displayScene;
            
            prc *= atten;
            pc += prc * displayProjection;
            
            return pc;
        }

        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
        
            vec3 lookAt = vec3(0.0, 0.0, 0.0);
            ro = lookAt + vec3(3.0, 2.0, -5.0);
            
            ro.xz *= rot(T);
        
            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void setupScene() {
            
            float timeline = mod(T, 20.0);
            
            if (timeline < 5.0) {
                displayScene = 1.0;
                displayProjection = 0.0;
                rotateProjection = 0.0;
            } else if (timeline < 10.0) {
                displayScene = 1.0;
                displayProjection += clamp((timeline - 5.0) * 0.5, 0.0, 1.0);
                rotateProjection = 0.0;
            } else if (timeline < 15.0) {
                displayScene = clamp(1.0 - (timeline - 10.0) * 0.5, 0.0, 1.0);
                displayProjection = 1.0;
                rotateProjection = 1.0;
                rotation = timeline - 10.0;
            } else if (timeline < 20.0) {
                displayScene = clamp((timeline - 15.0) * 0.5, 0.0, 1.0);
                displayProjection = clamp(1.0 - (timeline - 15.0) * 0.5, 0.0, 1.0);
                rotateProjection = 1.0;
                rotation = timeline - 10.0;        
            }
        }

        void main() {
            
            vec3 pc = vec3(0.0);
    
            setupScene();
    
            vec3 ro, rd;
            setupCamera(ro, rd);
    
            Scene scene = drawScene(ro, rd);
            if (scene.t > 0.0 && scene.t < FAR) {
                pc = colourScene(ro, rd, scene);        
            }
	
            outputColour = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;
    
    return fsSource;
};       