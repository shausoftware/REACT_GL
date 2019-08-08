'use strict';

export function fragmentSource() {
    
    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;

        uniform sampler2D u_texture1;        

        #define T u_time * 4.0
        #define PI 3.14159265359
        #define FAR 100.0 
        #define EPS 0.001
        #define STEP_SIZE 4.0
        #define FLOOR 1.0
        #define BRICK 2.0
        #define TOWER 3.0
        #define LIGHT3 6.0
        
        vec3 lp = vec3(0.0);
        float TX = 0.0;

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}

        float tex(vec2 rp) {
            float edge = 0.0;
            edge = step(0.99, abs(rp.x));
            edge += step(0.99, abs(rp.y));
            return edge;
        }        

        // Cube mapping routine from Fizzer
        // I'm not sure where I got this from
        float fizz(vec3 rp, vec3 box) {
            rp /= box;
            vec3 f = abs(rp);
            f = step(f.zxy, f) * step(f.yzx, f); 
            f.xy = f.x > .5 ? rp.yz / rp.x : f.y > .5 ? rp.xz / rp.y : rp.xy / rp.z; 
            return tex(f.xy);
        }

        //IQ Box, Sphere and DE functions
        vec3 boxIntersection(vec3 ro, vec3 rd, vec3 boxSize, out vec3 outNormal) {
            float edge = 0.0;
            vec3 m = 1.0 / rd;
            vec3 n = m * ro;
            vec3 k = abs(m) * boxSize;
            vec3 t1 = -n - k;
            vec3 t2 = -n + k;
            float tN = max(max(t1.x, t1.y), t1.z);
            float tF = min(min(t2.x, t2.y), t2.z);
            if( tN > tF || tF < 0.0) return vec3(-1.0); // no intersection
            outNormal = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
            edge = fizz(ro + rd * tN, boxSize);
            return vec3(tN, tF, edge);
        }
        
        float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
            return dot(o - ro, n) / dot(rd, n);
        }
        
        struct Scene {
            float t;
            float id;
            vec3 n;
            float edge;
        };

        vec3 colourScene(vec3 ro, vec3 rd, Scene scene) {
            
            vec3 pc = vec3(0.0);
            
            vec3 rp = ro + rd * scene.t;
            vec3 ld = normalize(lp - rp);
            float lt = length(lp - rp);
            float diff = max(dot(ld, scene.n), 0.05);
            float spec = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 32.0);
            float atten = 1.0 / (1.0 + lt * lt * 0.02);
            
            vec2 grid = vec2((rp.x + 2.0) * 0.25, rp.z + 0.5);
            vec2 cell = floor(grid);
            vec2 cuv = fract(grid);

            if (scene.id == FLOOR) {
                
                pc = vec3(0.3) * diff;
                pc += vec3(1.0) * spec;
                pc += (smoothstep(0.01, 0.005, cuv.x) + smoothstep(0.998, 0.999, cuv.x)) * vec3(0.0, 1.0, 0.0);
                pc += (smoothstep(0.04, 0.01, cuv.y) + smoothstep(0.96, 0.99, cuv.y)) * vec3(0.0, 1.0, 0.0);
                pc *= atten;
            
            } else if (scene.id == BRICK || scene.id == TOWER) {
                
                pc = vec3(0.3) * diff;  
                pc += vec3(1.0) * spec;
                pc = mix(pc, vec3(0.0, 1.0, 0.0) * scene.edge, 0.5);
                pc *= atten;
            }
            
            return pc;
        }

        Scene drawScene(vec3 ro, vec3 rd) {
            
            float mint = FAR;
            vec3 minn = vec3(0.0);
            float id = 0.0;
            float edge = 0.0;
            
            TX = (floor(T / 50.0) * 50.0) + 10.0;;
            
            vec3 fo = vec3(0.0, 0.0, 0.0);
            vec3 fn = vec3(0.0, 1.0, 0.0);
            float ft = planeIntersection(ro, rd, fn, fo);
            if (ft > 0.0) {
                mint = ft;
                minn = fn;
                id = FLOOR;
            }
            
            vec3 tn = vec3(0.0);
            vec3 tt = boxIntersection(ro - vec3(TX, 0.0, 1.0), rd, vec3(0.2, 2.5, 0.2), tn);
            //bounds check
            if (tt.x > 0.0 && tt.x < mint) {
                //base
                vec3 tbase = boxIntersection(ro - vec3(TX, 0.0, 1.0), rd, vec3(0.2, 2.0, 0.2), tn);
                if (tbase.x > 0.0 && tbase.x < mint) {
                    mint = tbase.x;
                    minn = tn;
                    edge = tbase.z;
                    id = TOWER;
                }
                //light
                vec3 tlight = boxIntersection(ro - vec3(TX, 2.1, 1.0), rd, vec3(0.15, 0.1, 0.15), tn);
                if (tlight.x > 0.0 && tlight.x < mint) {
                    mint = tlight.x;
                    minn = tn;
                    id = LIGHT3;
                }
                //roof
                vec3 troof = boxIntersection(ro - vec3(TX, 2.25, 1.0), rd, vec3(0.2, 0.1, 0.2), tn);
                if (troof.x > 0.0 && troof.x < mint) {
                    mint = troof.x;
                    minn = tn;
                    edge = troof.z;
                    id = TOWER;
                }        
            }
            
            float steps = 10.0;
            float wmin = T - steps * STEP_SIZE;
            wmin -= mod(wmin , STEP_SIZE);
                
            //for (float i = 0.0; i < steps + 4.0 * STEP_SIZE; i += 1.0) {    
            for (float i = 0.0; i < 18.0; i += 1.0) {    
                float xidx = wmin + i * STEP_SIZE;
        
                //ROW 1
                float r = rand(vec2(xidx, 0.0));
                vec3 bn;
                float bh = 1.0 - r * 1.5;
                if (bh > 0.0) {
                    vec3 box = boxIntersection(ro - vec3(xidx, 0.0, 0.0), 
                                                rd, 
                                                vec3(1.95, bh, 0.45), 
                                                bn);
                    if (box.x > 0.0 && box.x < mint) {
                        mint = box.x;
                        minn = bn;
                        edge = box.z;
                        id = BRICK;
                    }  
                }
                
                //ROW 2
                r = rand(vec2(xidx, 2.0));
                bh = 1.0 - r * 1.2;
                if (bh > 0.0) {
                    vec3 box = boxIntersection(ro - vec3(xidx, 0.0, 2.0), 
                                                rd, 
                                                vec3(1.95, bh, 0.45), 
                                                bn);
                    if (box.x > 0.0 && box.x < mint) {
                        mint = box.x;
                        minn = bn;
                        edge = box.z;
                        id = BRICK;
                    }  
                }
            }
            //*/
            
            return Scene(mint, id, minn, edge);
        }

        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
        
            vec3 lookAt = vec3(T, 0.0, 0.0);
            lp = lookAt + vec3(4.0, 4.0, -2.0);
            ro = lookAt + vec3(3.0 - sin(T * 0.1) * 2.0, 4.0, -4.0);
            
            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }


        void main() {

            vec3 pc = vec3(0.0);
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;

            vec3 ro, rd;
            setupCamera(ro, rd);

            Scene scene = drawScene(ro, rd);
            if (scene.t > 0.0 && scene.t < FAR) {
                
                vec3 oc = colourScene(ro, rd, scene);
                
                if (scene.id == 1.0) {
                    vec3 rp = ro + rd * (scene.t - EPS);
                    vec3 rrd = reflect(rd, scene.n);
                    Scene reflectedScene = drawScene(rp, rrd);
        
                    if (reflectedScene.t > 0.0 && reflectedScene.t < FAR) {
                        vec3 rc = colourScene(ro, rd, reflectedScene);
                        float atten = 1.0 / (1.0 + reflectedScene.t * reflectedScene.t * 2.2);
                        oc += rc * atten;
                    }
                }
                
                pc = oc;
            }

            vec3 bc = texture2D(u_texture1, uv).xyz;
            
            gl_FragColor = vec4(pc + bc, 1.0);
        }
    `;
    
    return fsSource;
};