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

        uniform sampler2D u_texture1;                
        uniform sampler2D u_texture2;                
        
        #define EPS 0.005
        #define FAR 40.0 
        #define PI 3.14159265359
        #define T u_time
        #define NTILES 12.0

        struct Scene {
            float t;
            vec2 walluv;
            vec2 cellid;
            float edge1;
        };

        vec3 lp = vec3(0.0, 0.0, 4.0); //light position

        //compact 2 axis rotation
        mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
        //random generator between 0 and 1
        float rand(vec2 p) {return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);}
        
        vec3 path(float t) {
              float a = sin(t * PI / 16.0 + 1.5707963 * 1.0);
              float b = cos(t * PI / 16.0);
              return vec3(a * 2.0, b * a, t);    
        }

        /* TEXTURES START */

        //glyph panels
        float glyphpanel(float uvz, float uva, float endtype) {
            vec2 cuv = vec2(uvz, uva) * 15.0 - 7.5;
            vec2 cmx = mod(cuv, 1.0) - 0.5;
            float lc = length(cmx);
            float glyph = smoothstep(0.4, 0.3, lc); 
            float r1 = rand(floor(vec2(cuv.x + floor(T * 8.0), cuv.y))) > 0.5 ? 1.0 : 0.0;
            glyph *= step(cuv.y, 2.0) * step(-3.0, cuv.y) * r1;
            float gy = mod(cuv.x + floor(T * 8.0), 15.0);
            glyph *= step(1.0, gy) * step(gy, 7.0) + step(9.0, gy) * step(gy, 14.0);
            float l1 = step(3.0, cuv.y) * step(cuv.y, 3.5);
            float l2 = step(cuv.y, -4.0) * step(-4.5, cuv.y);
            float l3 = 0.0;
            float fuvz = 15.0 * mod(uvz, 1.0);
            if (endtype == 2.0) {
                glyph *= step(3.0, fuvz);
                l1 *= step(1.0, fuvz);
                l2 *= step(1.0, fuvz);
                l3 = step(fuvz, 1.5) * step(1.0, fuvz) * step(uva, 0.7) * step(0.2, uva);
            } else if (endtype == 0.0) {
                glyph *= step(fuvz, 12.0);
                l1 *= step(fuvz, 14.0);
                l2 *= step(fuvz, 14.0);
                l3 = step(13.5, fuvz) * step(fuvz, 14.0) * step(uva, 0.7) * step(0.2, uva);
            }
            return glyph + l1 + l2 + l3;
        }

        //draw random ticking dots in cell
        float glyphcell(float uvz, float uva, vec2 cellid) {
            vec2 cuv = vec2(uvz, uva) * 10.0 - 5.0;
            vec2 cmx = mod(cuv, 1.0) - 0.5;
            float lc = length(cmx);
            float r1 = rand(floor(vec2(cuv.x + cellid.y, cuv.y + cellid.x + floor(T)))) > 0.7 ? 1.0 : 0.0;
            float pc = smoothstep(0.4, 0.3, lc) * r1; 
            pc *= step(cuv.x, 4.0) * step(-4.0, cuv.x);
            pc *= step(cuv.y, 4.0) * step(-4.0, cuv.y);
            return pc;
        }
        
        float metercell(float uvz, float uva) {
            float st1 = clamp(sin(T * 8.0) * 0.5 + 0.5, 0.2, 1.0);
            float st2 = clamp(sin((T + 0.3) * 9.0) * 0.5 + 0.5, 0.2, 1.0);
            float st3 = clamp(sin((T + 1.2) * 8.5) * 0.5 + 0.5, 0.2, 1.0);
            float mz = mod(uvz, 0.08) > 0.03 ? 1.0 : 0.0;
            mz *= step(0.1, uvz) * step(uvz, 0.9);
            mz *= clamp(step(0.7, uvz), 0.3, 1.0);
            float m1 = mz * step(0.1, uva) * step(uva, 0.3) * step(uvz, st1);
            float m2 = mz * step(0.4, uva) * step(uva, 0.6) * step(uvz, st2);
            float m3 = mz * step(0.7, uva) * step(uva, 0.9) * step(uvz, st3);
            return m1 + m2 + m3;
        }

        float slidercell(float uvz, float uva) {
            float tm = clamp(sin(T * 0.5), 0.3, 0.9);
            float bm = 1.0 - tm;
            float z = mod(uvz, 0.1);
            float tz = z > 0.07 && z < 0.09 ? 1.0 : 0.0;
            float t = step(tm - 0.3, uva) * step(uva, tm) * step(0.1, uvz) * step(uvz, 0.9) * tz;
            float bz = z > 0.01 && z < 0.03 ? 1.0 : 0.0;
            float b = step(bm, uva) * step(uva, bm + 0.3) * step(0.1, uvz) * step(uvz, 0.9) * bz;
            float y = mod(uva, 0.1);
            float my = y > 0.05 ? 1.0 : 0.0;    
            return (t + b) * my;
        }

        float gridcell(float uvz, float uva) {
            vec2 cuv = vec2(uvz, uva) * 15.0;
            float mz = mod(cuv.y, 1.0);
            float mzg =  mz > 0.4 && mz < 0.6 ? 1.0 : 0.0; 
            return step(1.0, cuv.x) * step(cuv.x, 14.0) * step(1.0, cuv.y) * step(cuv.y, 14.0) * mzg;
        }

        float cellborder(float uvz, float uva) {
            float border = step(0.05, uvz) * step(uvz, 0.07) * step(0.05, uva) * step(uva, 0.95);
            border += step(0.93, uvz) * step(uvz, 0.95) * step(0.05, uva) * step(uva, 0.95);
            border += step(0.05, uva) * step(uva, 0.07) * step(0.05, uvz) * step(uvz, 0.95);
            border += step(0.93, uva) * step(uva, 0.95) * step(0.05, uvz) * step(uvz, 0.95);
            return border;
        }

        float ringedge(float uvz, float uva) {
            return step(uvz, 0.06) + step(0.94, uvz);
        }

        float ringcore(float uvz, float uva) {
            float mz = mod(uva, 0.125) > 0.06 ? 1.0 : 0.0;
            float core = step(sin(T) * 7.5, uva) * mz;
            core *= step(0.2, uvz) * step(uvz, 0.3) + step(0.7, uvz) * step(uvz, 0.8);
            float corea = step(sin(T) * -7.5, uva) * mz;
            corea *= step(0.4, uvz) * step(uvz, 0.6);
            return core + corea;
        }

        /* TEXTURES END */

        Scene map(vec3 rp) {

            rp.xy -= path(rp.z).xy;      

            float tun = 1.7 - length(rp.xy);
            float edge1 = 0.0;

            vec3 q1 = rp; 
            vec3 q2 = rp;
            vec3 q3 = rp;
            
            //polar coordinates
            float a = atan(q1.y, q1.x) / 6.2831853;
            float ia1 = floor(a * NTILES) / NTILES * 6.2831853;

            vec2 cellid = vec2(floor(q1.z + 0.5), a);

            q1.xy *= rot(ia1);
            q1.z = mod(q1.z, 1.0) - .5;
            q1 = abs(q1);

            /*
            q2.z = mod(q2.z, 140.0) - 39.0;
            q2.z = abs(q2.z);
            float rlFrame = q2.z - 0.5;
            rlFrame = max(rlFrame, tun - 0.5);
            float rlCutout = q2.z - 0.4;
            rlCutout = max(rlCutout, tun - 0.6);
            rlFrame = max(rlFrame, -rlCutout);

            //tun = min(tun, rlFrame);
            */



            edge1 = -min(q1.y - 0.03, q1.z - 0.03);

            return Scene(tun, rp.yz, cellid, edge1);
        }

        //finds gradients across small deltas on each axis
        vec3 normal(vec3 rp) {
            vec2 e = vec2(EPS, 0);
            float d1 = map(rp + e.xyy).t, d2 = map(rp - e.xyy).t;
            float d3 = map(rp + e.yxy).t, d4 = map(rp - e.yxy).t;
            float d5 = map(rp + e.yyx).t, d6 = map(rp - e.yyx).t;
            float d = map(rp).t * 2.0;
            return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
        }

        Scene march(vec3 ro, vec3 rd) {
            
            float t = 0.0;
            vec2 walluv = vec2(0.0);
            vec2 cellid = vec2(0.0);
            float edge1 = 0.0;

            for (int i = 0; i < 96; i++) {
                vec3 rp = ro + rd * t;
                Scene ns = map(rp);
                if (ns.t < EPS  * (t * 0.25 + 1.0) || t > FAR) {
                    walluv = ns.walluv;
                    cellid = ns.cellid;
                    edge1 = ns.edge1;
                    break;
                }

                t += ns.t;
            }

            return Scene(t, walluv, cellid, edge1);
        }

        Scene relaxedMarch(vec3 ro, vec3 rd) {
            
            float omega = 1.3;
            float t = EPS;
            float candidate_error = FAR;
            float candidate_t = EPS;
            float previousRadius = 0.0;
            float stepLength = 0.0;
            float pixelRadius = EPS;
            float functionSign = map(ro).t < 0.0 ? -1.0 : 1.0;

            vec2 walluv = vec2(0.0);
            vec2 cellid = vec2(0.0);
            float edge1 = 0.0;

            for (int i = 0; i < 100; ++i) {
                Scene scene = map(ro + rd * t);
                float signedRadius = functionSign * scene.t;
                float radius = abs(signedRadius);
                
                bool sorFail = omega > 1.0 && (radius + previousRadius) < stepLength;
                if (sorFail) {
                    stepLength -= omega * stepLength;
                    omega = 1.0;
                } else {
                    stepLength = signedRadius * omega;
                }
                previousRadius = radius;
                float error = radius / t;
                if (!sorFail && error < candidate_error) {
                    candidate_t = t;
                    candidate_error = error;
                }
                
                if (!sorFail && error < pixelRadius || t > FAR) {
                    walluv = scene.walluv;
                    cellid = scene.cellid;
                    edge1 = scene.edge1;
                    break;
                }

                t += stepLength;
            }

            if (t > FAR || candidate_error > pixelRadius) candidate_t = FAR;

            return Scene(candidate_t, walluv, cellid, edge1);
        }


        vec3 colour(Scene scene) {

            vec3 pc = vec3(0.0);

            vec2 tileid = vec2(scene.cellid.x, floor((scene.cellid.y) * NTILES));
            float r = rand(tileid);
            float r2 = rand(vec2(tileid.y, tileid.x));
            r2 = r2 > 0.5 && r2 < 0.6 ? 1.0 : 0.0;
            vec3 bc = rand(vec2(r, r2)) > 0.5 ? vec3(1.0) : vec3(0.0, 1.0, 0.0);
            
            //edges
            pc = max(scene.edge1, 0.0) * vec3(0.0, 1.0, 0.0);
            
            //cells
            if (r > 0.2 && r < 0.3) {
                pc += glyphcell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES), tileid) * vec3(0.0, 1.0, 0.0);
            } else if (r > 0.4 && r < 0.5) {
                pc += slidercell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES)) * bc;
            } else if (r > 0.7 && r < 0.75) {
                pc += gridcell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES)) * vec3(1.0, 1.0, 1.0);
            } else if (r > 0.6 && r < 0.65) {
                pc += glyphcell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES), tileid) * vec3(0.0, 1.0, 0.0);
            }                
            //*/

            //cell borders
            pc += cellborder(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES)) * bc * r2;
            
            if (mod(tileid.x, 11.0) >= 10.0) {
                if (r > 0.3 && r < 0.4) {
                    pc = metercell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES)) * vec3(1.0, 1.0, 1.0);
                }
            }

            //glyph panels
            float gs = 0.0;
            if (tileid.y == 1.0) {
                float gpm = mod(scene.walluv.y - 0.5, 18.0);
                if (gpm < 1.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm < 2.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                } else if (gpm > 7.0 && gpm < 8.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm > 8.0 && gpm < 9.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 9.0 && gpm < 10.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 10.0 && gpm < 11.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                }
                pc = vec3(1.0) * gs;
            }
            if (tileid.y == 4.0) {
                float gpm = mod(scene.walluv.y - 0.5, 25.0);
                if (gpm > 3.0 && gpm < 4.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm > 4.0 && gpm < 5.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 5.0 && gpm < 6.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                } else if (gpm > 11.0 && gpm < 12.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm > 12.0 && gpm < 13.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 13.0 && gpm < 14.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 14.0 && gpm < 15.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 15.0 && gpm < 16.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                }
                pc = vec3(1.0) * gs;
            }
            if (tileid.y == -4.0) {
                float gpm = mod(scene.walluv.y - 0.5, 40.0);
                if (gpm > 7.0 && gpm < 8.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm > 8.0 && gpm < 9.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 9.0 && gpm < 10.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                } else if (gpm > 20.0 && gpm < 21.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm > 21.0 && gpm < 22.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                } else if (gpm > 31.0 && gpm < 32.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 2.0);
                } else if (gpm > 32.0 && gpm < 33.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 33.0 && gpm < 34.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 34.0 && gpm < 35.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 1.0);
                } else if (gpm > 35.0 && gpm < 36.0) {
                    gs = glyphpanel(scene.walluv.y - 0.5, fract(scene.cellid.y * NTILES), 0.0);
                }
                pc = vec3(1.0) * gs;
            } 
            //*/

            //rings
            if (mod(tileid.x, 60.0) >= 59.0) {
                pc = ringedge(fract(scene.walluv.y - 0.5), scene.cellid.y * (NTILES - 1.0)) * vec3(1.0);
                pc += ringcore(fract(scene.walluv.y - 0.5), scene.cellid.y * (NTILES - 1.0)) * vec3(0.0, 1.0, 0.0);
            } 
            if (mod(tileid.x - 25.0, 80.0) >= 79.0) {
                pc = ringedge(fract(scene.walluv.y - 0.5), scene.cellid.y * (NTILES - 1.0)) * vec3(1.0);
                pc += glyphcell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES), tileid) * vec3(0.0, 1.0, 0.0);
            } 
            if (mod(tileid.x -40.0, 100.0) >= 99.0) {
                pc = ringedge(fract(scene.walluv.y - 0.5), scene.cellid.y * (NTILES - 1.0)) * vec3(1.0);
                pc += slidercell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES)) * vec3(0.0, 1.0, 0.0);
            } 
            if (mod(tileid.x -40.0, 140.0) >= 139.0) {
                pc = ringedge(fract(scene.walluv.y - 0.5), scene.cellid.y * (NTILES - 1.0)) * vec3(1.0);
                pc += metercell(fract(scene.walluv.y - 0.5), fract(scene.cellid.y * NTILES)) * vec3(1.0);
            } 
            //*/

            return pc;
        }

        //standard right hand camera setup
        void setupCamera(inout vec3 ro, inout vec3 rd) {
            
            //Coordinate system
            vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

            float ct = T * 6.0;

            vec3 lookAt = vec3(0.0, 0.0, ct);
            lp = lookAt + vec3(0.0, 0.0, 3.0);
            ro = lookAt + vec3(0.0, 0.0, -5.0);
            
            lookAt.xy += path(lookAt.z).xy;
            ro.xy += path(ro.z).xy;
            lp.xy += path(lp.z).xy;

            float FOV = PI / 3.0;
            vec3 forward = normalize(lookAt - ro);
            vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
            vec3 up = cross(forward, right);
        
            rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
        }

        void main() {

            vec3 pc = vec3(0.0); //pixel colour
            float mint = FAR;

            vec3 ro, rd; //ray origin and direction
            setupCamera(ro, rd);

            
            
            //Scene scene = march(ro, rd);
            Scene scene = relaxedMarch(ro, rd);
            
            if (scene.t > 0.0 && scene.t < FAR) {

               // vec3 rp = ro + rd * scene.t;
                //vec3 n = normal(rp);
                //vec3 ld = normalize(lp - rp);
                //float diff = max(dot(ld, n), 0.2);

                pc = colour(scene);

            }
            //*/

            vec4 sleeve = texture2D(u_texture1, gl_FragCoord.xy / u_resolution);
            
            
            if (sleeve.w > 0.0) {
                if (sleeve.w * FAR < scene.t) {
                    pc = sleeve.xyz;
                } else {
                    pc = mix(pc, sleeve.xyz, (1.0 - sleeve.w) * 0.3);
                }
            }
            //*/

            //pc = sleeve.xyz;

            gl_FragColor = vec4(sqrt(clamp(pc, 0.0, 1.0)), 1.0);
        }
    `;

    return fsSource;
};

module.exports = {
    fragmentSource: fragmentSource
};