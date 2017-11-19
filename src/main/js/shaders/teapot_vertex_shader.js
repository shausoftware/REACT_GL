'use strict';

function vertexSource() {

    const vsSource = `

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;
    uniform mat4 u_normals_matrix;
    uniform mat4 u_sm_model_view_matrix;
    uniform mat4 u_sm_projection_matrix;
    uniform vec3 u_light_position;
    uniform vec3 u_colour;
    
    // Used to normalize our coordinates from clip space to (0 - 1)
    // so that we can access the corresponding point in our depth color texture
    const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
    
    varying vec2 v_depth_uv;
    varying vec4 v_shadow_position;
    varying vec3 v_colour;
    varying vec3 v_normal;
    
    void main(void) {

        vec3 pos = (u_model_view_matrix * vec4(a_position, 1.0)).xyz;
        vec3 ld = normalize(u_light_position - pos);
        v_normal = (u_normals_matrix * vec4(a_normal, 1.0)).xyz;
        vec3 e = -normalize(pos);
        vec3 h =  normalize(ld + e);
        float diff = max(dot(ld, v_normal), 0.2);
        float spec = pow(max(dot(v_normal, h), 0.0), 22.0);
      
        v_colour = u_colour * diff + vec3(1.0) * spec;        

        gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_position, 1.0);
        v_shadow_position = texUnitConverter * u_sm_projection_matrix * u_sm_model_view_matrix * vec4(a_position, 1.0);
    }

    `;

    return vsSource;
}

module.exports = {
    vertexSource: vertexSource
};