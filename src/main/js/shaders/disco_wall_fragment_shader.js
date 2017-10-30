'use strict';

function fragmentSource() {

    const fsSource = `

        #ifdef GL_FRAGMENT_PRECISION_HIGH
	        precision highp float;
        #else
            precision mediump float;
        #endif

        varying vec2 v_resolution;
        varying float v_time;

        #define EPS 0.005
        #define FAR 30.0 
        #define PI 3.14159265359
        #define T v_time
        #define ROWS 3
        #define COLS 7

        struct Scene {
            vec3 rp;
            vec3 pc;
            float id;
            vec3 bc;
            vec3 n;
            float t;
        };

        struct Hit {
            float tN;
            float tF;
            vec3 nN;
        };        

        vec3 lp = vec3(4.0, 5.0, -2.0); //light position
        vec3 boxes[24];
        vec4 sphere1 = vec4(0.0);
        vec4 sphere2 = vec4(0.0);

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        void setup() {

            sphere1 = vec4(0.7, -2.3, 0.0, 0.2);
            sphere2 = vec4(-0.7, -2.3, 0.0, 0.2);            
            sphere1.xz *= rot(T); 
            sphere2.xz *= rot(T); 
            sphere1.xyz += vec3(0.0, 0.0, -3.0);
            sphere2.xyz += vec3(0.0, 0.0, -3.0);

            for (int y = 0; y < ROWS; y++) {
                for (int x = 0; x < COLS; x++) {
                    float index = float(y * COLS + x);
                    vec3 box = vec3(3.5 - float(x), float(y), sin(T + index) * 0.2);
                    boxes[y * COLS + x] = box;
                }
            }
        }

        // slightly modified version of IQs box function examples
        // http://www.iquilezles.org/www/articles/boxfunctions/boxfunctions.htm
        Hit boxIntersection(vec3 ro, vec3 rd, vec3 boxSize) {
            
            Hit box = Hit(0.0, 0.0, vec3(0.0)); //miss

            vec3 m = 1.0 / rd;
            vec3 n = m * ro;
            vec3 k = abs(m) * boxSize;

            vec3 t1 = -n - k;
            vec3 t2 = -n + k;

            float tN = max(max(t1.x, t1.y), t1.z); //distance to near face
            float tF = min(min(t2.x, t2.y), t2.z); //distance to far face

            if (tN > tF || tF < 0.0) return box;

            vec3 nN = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz); //near face normal
            
            return Hit(tN, tF, nN);
        }

        // Slightly modified version of IQs sphere functions
        // Gathers distance and normal values from front and back face of intersection
        // http://www.iquilezles.org/www/articles/spherefunctions/spherefunctions.htm
        Hit sphIntersect(vec3 ro, vec3 rd, vec4 sph) {
            vec3 oc = ro - sph.xyz;
            float b = dot(oc, rd);
            float c = dot(oc, oc) - sph.w * sph.w;
            float h = b * b - c;
            if (h < 0.0) return Hit(0.0, 0.0, vec3(0.0)); //miss;
            h = sqrt(h);
            float tN = -b - h;
            float tF = -b + h;
            vec3 nN = normalize((ro + rd * tN) - sph.xyz);
            return Hit(tN, tF, nN);
        }

        float sphSoftShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
            vec3 oc = ro - sph.xyz;
            float r = sph.w*sph.w;
            float b = dot( oc, rd );
            float c = dot( oc, oc ) - r;
            float h = b*b - c;
            float d = -sph.w + sqrt(max(0.0, r - h));
            float t = -b     - sqrt(max(0.0, h));
            return (t < 0.0) ? 1.0 : smoothstep(0.0, 1.0, k * d / t);
        }

        float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
            return dot(o - ro, n) / dot(rd, n);
        }

        Hit drawBoxes(vec3 ro, vec3 rd, inout vec3 bc) {

            float tN = FAR;
            float tF = FAR;
            vec3 n = vec3(0.0);
            bc = vec3(-1.0);

            float r1 = rand(vec2(T)) * float(ROWS * COLS);

            for (int y = 0; y < ROWS; y++) {
                for (int x = 0; x < COLS; x++) {
                    float index = float(y * COLS + x);
                    vec3 box = boxes[y * COLS + x];
                    Hit bh = boxIntersection(ro + box, rd, vec3(0.48));
                    if (bh.tN > 0.0 && bh.tN < tN) {
                        tN = bh.tN;
                        tF = bh.tF;
                        n = bh.nN;
                        if (r1 > index && r1 < index + 1.0) {
                            bc = box;
                        } else {
                            bc = vec3(-1.0);
                        }
                    }
                }
            }

            return Hit(tN, tF, n);
        }

        vec4 drawSpheres(vec3 ro, vec3 rd) {

            float t = FAR;
            vec3 n = vec3(0.0);
            
            Hit hit1 = sphIntersect(ro, rd, sphere1);
            if (hit1.tN > 0.0 && hit1.tN < t) {
                t = hit1.tN;
                n = hit1.nN;
            }

            Hit hit2 = sphIntersect(ro, rd, sphere2);
            if (hit2.tN > 0.0 && hit2.tN < t) {
                t = hit2.tN;
                n = hit2.nN;
            }

            return vec4(n, t);
        }

        float sdBox(vec3 rp, vec3 b) {
            vec3 d = abs(rp) - b;
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

        vec3 march(vec3 ro, vec3 rd, vec3 bc, float maxt) {

            vec3 pc = vec3(0.0);
            float t = 0.0;

            for (int i = 0; i < 20; i++) {
                vec3 rp = ro + rd * t;
                float ns = map(rp);
                if (ns < EPS || t > maxt) break;
                float lt = length(rp + bc);

                pc += vec3(0.0, 1.0, 0.0) * exp(lt * -lt * 4.0) * 0.05;

                t += ns;
            }

            return pc;
        }

        vec3 vMarch(vec3 ro, vec3 rd, vec3 bc, float maxt) {

            vec3 pc = vec3(0.0);
            float t = 0.0;

            for (int i = 0; i < 30; i++) {
                vec3 rp = ro + rd * t;
                if (t > maxt) break;
                float lt = length(rp + bc);
                pc += vec3(0.0, 1.0, 0.0) * 1.0 / (1.0 + lt * lt * 10.0) * 0.05;
                t += 0.05;
            }
            
            return pc;
        }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - v_resolution.xy * 0.5) / v_resolution.y;

            vec3 lookAt = vec3(0.0, -2.0, 0.0);
            ro = lookAt + vec3(sin(T * 0.2) * 3.0, 1.0, -6.0);

            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        Scene drawScene(vec3 ro, vec3 rd) {

            vec3 rp = vec3(0.0);
            vec3 n = vec3(0.0);
            float id = 0.0;
            float mint = FAR;
            vec3 pc = vec3(0.0);
            vec3 bc = vec3(0.0);

            vec3 fo = vec3(0.0, -2.5, 0.0);
            vec3 fn = vec3(0.0, 1.0, 0.0);

            float ft = planeIntersection(ro, rd, fn, fo);

            if (ft > 0.0 && ft < FAR) {
                
                //floor
                mint = ft;
                id = 1.0;
                n = fn;

                rp = ro + rd * ft;
                vec3 ld = normalize(lp - rp);
                float lt = length(lp - rp);
                float diff = max(dot(ld, fn), 0.05);
                float spec = pow(max(dot(reflect(-ld, fn), -rd), 0.0), 16.0);
                float atten = 1.0 / (1.0 + lt * lt * 0.08); //light attenuation

                //shadows from balls
                float sh1 = sphSoftShadow(ro + rd * (ft - EPS), ld, sphere1, 16.0);
                float sh2 = sphSoftShadow(ro + rd * (ft - EPS), ld, sphere2, 16.0);
    
                pc = vec3(1.0) * diff * atten;
                pc += vec3(1.0) * spec;

                pc *= sh1 * sh2;
            }

            vec3 gbc = vec3(-1.0);
            Hit box = drawBoxes(ro, rd, gbc);
            if (box.tN > 0.0 && box.tN < mint) {
                
                //boxes
                mint = box.tN;
                id = 2.0;
                n = box.nN;

                rp = ro + rd * box.tN;
                vec3 ld = normalize(lp - rp);
                float lt = length(lp - rp);
                float diff = max(dot(ld, box.nN), 0.05);
                float spec = pow(max(dot(reflect(-ld, box.nN), -rd), 0.0), 16.0);
                float atten = 1.0 / (1.0 + lt * lt * 0.08); //light attenuation

                pc = vec3(0.0, 0.1, 0.0) * diff * atten;
                pc += vec3(1.0) * spec;

                if (gbc != vec3(-1.0)) {
                    //lit  cube
                    pc += vMarch(rp, rd, gbc, box.tF - box.tN) * 1.2;
                    bc = gbc;
                }
            }

            vec4 balls = drawSpheres(ro, rd);
            if (balls.w < mint) {

                //balls
                mint = balls.w;
                id = 3.0;
                n = balls.xyz;

                rp = ro + rd * balls.w;
                vec3 ld = normalize(lp - rp);
                float lt = length(lp - rp);
                float diff = max(dot(ld, balls.xyz), 0.05);
                float spec = pow(max(dot(reflect(-ld, balls.xyz), -rd), 0.0), 16.0);
                float atten = 1.0 / (1.0 + lt * lt * 0.08); //light attenuation

                pc = vec3(0.0, 0.1, 0.0) * diff * atten;
                pc += vec3(1.0) * spec;
            }

            return Scene(rp, pc, id, bc, n, mint);
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour

            setup();

            vec3 ro, rd;
            setupCamera(ro, rd);

            Scene scene = drawScene(ro, rd);

            if (scene.t > 0.0 && scene.t < FAR) {

                pc = scene.pc;
                
                vec3 ld = normalize(lp - scene.rp);
                float lt = length(lp - scene.rp);
    
                //reflections
                vec3 rrd = reflect(rd, scene.n);
                Scene reflScene = drawScene(ro + rd * (scene.t - EPS), rrd);
    
                float atten = 0.0;
                float sh3 = 1.0;
                if (scene.id == 1.0) {
    
                    //floor
                    atten = 1.0 / (1.0 + reflScene.t * reflScene.t * 4.0); //reflect attenuation
                    
                    //shadows from boxes
                    Scene shadScene = drawScene(ro + rd * (scene.t - EPS), ld);
                    if (shadScene.t < lt) {
                        sh3 = shadScene.t / lt;
                    }
    
                } else if (scene.id == 2.0) { 
                    
                    //wall
                    atten = clamp(1.0 / (1.0 + reflScene.t * reflScene.t * 10.0), 0.0, 0.2); //reflect attenuation
                
                } else if (scene.id == 3.0) {
                
                    //balls 
                    atten = 1.0 / (1.0 + reflScene.t * reflScene.t * 0.05); //reflect attenuation
                }
    
    
                pc = mix(pc, reflScene.pc, atten);
                pc *= sh3;                
            }

            float r1 = rand(vec2(T)) * float(ROWS * COLS);
            float y = floor(r1 / float(COLS));            
            float x = floor(r1) - y * float(COLS);
            vec3 box = vec3(3.5 - x, y, sin(T + floor(r1)) * 0.2);
            pc += march(ro, rd, box, scene.t);
            
            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};