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
        #define FAR 30.0 
        #define PI 3.14159265359
        #define ROWS 3
        #define COLS 6
        #define FLOOR 1.0
        #define BOX 2.0
        #define SPHERE1 3.0
        #define SPHERE2 4.0

        out vec4 outputColour;

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        vec3 lp = vec3(4.0, 5.0, -2.0);
        vec3 boxes[24];
        vec4 sphere1 = vec4(0.0);
        vec4 sphere2 = vec4(0.0);
        float r1 = 0.0;
        
        //IQ Box, Sphere and DE functions
        vec2 boxIntersection(vec3 ro, vec3 rd, vec3 boxSize, out vec3 outNormal) {
            vec3 m = 1.0 / rd;
            vec3 n = m * ro;
            vec3 k = abs(m) * boxSize;
            vec3 t1 = -n - k;
            vec3 t2 = -n + k;
            float tN = max(max(t1.x, t1.y), t1.z);
            float tF = min(min(t2.x, t2.y), t2.z);
            if( tN > tF || tF < 0.0) return vec2(-1.0); // no intersection
            outNormal = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
            return vec2(tN, tF);
        }

        float hitWall(vec3 ro, vec3 rd) {
            vec3 n = vec3(0.0);
            vec2 box = boxIntersection(ro + vec3(0.5, 1.0, 0.0), rd, vec3(3.0, 1.5, 1.0), n);
            return box.x > 0.0 ? 1.0 : 0.0;
        }
        
        float sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
            vec3 oc = ro - sph.xyz;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - sph.w * sph.w;
            float h = b * b - c;
            if (h < 0.0) return -1.0;
            h = sqrt(h);
            return -b - h;
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
        
        float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
            return dot(o - ro, n) / dot(rd, n);
        }
        
        float sdBox(vec3 p, vec3 b) {
            vec3 d = abs(p) - b;
            return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
        }

        //distance function returns distance to nearest surface in scene
        float map(vec3 rp) {
        
            float t = FAR;
        
            for (int y = 0; y < ROWS; y++) {
                for (int x = 0; x < COLS; x++) {
                    vec3 box = boxes[y * COLS + x];
                    float ns = sdBox(rp + box, vec3(0.48));
                    if (ns < t) t = ns;
                }
            }
        
            return t;
        }
        
        struct Scene {
            float t; //distance to hit point on surface
            vec3 n; //normal for floor and box
            float id; //object id
            float tf; //distance to box back face
            float bi; //box index
            float ra; //reflect amount
        };

        void setupScene() {
            
            r1 = rand(vec2(T)) * float(ROWS * COLS);
            
            sphere1 = vec4(0.7, -2.3, 0.0, 0.2);
            sphere2 = vec4(-0.7, -2.3, 0.0, 0.2);            
            sphere1.xz *= rot(T); 
            sphere2.xz *= rot(T); 
            sphere1.xyz += vec3(0.0, 0.0, -3.0);
            sphere2.xyz += vec3(0.0, 0.0, -3.0);
        
            for (int y = 0; y < ROWS; y++) {
                for (int x = 0; x < COLS; x++) {
                    float index = float(y * COLS + x);
                    vec3 box = vec3(3.0 - float(x), float(y), sin(T + index) * 0.2);
                    boxes[y * COLS + x] = box;
                }
            }        
        }
            
        vec3 glowBoxCenter() {
            float y = floor(r1 / float(COLS));            
            float x = floor(r1) - y * float(COLS);
            return vec3(3.0 - x, y, sin(T + floor(r1)) * 0.2);
        }
            
        vec3 sceneNormal(Scene scene, vec3 rp) {
            vec3 n = scene.n;
            if (scene.id == SPHERE1 || scene.id == SPHERE2) {
                n = sphNormal(rp, scene.id == SPHERE1 ? sphere1 : sphere2);
            }    
            return n;
        }
              
        Scene drawScene(vec3 ro, vec3 rd) {
            
            float mint = FAR;
            vec3 minn = vec3(0.0);
            float id = 0.0;
            float ra = 0.0;
            
            //box stuff
            float tf = 0.0; //distance to backface of box
            float bi = -1.0;
            
            //floor
            vec3 fo = vec3(0.0, -2.5, 0.0);
            vec3 fn = vec3(0.0, 1.0, 0.0);
            float ft = planeIntersection(ro, rd, fn, fo);
            if (ft > 0.0 && ft < FAR) {
                mint = ft;
                minn = fn;
                id = FLOOR;
                ra = 0.3;
            }
            
            //boxes
            if (hitWall(ro, rd) > 0.0) {
                for (int y = 0; y < ROWS; y++) {
                    for (int x = 0; x < COLS; x++) {
                        vec3 box = boxes[y * COLS + x];
                        vec3 bn = vec3(0.0);
                        vec2 bin = boxIntersection(ro + box, rd, vec3(0.48), bn);
                        if (bin.x > 0.0 && bin.x < mint) {
                            mint = bin.x;
                            tf = bin.y;
                            minn = bn;
                            bi = float(y * COLS + x);
                            id = BOX;
                            ra = 0.3;
                        }
                    }
                }
            }
                        
            //spheres
            float st = sphIntersect(ro, rd, sphere1);
            if (st > 0.0 && st < mint) {
                mint = st;
                id = SPHERE1;
                ra = 0.8;
            }
            st = sphIntersect(ro, rd, sphere2);
            if (st > 0.0 && st < mint) {
                mint = st;
                id = SPHERE2;
                ra = 0.8;
            }
                
            return Scene(mint, minn, id, tf, bi, ra);
        }

        //box interior glow
        vec3 vMarch1(vec3 ro, vec3 rd, vec3 bc, float maxt) {
        
            vec3 pc = vec3(0.0);
            float t = 0.0;
        
            for (int i = 0; i < 30; i++) {
                vec3 rp = ro + rd * t;
                if (t > FAR) break;
                float lt = length(rp + bc);
                pc +=  vec3(0.0, 1.0, 0.0) / (1.0 + lt * lt * 10.0) * 0.05;
                t += 0.05;
            }
        
            return pc;
        }
        
        //external box glow 
        vec3 vMarch2(vec3 ro, vec3 rd, vec3 bc, float maxt) {
        
            vec3 pc = vec3(0.0);
            float t = 0.0;
        
            for (int i = 0; i < 20; i++) {
                vec3 rp = ro + rd * t;
                float ns = map(rp);
                if (ns < EPS || t > maxt) break;
                float lt = length(rp + bc);
        
                pc += vec3(0.0, 1.0, 0.0) * exp(-lt * 3.5) * 0.08;
        
                t += ns;
            }
        
            return pc;
        }
        
        vec3 colourObject(vec3 rp, vec3 n, vec3 rd, Scene scene) {
            
            vec3 pc = vec3(0.0);
            
            vec3 ld = normalize(lp - rp);
            float lt = length(lp - rp);
            float atten = 1.0 / (1.0 + lt * lt * 0.08);
            float diff = max(dot(ld, n), 0.05);
            float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 16.0);
            
            if (scene.id == FLOOR) {
                    
                pc = vec3(1.0, 1.0, 1.0) * diff;
                pc += vec3(1.0) * spec;
                pc *= atten;
                //shadows from spheres
                float sh1 = sphSoftShadow(rp - rd * EPS, ld, sphere1, 16.0);
                float sh2 = sphSoftShadow(rp - rd * EPS, ld, sphere2, 16.0);    
                pc *= sh1 * sh2;
        
            } else if (scene.id == BOX) {
                
                pc = vec3(0.0, 0.2, 0.0) * diff;
                pc += vec3(1.0) * spec;
                pc *= atten;
                if (r1 >= scene.bi && r1 < scene.bi + 1.0) {
                    //glow box interior
                    vec3 gbc = glowBoxCenter();
                    pc += vMarch1(rp, rd, gbc, scene.tf - scene.t);
                }
        
            } else if (scene.id == SPHERE1 || scene.id == SPHERE2) {
                
                pc = vec3(0.0, 0.1, 0.0) * diff;
                pc += vec3(1.0) * spec;
                pc *= atten;
            }
            
            return pc;
        }
            
        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

            vec3 lookAt = vec3(0.0, -2.0, 0.0);
            ro = lookAt + vec3(sin(T * 0.2) * 3.0, 1.0, -6.0);

            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour

            setupScene();

            vec3 ro, rd;
            setupCamera(ro, rd);

            Scene scene = drawScene(ro, rd);
            if (scene.t > 0.0 && scene.t < FAR) {
                
                vec3 rp = ro + rd * scene.t;
                vec3 n = sceneNormal(scene, rp);
                vec3 rrd = reflect(rd, n);
                
                vec3 oc = colourObject(rp, n, rd, scene);
                vec3 rc = vec3(0.0); //reflection colour
        
                //single pass reflections
                Scene reflectedScene = drawScene(rp - rd * EPS, rrd);
                if (reflectedScene.t > 0.0 && reflectedScene.t < FAR) {
                    
                    vec3 rrp = rp + rrd * reflectedScene.t;
                    vec3 rn = sceneNormal(reflectedScene, rrp);
                    float raa = 0.0;

                    rc = colourObject(rrp, rn, rrd, reflectedScene);
                    
                    if (scene.id == FLOOR) {
                        raa = 1.0 / (1.0 + reflectedScene.t * reflectedScene.t * 0.2);;
                    } else if (scene.id == BOX) {
                        raa = clamp(1.0 / (1.0 + reflectedScene.t * reflectedScene.t * 0.1), 0.0, 0.2);;
                    } else if (scene.id == SPHERE1 || scene.id == SPHERE2) {
                        raa = 1.0 / (1.0 + reflectedScene.t * reflectedScene.t * 0.05);
                    }
                    
                    rc *= raa;
                }
                
                pc = mix(oc, rc, scene.ra); 

                if (scene.id == FLOOR) {
                    //box shadows
                    float lt = length(lp - rp);
                    Scene shadScene = drawScene(ro + rd * (scene.t - EPS), normalize(lp - rp));
                    if (shadScene.t < lt) {
                        pc *= shadScene.t / lt;
                    }
                } else if (scene.id == SPHERE1 || scene.id == SPHERE2) {
                    vec3 ld = normalize(lp - rp);
                    float spec = pow(max(dot(reflect(-ld, n), -rd), 0.0), 16.0);
                    pc += vec3(1.0) * spec;
                }
            }

            vec3 gbc = glowBoxCenter();
            pc += vMarch2(ro, rd, gbc, scene.t);
        
            outputColour = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};