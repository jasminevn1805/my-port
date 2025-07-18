/* particle-bg.js v1.0 | @jasmine | phuonghoang.ca */
this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

class SVGParticleSystem {
  constructor() {
      this.canvas = document.getElementById('canvas');
      this.gl = this.canvas.getContext('webgl');
      this.particles = [];
      this.mouseX = 0;
      this.mouseY = 0;
      this.mousePressed = false;
      this.time = 0;
      
      this.setupCanvas();
      this.setupWebGL();
      this.setupEventListeners();
      this.loadDefaultSVG();
      this.animate();
  }
  
  setupCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  
  setupWebGL() {
      const gl = this.gl;
      
      // Vertex shader
      const vertexShaderSource = `
          attribute vec2 a_position;
          attribute vec2 a_originalPosition;
          attribute float a_size;
          attribute vec3 a_color;
          
          uniform vec2 u_resolution;
          uniform vec2 u_mouse;
          uniform float u_time;
          uniform float u_mouseInfluence;
          
          varying vec3 v_color;
          varying float v_alpha;
          
          void main() {
              vec2 position = a_position;
              vec2 originalPos = a_originalPosition;
              
              // Mouse influence
              vec2 mousePos = u_mouse;
              float distance = length(position - mousePos);
              float influence = u_mouseInfluence / (distance * 0.001 + 1.0);
              
              // Dispersion effect
              vec2 direction = normalize(position - mousePos);
              position += direction * influence * 100.0;
              
              // Gentle floating animation
              position.x += sin(u_time * 0.001 + originalPos.x * 0.01) * 5.0;
              position.y += cos(u_time * 0.001 + originalPos.y * 0.01) * 3.0;
              
              // Convert to clip space
              vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
              
              gl_Position = vec4(clipSpace, 0, 1);
              gl_PointSize = a_size * (1.0 + influence * 0.5);
              
              v_color = a_color;
              v_alpha = 1.0 - min(influence * 0.3, 0.7);
          }
      `;
      
      // Fragment shader
      const fragmentShaderSource = `
          precision mediump float;
          
          varying vec3 v_color;
          varying float v_alpha;
          
          void main() {
              vec2 center = gl_PointCoord - vec2(0.5);
              float distance = length(center);
              
              if (distance > 0.5) {
                  discard;
              }
              
              float alpha = (1.0 - distance * 2.0) * v_alpha;
              gl_FragColor = vec4(v_color, alpha);
          }
      `;
      
      this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
      gl.useProgram(this.program);
      
      // Get attribute and uniform locations
      this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
      this.originalPositionLocation = gl.getAttribLocation(this.program, 'a_originalPosition');
      this.sizeLocation = gl.getAttribLocation(this.program, 'a_size');
      this.colorLocation = gl.getAttribLocation(this.program, 'a_color');
      
      this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
      this.mouseLocation = gl.getUniformLocation(this.program, 'u_mouse');
      this.timeLocation = gl.getUniformLocation(this.program, 'u_time');
      this.mouseInfluenceLocation = gl.getUniformLocation(this.program, 'u_mouseInfluence');
      
      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  
  createShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
      }
      
