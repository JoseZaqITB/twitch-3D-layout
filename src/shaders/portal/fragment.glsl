varying vec2 vUv;

uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;


#include "../includes/perlinNoise3D.glsl"

void main() {

    // displace uv
    vec2 displacedUv = vUv + cnoise(vec3(vUv * 5.0, uTime * 0.1));
    // perlin noise
    float noise = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));

    float strength = noise + step(-0.2, noise) * 0.8;

    strength = clamp(strength, 0.0, 1.0);
    // mix colors
    vec3 color = mix(uColorStart, uColorEnd, strength);

    // alpha borders
    float alpha = distance(vUv, vec2(0.5)) * 2.0;
    alpha = pow(alpha, 8.0);
    alpha *= 1.0 - noise;
    alpha = 1.0 - alpha * 2.0;
    // final color
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}