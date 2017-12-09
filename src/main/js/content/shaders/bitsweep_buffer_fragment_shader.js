'use strict';

function fragmentSource() {
    
    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif

        uniform vec2 u_resolution;
        uniform float u_time;

        #define T u_time * 4.0
        #define PI 3.14159265359
        #define FAR 100.0 
        #define EPS 0.001
        #define STEP_SIZE 4.0
        #define FLOOR 1.0
        #define BRICK 2.0
        #define TOWER 3.0
        #define LIGHT1 4.0
        #define LIGHT2 5.0
        #define LIGHT3 6.0

        float SX1 = 0.0;
        float SX2 = 0.0;
        float TX = 0.0;

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}

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
            
            if (scene.id == LIGHT1) {
                if (rp.x < SX1) {
                    pc = vec3(0.0, 1.0, 0.0);    
                }
            } else if (scene.id == LIGHT2) {
                if (rp.x < SX2) {
                    pc = vec3(0.0, 1.0, 0.0);    
                }
            } else if (scene.id == LIGHT3) {
                pc = vec3(0.0, 1.0, 0.0);    
            }
            
            return pc;
        }

        Scene drawScene(vec3 ro, vec3 rd) {
            
            float mint = FAR;
            vec3 minn = vec3(0.0);
            float id = 0.0;
            float edge = 0.0;
            
            SX1 = T + sin(T * 0.1) * 2.0;
            SX2 = T + cos(T * 0.2) * 3.0;
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
            
            vec3 bn = vec3(0.);
            vec3 bounds = boxIntersection(ro - vec3(T, 0.0, 1.0), rd, vec3(50.0, 1.3, 0.8), bn);
            if (bounds.x > 0.0) {

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
                    vec3 box = boxIntersection(ro - vec3(xidx, 0.0, 0.0), 
                                                rd, 
                                                vec3(2.0, max(bh + 0.05, 0.05), 0.05), 
                                                bn);
                    if (box.x > 0.0 && box.x < mint) {
                        mint = box.x;
                        minn = bn;
                        edge = box.z;
                        id = LIGHT1;
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
                    box = boxIntersection(ro - vec3(xidx, 0.0, 2.0), 
                                                rd, 
                                                vec3(2.0, max(bh + 0.05, 0.05), 0.05), 
                                                bn);
                    if (box.x > 0.0 && box.x < mint) {
                        mint = box.x;
                        minn = bn;
                        edge = box.z;
                        id = LIGHT2;
                    }
                }
            }
                        
            return Scene(mint, id, minn, edge);
        }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

            vec3 lookAt = vec3(T, 0.0, 0.0);
            ro = lookAt + vec3(3.0 - sin(T * 0.1) * 2.0, 4.0, -4.0);
        
            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void main() {

            vec3 pc = vec3(0.0);

            vec3 ro, rd;
            setupCamera(ro, rd);
            
            Scene scene = drawScene(ro, rd);
            if (scene.t > 0.0 && scene.t < FAR) {
                
                vec3 oc = colourScene(ro, rd, scene);
                
                vec3 rp = ro + rd * (scene.t - EPS);
                vec3 rrd = reflect(rd, scene.n);
                Scene reflectedScene = drawScene(rp, rrd);
                if (reflectedScene.t > 0.0 && reflectedScene.t < FAR) {
                    vec3 rc = colourScene(rp, rrd, reflectedScene);
                    float atten = 1.0 / (1.0 + reflectedScene.t * reflectedScene.t * 6.2);
                    oc += rc * atten;
                }
                
                pc = oc;
                pc /= scene.t * 0.1; 
            }
            
            gl_FragColor = vec4(pc, 1.0);
        }
    `;
    
    return fsSource;
};
    
module.exports = {
    fragmentSource: fragmentSource
};