      return shader;
  }
  
  createProgram(vertexSource, fragmentSource) {
      const gl = this.gl;
      const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error('Program linking error:', gl.getProgramInfoLog(program));
          gl.deleteProgram(program);
          return null;
      }
      
      return program;
  }
  
  setupEventListeners() {
      this.canvas.addEventListener('mousemove', (e) => {
          this.mouseX = e.clientX;
          this.mouseY = e.clientY;
      });
      
      this.canvas.addEventListener('mousedown', () => {
          this.mousePressed = true;
      });
      
      this.canvas.addEventListener('mouseup', () => {
          this.mousePressed = false;
      });
      
      this.canvas.addEventListener('mouseleave', () => {
          this.mousePressed = false;
      });
      
      window.addEventListener('resize', () => {
          this.setupCanvas();
      });
      
      /*
      // File input handler
      document.getElementById('svgInput').addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                  this.parseSVG(e.target.result);
              };
              reader.readAsText(file);
          }
      });
      
      // Default button
      document.getElementById('loadDefault').addEventListener('click', () => {
          this.loadDefaultSVG();
      }); */
  }
  
  /* loadDefaultSVG() {
    // Create a spray effect with dots
    const spraySVG = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="2" fill="none" stroke="white"/>
            <circle cx="98" cy="102" r="1.5" fill="none" stroke="white"/>
            <circle cx="102" cy="98" r="1.5" fill="none" stroke="white"/>
            <circle cx="95" cy="95" r="1.5" fill="none" stroke="white"/>
            <circle cx="105" cy="95" r="1.5" fill="none" stroke="white"/>
            <circle cx="95" cy="105" r="1.5" fill="none" stroke="white"/>
            <circle cx="105" cy="105" r="1.5" fill="none" stroke="white"/>
            <circle cx="90" cy="100" r="1.2" fill="none" stroke="white"/>
            <circle cx="110" cy="100" r="1.2" fill="none" stroke="white"/>
            <circle cx="100" cy="90" r="1.2" fill="none" stroke="white"/>
            <circle cx="100" cy="110" r="1.2" fill="none" stroke="white"/>
            <circle cx="85" cy="85" r="1.3" fill="none" stroke="white"/>
            <circle cx="115" cy="85" r="1.3" fill="none" stroke="white"/>
            <circle cx="85" cy="115" r="1.3" fill="none" stroke="white"/>
            <circle cx="115" cy="115" r="1.3" fill="none" stroke="white"/>
            <circle cx="80" cy="100" r="1.1" fill="none" stroke="white"/>
            <circle cx="120" cy="100" r="1.1" fill="none" stroke="white"/>
            <circle cx="100" cy="80" r="1.1" fill="none" stroke="white"/>
            <circle cx="100" cy="120" r="1.1" fill="none" stroke="white"/>
            <circle cx="75" cy="75" r="1.2" fill="none" stroke="white"/>
            <circle cx="125" cy="75" r="1.2" fill="none" stroke="white"/>
            <circle cx="75" cy="125" r="1.2" fill="none" stroke="white"/>
            <circle cx="125" cy="125" r="1.2" fill="none" stroke="white"/>
            <circle cx="70" cy="100" r="1" fill="none" stroke="white"/>
            <circle cx="130" cy="100" r="1" fill="none" stroke="white"/>
            <circle cx="100" cy="70" r="1" fill="none" stroke="white"/>
            <circle cx="100" cy="130" r="1" fill="none" stroke="white"/>
            <circle cx="65" cy="65" r="1.1" fill="none" stroke="white"/>
            <circle cx="135" cy="65" r="1.1" fill="none" stroke="white"/>
            <circle cx="65" cy="135" r="1.1" fill="none" stroke="white"/>
            <circle cx="135" cy="135" r="1.1" fill="none" stroke="white"/>
            <circle cx="60" cy="100" r="0.9" fill="none" stroke="white"/>
            <circle cx="140" cy="100" r="0.9" fill="none" stroke="white"/>
            <circle cx="100" cy="60" r="0.9" fill="none" stroke="white"/>
            <circle cx="100" cy="140" r="0.9" fill="none" stroke="white"/>
            <circle cx="55" cy="55" r="1" fill="none" stroke="white"/>
            <circle cx="145" cy="55" r="1" fill="none" stroke="white"/>
            <circle cx="55" cy="145" r="1" fill="none" stroke="white"/>
            <circle cx="145" cy="145" r="1" fill="none" stroke="white"/>
            <circle cx="50" cy="100" r="0.8" fill="none" stroke="white"/>
            <circle cx="150" cy="100" r="0.8" fill="none" stroke="white"/>
            <circle cx="100" cy="50" r="0.8" fill="none" stroke="white"/>
            <circle cx="100" cy="150" r="0.8" fill="none" stroke="white"/>
        </svg>
    `;
    this.parseSVG(spraySVG);
} */

