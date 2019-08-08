'use strict';

export function fragmentSource() {
    
    const fsSource = `

    precision mediump float;

    uniform vec2 u_resolution;
    uniform float u_fov;
    uniform float u_far;
    uniform vec3 u_light_position;
    uniform vec3 u_camera_position;
    uniform vec3 u_target;
    uniform float u_y_scale;

    #define PI 3.14159265359
    #define PI2 6.2831852718

    //compact 2 axis rotation
    mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}

    //shamelessly adapted from code by Shane and IQ
    //https://www.shadertoy.com/view/lslfRN

    // vec3 to float hash.
    float hash31(vec3 p) {return fract(sin(dot(p, vec3(157, 113, 7))) * 45758.5453);}
    
    // Non-standard vec3-to-vec3 hash function.
    vec3 hash33(vec3 p) {     
        float n = sin(dot(p, vec3(7, 157, 113)));    
        return fract(vec3(2097152, 262144, 32768) * n); 
    }

    // Compact, self-contained version of IQ's 3D value noise function. I put this together, so be 
    // careful how much you trust it. :D
    float n3D(vec3 p) {
        
        const vec3 s = vec3(7, 157, 113);
        vec3 ip = floor(p); p -= ip; 
        vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);
        p = p * p * (3.0 - 2.0 * p); //p *= p*p*(p*(p * 6. - 15.) + 10.);
        h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);
        h.xy = mix(h.xz, h.yw, p.y);
        return mix(h.x, h.y, p.z); // Range: [0, 1].
    }

    float n2D(vec2 p) {
        vec2 f = fract(p); 
        p -= f; 
        f *= f * (3.0 - f * 2.0);          
        return dot(mat2(fract(sin(vec4(0, 41, 289, 330) + dot(p, vec2(41, 289))) * 43758.5453))*
                    vec2(1. - f.y, f.y), vec2(1. - f.x, f.x));
    }

    // Simple fBm to produce some clouds.
    float fbm(in vec2 p){   
        // Four layers of 3D noise.
        return 0.5333 * n2D(p) + 0.2667 * n2D(p * 2.02) + 0.1333 * n2D(p * 4.03) + 0.0667 * n2D(p * 8.03);
    }

    // Distance function.
    float fmap(vec3 p) {
        // Three layers of noise. More would be nicer.
        p *= vec3(1, 4, 1) / 400.0;
        return n3D(p) * 0.57 + n3D(p * 4.0) * 0.28 + n3D(p * 8.0) * 0.15;
    }

    // Used in one of my volumetric examples. With only four layers, it's kind of going to waste
    // here. I might replace it with something more streamlined later.
    vec4 cloudLayers(vec3 ro, vec3 rd, vec3 lp, float far) {

        // The ray is effectively marching through discontinuous slices of noise, so at certain
        // angles, you can see the separation. A bit of randomization can mask that, to a degree.
        // At the end of the day, it's not a perfect process. Note, the ray is deliberately left 
        // unnormalized... if that's a word.
        //
        // Randomizing the direction.
        rd = (rd + (hash33(rd.zyx) * 0.004 - 0.002)); 
        // Randomizing the length also. 
        rd *= (1.0 + fract(sin(dot(vec3(7, 157, 113), rd.zyx)) * 43758.5453) * 0.04 - 0.02); 
    
        // Local density, total density, and weighting factor.
        float ld = 0.0, td = 0.0, w = 0.0;
    
        // Closest surface distance, and total ray distance travelled.
        float d = 1.0, t = 0.0;
        
        // Distance threshold. Higher numbers give thicker clouds, but fill up the screen too much.    
        const float h = 0.5;
    
        // Initializing the scene color to black, and declaring the surface position vector.
        vec3 col = vec3(0), sp;
        
        vec4 d4 = vec4(1, 0, 0, 0);

        // Particle surface normal.
        //
        // Here's my hacky reasoning. I'd imagine you're going to hit the particle front on, so the normal
        // would just be the opposite of the unit direction ray. However particles are particles, so there'd
        // be some randomness attached... Yeah, I'm not buying it either. :)
        vec3 sn = normalize(hash33(rd.yxz) * 0.03 - rd);

        // Raymarching loop.
        for (int i = 0; i < 4; i++) {

            // Loop break conditions. Seems to work, but let me
            // know if I've overlooked something.
            if (td > 1.0 || t > far) break;

            sp = ro + rd * t; // Current ray position.
            d = fmap(sp); // Closest distance to the surface... particle.

            // If we get within a certain distance, "h," of the surface, accumulate some surface values.
            // The "step" function is a branchless way to do an if statement, in case you're wondering.
            //
            // Values further away have less influence on the total. When you accumulate layers, you'll
            // usually need some kind of weighting algorithm based on some identifying factor - in this
            // case, it's distance. This is one of many ways to do it. In fact, you'll see variations on 
            // the following lines all over the place.
            //
            ld = (h - d) * step(d, h); 
            w = (1.0 - td) * ld;   

            // Use the weighting factor to accumulate density. How you do this is up to you. 
            //td += w*w*8. + 1./60.; //w*w*5. + 1./50.;
            td += w * 0.5 + 1.0 / 65.0; // Looks cleaner, but a little washed out.
    
            // Point light calculations.
            vec3 ld = lp - sp; // Direction vector from the surface to the light position.
            float lDist = max(length(ld), 0.001); // Distance from the surface to the light.
            ld /= lDist; // Normalizing the directional light vector.

            // Using the light distance to perform some falloff.
            float atten = 100.0 / (1.0 + lDist * 0.005 + lDist * lDist * 0.00005);
    
            // Ok, these don't entirely correlate with tracing through transparent particles,
            // but they add a little anglular based highlighting in order to fake proper lighting...
            // if that makes any sense. I wouldn't be surprised if the specular term isn't needed,
            // or could be taken outside the loop.
            float diff = max(dot(sn, ld), 0.0);
            float spec = pow(max(dot(reflect(-ld, sn), -rd ), 0.0), 4.0);

            // Accumulating the color. Note that I'm only adding a scalar value, in this case,
            // but you can add color combinations.
            //col += w*(1. + diff*.5 + spec*.5)*atten;
     
            // Try this instead, to see what it looks like without the fake contrasting. Obviously,
            // much faster.
            col += w * (diff + vec3(1, 0.75, .5) * spec + 0.5) * atten;

            // Optional extra: Color-based jittering. Roughens up the grey clouds that hit the camera lens.
            //col += (fract(rnd*289. + t*41.)-.5)*0.02;;
        
            // Enforce minimum stepsize. This is probably the most important part of the procedure.
            // It reminds me a little of of the soft shadows routine.
            t += max(d4.x * 0.5, 0.125) * 500.0; //* 0.75
            // t += 0.2; // t += d*0.5;// These also work, but don't seem as efficient.
        }

        return vec4(col, t);
    }

    vec3 skyColour(vec3 ro, vec3 rd, vec3 lp, float far) {

        float sun = max(dot(rd, normalize(lp - ro)), 0.0); // Sun strength.
        float horiz = pow(1.0 - max(rd.y, 0.0), 3.0) * 0.25; // Horizon strength.
        
        // The blueish sky color. Tinging the sky redish around the sun. 		
        vec3 col = mix(vec3(0.25, 0.5, 1.0) * 0.8, vec3(0.8, 0.75, 0.7), sun * 0.5);
        // Mixing in the sun color near the horizon.
        col = mix(col, vec3(1.0, 0.5, 0.25), horiz);

        // Sun. I can thank IQ for this tidbit. Producing the sun with three
        // layers, rather than just the one. Much better.
        col += 0.25 * vec3(1.0, 0.7, 0.4) * pow(sun, 5.0);
        col += 0.25 * vec3(1.0, 0.8, 0.6) * pow(sun, 64.0);
        col += 0.15 * vec3(1.0, 0.9, 0.7) * max(pow(sun, 512.0), 0.25);

        // Add a touch of speckle. For better or worse, I find it breaks the smooth gradient up a little.
        col = clamp(col + hash31(rd) * 0.04 - 0.02, 0.0, 1.0);

        //return col; // Clear sky day. Much easier. :)
        
        // Clouds. Render some 3D clouds far off in the distance. I've made them sparse and wispy,
        // since we're in the desert, and all that.
        
        // Mapping some 2D clouds to a plane to save some calculations. Raytrace to a plane above, which
        // is pretty simple, but it's good to have Dave's, IQ's, etc, code to refer to as backup.
        
        // Give the direction ray a bit of concavity for some fake global curvature - My own dodgy addition. :)
        //rd = normalize(vec3(rd.xy, sqrt(rd.z*rd.z + dot(rd.xy, rd.xy)*.1) ));
     
        // If we haven't hit anything and are above the horizon point (there for completeness), render the sky.
        
        // Raytrace to a plane above the scene.
        float tt = (1000.0 - ro.y) / (rd.y + 0.2);

        if (tt > 0.0) {            
            // Trace out a very small number of layers. In fact, there are so few layer that the following
            // is almost pointless, but I've left it in.
            vec4 cl = cloudLayers(ro + rd * tt, 
                                  rd, 
                                  lp, 
                                  far * 1.0);
            vec3 clouds = cl.xyz;
    
            // Mix in the clouds.
            col = mix(col, vec3(1.0), clouds); // *clamp(rd.y*4. + .0, 0., 1.)
        }
    
        return col;
    }

    // Pretty standard way to make a sky. 
    vec3 getSky(in vec3 ro, in vec3 rd, vec3 lp) {
    
        float sun = max(dot(rd, normalize(lp - ro)), 0.0); // Sun strength.
        vec3 col = mix(vec3(0.6, 0.9, 1.0).zyx, vec3(0.62, 0.68, 1.0).zyx, rd.y * 0.5 + 0.5) * 1.25 * 0.5;
        col += 0.25 * vec3(1.0, 0.7, 0.4) * pow(sun, 5.0);
        col += 0.25 * vec3(1.0, 0.8, 0.6) * pow(sun, 64.0);
        col += 0.15 * vec3(1.0, 0.9, 0.7) * max(pow(sun, 512.0), 0.25);
        col = clamp(col + hash31(rd) * 0.04 - 0.02, 0.0, 1.0);
        float t = (5000.0 - ro.y) / rd.y;
        vec2 uv = (ro + t * rd).xz * 5.05;
        if (t > 0.0) col = mix(col, vec3(1, 0.9, 0.8), 0.35 * smoothstep(0.4, 1.0, fbm(0.0005 * uv) * clamp(rd.y * 5.0, 0.0, 1.0)));
        return col;
    }



    //standard right hand camera setup
    void setupCamera(inout vec3 rd) {
        
        //Coordinate system
        vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;

        float FOV = u_fov / PI2;
        vec3 forward = normalize(u_target - u_camera_position);
        vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
        vec3 up = cross(forward, right) * u_y_scale;
    
        rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
    }

    void main(void) {

        vec3 ro = u_camera_position;
        vec3 rd = vec3(0.0);
        vec3 lightPosition = u_light_position;
        //lightPosition.x *= -4.0;
        setupCamera(rd);
        vec3 sc = getSky(ro, rd, lightPosition);
        //vec3 sc = skyColour(ro, rd, lightPosition, u_far);
        gl_FragColor = vec4(sc, 1.0);          
    }
    
    `;
    
    return fsSource;
};
