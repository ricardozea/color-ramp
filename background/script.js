// JavaScript for the animated background will go here.
// Adapted from CodePen: https://codepen.io/vadymhimself/pen/zYGvroM

const particleVertex = `
  attribute float scale;
  uniform vec2 uMouse; // Added for mouse interaction
  uniform float uTime;
  uniform vec3 uMouseWorldPosition; // Mouse position in 3D world space
  varying vec3 vPosition;
  varying vec3 vFinalWorldPos; // Final animated world position of the particle

  void main() {
    vPosition = position; // Pass original position to fragment shader
    vec3 p = position;
    float s = scale;

    float time1 = uTime;
    float time2 = uTime * 1.5; // Second wave is 1.5x faster

    // --- Wave 1 (Randomized Multi-Directional) ---
    float freq1x = 0.07;
    float freq1y = 0.08;
    float freq1z = 0.09;
    float amp1 = 0.5; // Amplitude for Wave 1 components (Reduced)

    float wave1_dx = sin(position.y * freq1y + time1 * 1.1) * amp1 * 0.7;
    wave1_dx += cos(position.z * freq1z + time1 * 0.9) * amp1 * 0.5;

    float wave1_dy = cos(position.x * freq1x + time1 * 1.0) * amp1 * 1.0;
    wave1_dy += sin(position.z * freq1z + time1 * 1.2) * amp1 * 0.6;

    float wave1_dz = sin(position.x * freq1x + time1 * 0.8) * amp1 * 0.7;
    wave1_dz += cos(position.y * freq1y + time1 * 1.3) * amp1 * 0.5;

    // --- Wave 2 (As per user's reverted version) ---
    // Affects p.y (height) and p.z (depth)
    float wave2_offset_y = (cos(position.z * 0.8 - time2) * 0.3) + (sin(position.x * 0.5 - time2) * 0.1) * 1.5;
    float wave2_offset_z = (cos(position.x * 0.8 - time2) * 0.2);
    // wave2_offset_x is implicitly 0 for this wave based on reverted logic

    // Apply wave effects
    p.x += wave1_dx; // Only Wave 1 contributes to X for now to keep Wave 2 "as is"
    p.y += wave1_dy + wave2_offset_y;
    p.z += wave1_dz + wave2_offset_z;

    // Adjust scale based on combined y-displacement
    s += (wave1_dy + wave2_offset_y) * 0.5;

    // --- Mouse interaction for size ---
    if (uMouse.x > -5.0) { // Check if mouse has moved from initial (i.e., is over the window)
        float distToMouse = distance(p.xz, uMouseWorldPosition.xz); // Distance to mouse in 3D on XZ plane
        float mouseInfluenceRadius = 5.0; // Radius of effect for sizing
        float mouseEffectStrength = 1.0 - smoothstep(0.0, mouseInfluenceRadius, distToMouse);
        float sizeIncreaseFactor = 5.0; // How much to increase size
        s += mouseEffectStrength * sizeIncreaseFactor;
    }
    // --- End Mouse interaction ---
    s = max(0.1, s); // Ensure scale doesn't go below a small positive value
    vFinalWorldPos = p; // Pass final world position (after waves) to fragment shader

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = s * 15.0 * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragment = `
  varying vec3 vPosition; // Original particle position
  uniform float uTime;
  uniform vec2 uMouse;    // Mouse coordinates (normalized -1 to 1, y is up)
  uniform vec3 uMouseWorldPosition; // Mouse position in 3D world space
  varying vec3 vFinalWorldPos; // Final animated world position from vertex shader
  uniform vec3 uDarkRampColors[5]; // Changed from 11 to 5
  uniform int uNumDarkRampColors;   // Should be 5
  uniform vec3 uFlashlightColor; // New uniform for the flashlight effect color

  void main() {
    // --- Circle mask ---
    float pointDist = distance(gl_PointCoord, vec2(0.5));
    if (pointDist > 0.5) {
      discard;
    }

    // Cycle through uDarkRampColors for base particle color
    int colorIndex = int(mod( (uTime * 2.0 + vPosition.x * 0.05 + vPosition.z * 0.03) , float(uNumDarkRampColors) ));
    vec3 baseParticleColor = uDarkRampColors[colorIndex];

    vec3 finalColor = baseParticleColor;
    float finalAlpha = 0.5; // Base alpha

    // --- Mouse interaction for flashlight ---
    if (uMouse.x > -5.0) { // Check if mouse has moved from initial (i.e., is over the window)
      float distToMouse = distance(vFinalWorldPos.xz, uMouseWorldPosition.xz); // Distance to mouse in 3D on XZ plane
      float flashlightRadius = 8.0; // Radius of the flashlight effect
      float mouseEffectStrength = 1.0 - smoothstep(0.0, flashlightRadius, distToMouse);

      if (mouseEffectStrength > 0.0) {
        finalColor = mix(baseParticleColor, uFlashlightColor, mouseEffectStrength);
        finalAlpha = mix(finalAlpha, 0.9, mouseEffectStrength);
      }
    }

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

function lerp(start, end, amount) {
	return (1 - amount) * start + amount * end;
};

class Canvas {
	constructor() {
		this.config = {
			canvas: document.querySelector('#background-canvas'), // Updated selector
			winWidth: window.innerWidth,
			winHeight: window.innerHeight,
			aspectRatio: window.innerWidth / window.innerHeight,
			mouse: new THREE.Vector2(-10, -10),
			mouseWorldPosition: new THREE.Vector3() // To store 3D mouse intersection
		};

		this.raycaster = new THREE.Raycaster();
		this.particlePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Assumes particles are on Y=0 plane

		this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
		this.animate = this.animate.bind(this);

		this.initCamera();
		this.initScene();
		this.initRenderer();

		this.initParticles();

		this.bindEvents();
		this.animate();
	}

	bindEvents() {
		window.addEventListener('resize', this.onResize);
		window.addEventListener('mousemove', this.onMouseMove, false);
	}

	initCamera() {
		this.camera = new THREE.PerspectiveCamera(75, this.config.aspectRatio, 0.01, 1000);
		this.camera.position.set(0, 6, 5);
	}

	initControls() {
    // OrbitControls are not used in the original CodePen directly for particle movement
    // If you want camera controls for debugging, you'd need to include OrbitControls.js
    // and uncomment/add: this.controls = new THREE.OrbitControls(this.camera, this.config.canvas);
	}

	initScene() {
		this.scene = new THREE.Scene();
	}

	initRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.config.canvas,
			antialias: true,
      alpha: true // Set to true if you need transparency for integration later
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.config.winWidth, this.config.winHeight);
	}

	initParticles() {
    const gap = 0.3;
    const amountX = 600; // Increased particle count
    const amountY = 600; // Increased particle count
    const particleNum = amountX * amountY;
		const particlePositions = new Float32Array(particleNum * 3);
    const particleScales = new Float32Array(particleNum);
    let i = 0;
    let j = 0;

    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[i] = ix * gap - ((amountX * gap) / 2); // X
        particlePositions[i + 1] = 0; // Y (initial plane)
        particlePositions[i + 2] = iy * gap - ((amountX * gap) / 2); // Z
        particleScales[j] = 1;
        i += 3;
        j++;
      }
    }

		this.particleGeometry = new THREE.BufferGeometry();
		this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    this.particleGeometry.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

		const defaultDarkRampColors = new Array(5).fill(null).map(() => new THREE.Color(0x808080));

    this.particleMaterial = new THREE.ShaderMaterial({
			transparent: true, // Allows for alpha in fragment shader
			vertexShader: particleVertex,
			fragmentShader: particleFragment,
			uniforms: {
				uTime: { type: 'f', value: 0 },
        uMouse: { value: this.config.mouse }, // Pass 2D mouse coords
        uMouseWorldPosition: { value: this.config.mouseWorldPosition }, // Pass 3D mouse coords
        uDarkRampColors: { value: defaultDarkRampColors }, // Default to 5 grays
        uNumDarkRampColors: { value: 5 }, // Changed from 11 to 5
        uFlashlightColor: { value: new THREE.Color('#8888ff') } // Default flashlight color
			}
		});
		this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
		this.scene.add(this.particles);
	}

	render() {
		this.camera.lookAt(this.scene.position);
		this.renderer.render(this.scene, this.camera);
	}

	animate() {
		this.particleMaterial.uniforms.uTime.value += 0.0005; // Reduced speed further
		requestAnimationFrame(this.animate);
		this.render();
	}

	onMouseMove(e) {
    // Normalize mouse position from -1 to 1 (for uMouse uniform and raycaster)
		this.config.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		this.config.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Raycast to find mouse position in 3D world space on the particle plane
    if (this.camera) { // Ensure camera is initialized
      this.raycaster.setFromCamera(this.config.mouse, this.camera);
      this.raycaster.ray.intersectPlane(this.particlePlane, this.config.mouseWorldPosition);
      // The this.config.mouseWorldPosition is now updated and automatically used by the shader uniform
    }
	}

	onResize() {
		this.config.winWidth = window.innerWidth;
		this.config.winHeight = window.innerHeight;
		this.camera.aspect = this.config.winWidth / this.config.winHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.config.winWidth, this.config.winHeight);
	}

	updateColors({ darkRamp, flashlight }) { // darkRamp is an array of hex strings
		if (this.particleMaterial) {
      if (darkRamp && darkRamp.length === 5) { // Expect 5 colors now
      for (let i = 0; i < 5; i++) { // Loop 5 times
          this.particleMaterial.uniforms.uDarkRampColors.value[i].set(darkRamp[i]);
        }
      }
			this.particleMaterial.uniforms.uFlashlightColor.value.set(flashlight);
		}
	}
}

// Initialize the animation and expose it to the window object
window.backgroundAnimation = new Canvas();