loadDefaultSVG() {
  const numCircles = 300; // More circles for larger area
  let circles = '';
  
  for (let i = 0; i < numCircles; i++) {
      const x = Math.random() * 800; // 0-300
      const y = Math.random() * 800; // 0-300
      const r = 0.5 + Math.random() * 1.5;
      
      circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="white"/>`;
  }
  
  const spraySVG = `
      <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
          ${circles}
      </svg>
  `;
  
  this.parseSVG(spraySVG);
}
  
  parseSVG(svgString) {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const circles = svgDoc.querySelectorAll('circle');
      const paths = svgDoc.querySelectorAll('path');
      
      this.particles = [];
      
      // Handle circles specially for spray effect
      circles.forEach(circle => {
          const cx = parseFloat(circle.getAttribute('cx'));
          const cy = parseFloat(circle.getAttribute('cy'));
          const r = parseFloat(circle.getAttribute('r')) || 1;
          
          // Scale to canvas size and center
          const scaledX = (cx * 4) + this.canvas.width / 2 - 1000;
          const scaledY = (cy * 4) + this.canvas.height / 2 - 1000;
          
          this.particles.push({
              x: scaledX,
              y: scaledY,
              originalX: scaledX,
              originalY: scaledY,
              size: r + Math.random() * 3,
              color: [
                  0.4 + Math.random() * 0.6,
                  0.6 + Math.random() * 0.4,
                  0.8 + Math.random() * 0.2
              ]
          });
      });
      
      // Handle paths normally
      paths.forEach(path => {
          const pathData = path.getAttribute('d');
          if (pathData) {
              this.createParticlesFromPath(pathData);
          }
      });
      
      this.createBuffers();
  }
  
  createParticlesFromPath(pathData) {
      // Handle circle elements specially for spray effect
      if (pathData.includes('cx') && pathData.includes('cy')) {
          // This is a circle - create a single particle at its center
          const match = pathData.match(/cx="([^"]+)"\s+cy="([^"]+)"/);
          if (match) {
              const x = parseFloat(match[1]);
              const y = parseFloat(match[2]);
              
              // Scale to canvas size and center
              const scaledX = (x * 4) + this.canvas.width / 2 - 400;
              const scaledY = (y * 4) + this.canvas.height / 2 - 400;
              
              this.particles.push({
                  x: scaledX,
                  y: scaledY,
                  originalX: scaledX,
                  originalY: scaledY,
                  size: 2 + Math.random() * 4,
                  color: [
                      0.4 + Math.random() * 0.6,
                      0.6 + Math.random() * 0.4,
                      0.8 + Math.random() * 0.2
                  ]
              });
          }
          return;
      }
      
      // Handle regular path commands
      const commands = pathData.match(/[MLZ][^MLZ]*/g) || [];
      let currentX = 0, currentY = 0;
      let startX = 0, startY = 0;
      
      commands.forEach(command => {
          const type = command[0];
          const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);
          
          switch(type) {
              case 'M':
                  currentX = startX = coords[0];
                  currentY = startY = coords[1];
                  break;
              case 'L':
                  this.createLineParticles(currentX, currentY, coords[0], coords[1]);
                  currentX = coords[0];
                  currentY = coords[1];
                  break;
              case 'Z':
                  this.createLineParticles(currentX, currentY, startX, startY);
                  break;
          }
      });
  }
  
  createLineParticles(x1, y1, x2, y2) {
      const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const numParticles = Math.floor(distance / 2) + 1;
      
      for (let i = 0; i < numParticles; i++) {
          const t = i / (numParticles - 1);
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          
          // Scale to canvas size and center
          const scaledX = (x * 4) + this.canvas.width / 2 - 400;
          const scaledY = (y * 4) + this.canvas.height / 2 - 400;
          
          this.particles.push({
              x: scaledX,
              y: scaledY,
              originalX: scaledX,
              originalY: scaledY,
              size: 2 + Math.random() * 3,
              color: [
                  0.3 + Math.random() * 0.7,
                  0.5 + Math.random() * 0.5,
                  0.8 + Math.random() * 0.2
              ]
          });
      }
  }
  
  createBuffers() {
      const gl = this.gl;
      
      // Create arrays for all particle data
      const positions = [];
      const originalPositions = [];
      const sizes = [];
      const colors = [];
      
      this.particles.forEach(particle => {
          positions.push(particle.x, particle.y);
          originalPositions.push(particle.originalX, particle.originalY);
          sizes.push(particle.size);
          colors.push(...particle.color);
      });
      
      // Create buffers
      this.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      
      this.originalPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.originalPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(originalPositions), gl.STATIC_DRAW);
      
      this.sizeBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
      
      this.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      
      this.particleCount = this.particles.length;
  }
  
  render() {
      const gl = this.gl;
      
      if (this.particleCount === 0) return;
      
      // Clear canvas
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(this.program);
      
      // Set uniforms
      gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.mouseLocation, this.mouseX, this.mouseY);
      gl.uniform1f(this.timeLocation, this.time);
      gl.uniform1f(this.mouseInfluenceLocation, this.mousePressed ? 2.0 : 1.0);
      
      // Bind attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.originalPositionBuffer);
      gl.enableVertexAttribArray(this.originalPositionLocation);
      gl.vertexAttribPointer(this.originalPositionLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
      gl.enableVertexAttribArray(this.sizeLocation);
      gl.vertexAttribPointer(this.sizeLocation, 1, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.enableVertexAttribArray(this.colorLocation);
      gl.vertexAttribPointer(this.colorLocation, 3, gl.FLOAT, false, 0, 0);
      
      // Draw particles
      gl.drawArrays(gl.POINTS, 0, this.particleCount);
  }
  
  animate() {
      this.time = performance.now();
      this.render();
      requestAnimationFrame(() => this.animate());
  }
}

// Initialize the application
window.addEventListener('load', () => {
  new SVGParticleSystem();
  console.log('Particle system initialised, total particles:', this?.particleCount);
});
