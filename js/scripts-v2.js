document.addEventListener('DOMContentLoaded', () => {

    /*********************************
     *                               *
     *      BACKGROUND ANIMATION     *
     *                               *
     *********************************/
    (() => {
        const canvas = document.getElementById('background-canvas');
        if (!canvas) return;

        const config = {
            zoom: {
                enabled: true,
                minZoom: 0.1,
                maxZoom: 1.5
            },
            particles: {
                shape: 'circle',
                size: 0.005,
                count: 2000,
                color: '#fff'
            }
        };

        const createCircleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const context = canvas.getContext('2d');
            context.beginPath();
            context.arc(16, 16, 16, 0, 2 * Math.PI);
            context.fillStyle = '#ffffff';
            context.fill();
            return new THREE.CanvasTexture(canvas);
        };

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = config.zoom.maxZoom;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = config.particles.count;
        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * (Math.random() * 5) * 5;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: config.particles.size,
            color: config.particles.color
        });

        if (config.particles.shape === 'circle') {
            particlesMaterial.map = createCircleTexture();
            particlesMaterial.alphaTest = 0.5;
            particlesMaterial.transparent = true;
        }

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        const clock = new THREE.Clock();
        let bgPaused = false;
        let scrollDisabled = false;
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            if (!bgPaused) {
                particlesMesh.rotation.x = -elapsedTime * 0.05;
                particlesMesh.rotation.y = elapsedTime * 0.05;
            }
            renderer.render(scene, camera);
            window.requestAnimationFrame(animate);
        }
        animate();

        // Expose pause/resume controls
        window.backgroundController = {
            /** Pause background rotation and scroll zoom */
            pause: () => {
                bgPaused = true;
                scrollDisabled = true;
            },
            resume: () => {
                bgPaused = false;
                scrollDisabled = false;
            },
            isPaused: () => bgPaused
        };

        const handleScroll = () => {
            if (scrollDisabled) return;
            const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            const zoomRange = config.zoom.maxZoom - config.zoom.minZoom;
            camera.position.z = config.zoom.maxZoom - (scrollProgress * zoomRange);
        };

        if (config.zoom.enabled) {
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            if (config.zoom.enabled) {
                handleScroll();
            }
        });
    })();

    /*********************************
     *                               *
     *  BACKGROUND TOGGLE HANDLER    *
     *                               *
     *********************************/
    (() => {
        const toggleBtn = document.getElementById('toggle-bg-animation');
        if (!toggleBtn) return;


        const updateState = (paused) => {
            if (paused) {
                toggleBtn.setAttribute('title', 'Enable background movement');
                toggleBtn.setAttribute('aria-label', 'Enable background movement');
                toggleBtn.textContent = '⏸';
                toggleBtn.classList.add('bg-animation-paused');
            } else {
                toggleBtn.setAttribute('title', 'Disable background movement');
                toggleBtn.setAttribute('aria-label', 'Disable background movement');
                toggleBtn.textContent = '▶';
                toggleBtn.classList.remove('bg-animation-paused');
            }

        };

        toggleBtn.addEventListener('click', () => {
            if (!window.backgroundController) return;
            const paused = window.backgroundController.isPaused();
            if (paused) {
                window.backgroundController.resume();
            } else {
                window.backgroundController.pause();
            }
            updateState(!paused);
            toggleBtn.blur();
        });

        // set initial state
        updateState(false);
    })();

    /*********************************
     *                               *
     *        HERO ANIMATION         *
     *                               *
     *********************************/
    (() => {
        const config = {
            animationInterval: 500,
            fadeSpeed: 1000,
            staggeredUpdateDelay: 100,
            animationDirection: 'alternate',
            animationMode: 'cascade',
            cascadeInitialOffsets: [0, 10, 9, 8, 7],
            colorSchemes: {
                blue: ['--dark-blue-50', '--dark-blue-100', '--dark-blue-200', '--dark-blue-300', '--dark-blue-400', '--dark-blue-500', '--dark-blue-600', '--dark-blue-700', '--dark-blue-800', '--dark-blue-900', '--dark-blue-950'],
                green: ['--dark-green-50', '--dark-green-100', '--dark-green-200', '--dark-green-300', '--dark-green-400', '--dark-green-500', '--dark-green-600', '--dark-green-700', '--dark-green-800', '--dark-green-900', '--dark-green-950'],
                yellow: ['--dark-yellow-50', '--dark-yellow-100', '--dark-yellow-200', '--dark-yellow-300', '--dark-yellow-400', '--dark-yellow-500', '--dark-yellow-600', '--dark-yellow-700', '--dark-yellow-800', '--dark-yellow-900', '--dark-yellow-950'],
                purple: ['--dark-purple-50', '--dark-purple-100', '--dark-purple-200', '--dark-purple-300', '--dark-purple-400', '--dark-purple-500', '--dark-purple-600', '--dark-purple-700', '--dark-purple-800', '--dark-purple-900', '--dark-purple-950'],
                red: ['--dark-red-50', '--dark-red-100', '--dark-red-200', '--dark-red-300', '--dark-red-400', '--dark-red-500', '--dark-red-600', '--dark-red-700', '--dark-red-800', '--dark-red-900', '--dark-red-950']
            },
            columnColors: ['blue', 'green', 'yellow', 'purple', 'red']
        };

        const grid = document.querySelector('.hero-ramps-grid');
        if (!grid) return;

        grid.innerHTML = '';

        config.columnColors.forEach(colorName => {
            const column = document.createElement('div');
            column.className = 'ramp-column';
            column.dataset.colorScheme = colorName;

            const numBoxes = config.colorSchemes[colorName].length;
            for (let i = 0; i < numBoxes; i++) {
                const box = document.createElement('div');
                box.className = 'ramp-box';
                box.style.transition = 'background-color ' + (config.fadeSpeed / 1000) + 's ease-in-out';
                column.appendChild(box);
            }
            grid.appendChild(column);
        });

        const columns = document.querySelectorAll('.ramp-column');

        function initializeColumns() {
            columns.forEach((column, columnIndex) => {
                const boxes = column.querySelectorAll('.ramp-box');
                const colorScheme = config.colorSchemes[column.dataset.colorScheme];
                const numColors = colorScheme.length;

                boxes.forEach((box, boxIndex) => {
                    let colorIndex;
                    if (config.animationMode === 'cascade') {
                        const offset = config.cascadeInitialOffsets[columnIndex] || 0;
                        colorIndex = (boxIndex + offset) % numColors;
                    } else {
                        colorIndex = boxIndex % numColors;
                    }
                    box.style.backgroundColor = 'var(' + colorScheme[colorIndex] + ')';
                });
            });
        }

        function animateColumn(column, direction = 1) {
            const boxes = Array.from(column.querySelectorAll('.ramp-box'));
            let currentColors = boxes.map(box => box.style.backgroundColor);

            if (direction > 0) {
                const lastColor = currentColors.pop();
                currentColors.unshift(lastColor);
            } else {
                const firstColor = currentColors.shift();
                currentColors.push(firstColor);
            }

            boxes.forEach((box, i) => {
                setTimeout(() => {
                    box.style.backgroundColor = currentColors[i];
                }, i * config.staggeredUpdateDelay);
            });
        }

        initializeColumns();

        columns.forEach((column, index) => {
            setInterval(() => {
                let direction;
                switch (config.animationDirection) {
                    case 'up':
                        direction = -1;
                        break;
                    case 'alternate':
                        direction = index % 2 === 0 ? -1 : 1;
                        break;
                    case 'down':
                    default:
                        direction = 1;
                        break;
                }
                animateColumn(column, direction);
            }, config.animationInterval);
        });
    })();

    /*********************************
     *                               *
     *       SCROLL ANIMATIONS       *
     *                               *
     *********************************/
    (() => {
        const config = {
            featureCards: {
                threshold: 0.5,
            },
            techLogos: {
                threshold: 0.2,
                staggerDelay: 30
            }
        };

        const featureCards = document.querySelectorAll('.feature-card');
        if (featureCards.length > 0) {
            const featureCardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    } else {
                        entry.target.classList.remove('is-visible');
                    }
                });
            }, { threshold: config.featureCards.threshold });

            featureCards.forEach(card => {
                featureCardObserver.observe(card);
            });
        }

        const techGrid = document.querySelector('.tech-grid');
        if (techGrid) {
            const techLogos = Array.from(techGrid.querySelectorAll('img'));
            const techGridObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        techLogos.forEach((logo, index) => {
                            setTimeout(() => {
                                logo.classList.add('is-visible');
                            }, index * config.techLogos.staggerDelay);
                        });
                    } else {
                        techLogos.forEach(logo => {
                            logo.classList.remove('is-visible');
                        });
                    }
                });
            }, { threshold: config.techLogos.threshold });

            techGridObserver.observe(techGrid);
        }
    })();

});
