// Hamburger menu toggle for mobile overlay
const hamburger = document.getElementById('hamburger-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuClose = document.getElementById('mobile-menu-close');
const header = document.querySelector('.header');
const form = document.querySelector('.form');

if (hamburger && mobileMenu && mobileMenuClose) {
    hamburger.addEventListener('click', function() {
        mobileMenu.classList.add('open');
    });
    mobileMenuClose.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
    });
    // Optional: close menu when clicking outside or on a link
    mobileMenu.addEventListener('click', function(e) {
        if (e.target === mobileMenu) {
            mobileMenu.classList.remove('open');
        }
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    });
}

// Map filter toggle for mobile
const filterToggleBtn = document.getElementById('filter-toggle-btn');
const mapControls = document.getElementById('map-controls');

if (filterToggleBtn && mapControls) {
    filterToggleBtn.addEventListener('click', function() {
        mapControls.classList.toggle('filters-expanded');
    });
}

// Zoom functionality for image comparison
function toggleZoom() {
    const container = document.querySelector('.image-comparison-container');
    
    if (container.classList.contains('zoomed')) {
        // Exit zoom mode
        container.classList.remove('zoomed');
        document.body.style.overflow = '';
    } else {
        // Enter zoom mode
        container.classList.add('zoomed');
        document.body.style.overflow = 'hidden';
    }
}

// Smooth scrolling to sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
    closeMobileMenu();
}

// Header scroll effect - maintaining consistent header color
function handleScroll() {
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
}

// Form submission handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Basic validation
    if (!name || !email || !message) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Simulate form submission
    showNotification('Thank you for your message! We will get back to you soon.', 'success');
    form.reset();
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ${type === 'success' ? 'background-color: #28a745;' : 'background-color: #dc3545;'}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Intersection Observer for animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature, .gallery-item, .contact-item');
    animateElements.forEach(el => observer.observe(el));
}

// Add animation classes for enhanced UX
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .feature, .gallery-item, .contact-item {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .feature.animate-in, .gallery-item.animate-in, .contact-item.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .gallery-item.animate-in {
            transition-delay: calc(var(--index, 0) * 0.1s);
        }
    `;
    document.head.appendChild(style);
    
    // Add index to gallery items for staggered animation
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.style.setProperty('--index', index);
    });
}

// Lazy loading for images
function setupLazyLoading() {
    const images = document.querySelectorAll('img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                
                // Add load event listener
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
                
                // If image is already cached, trigger load immediately
                if (img.complete) {
                    img.style.opacity = '1';
                }
                
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Active nav link highlighting
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                // Remove active class from all nav links
                navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active class to current nav link
                const currentNavLink = document.querySelector(`.nav-link[href="#${currentId}"]`);
                if (currentNavLink) {
                    currentNavLink.classList.add('active');
                }
            }
        });
    }, {
        threshold: 0.5
    });
    
    sections.forEach(section => observer.observe(section));
}

// Keyboard navigation support
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // ESC key functionality
        if (e.key === 'Escape') {
            // First check if zoom mode is active
            const container = document.querySelector('.image-comparison-container');
            
            if (container && container.classList.contains('zoomed')) {
                container.classList.remove('zoomed');
                document.body.style.overflow = '';
            } else {
                // Otherwise close mobile menu
                closeMobileMenu();
            }
        }
        
        // Enter key on hamburger toggles menu
        if (e.key === 'Enter' && e.target === hamburger) {
            toggleMobileMenu();
        }
    });
    
    // Make hamburger focusable
    hamburger.setAttribute('tabindex', '0');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing scripts');
    
    // Event listeners
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
    
    if (window) {
        window.addEventListener('scroll', handleScroll);
    }
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Initialize features
    setupIntersectionObserver();
    addAnimationStyles();
    setupLazyLoading();
    updateActiveNavLink();
    setupKeyboardNavigation();
    
    // Add CSS for active nav links
    const style = document.createElement('style');
    style.textContent = `
        .nav-link.active {
            color: #ffffff;
        }
        .nav-link.active::after {
            width: 100%;
        }
    `;
    document.head.appendChild(style);
});

// Utility function to handle clicks outside mobile menu
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        closeMobileMenu();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});

// Export functions for potential use in other scripts
window.scrollToSection = scrollToSection;
window.showNotification = showNotification;

// Zoomable Image Functionality
function initializeZoomableImages() {
    const zoomableContainers = document.querySelectorAll('.zoomable-image-container');
    
    zoomableContainers.forEach(container => {
        container.addEventListener('click', function() {
            const img = this.querySelector('.zoomable-image');
            if (img) {
                createZoomModal(img);
            }
        });
    });
}

function createZoomModal(originalImg) {
    // Remove existing modal if present
    const existingModal = document.querySelector('.zoom-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'zoom-modal';
    
    const modalImg = document.createElement('img');
    modalImg.src = originalImg.src;
    modalImg.alt = originalImg.alt;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'zoom-close';
    closeBtn.innerHTML = '<span class="material-icons">close</span>';
    
    // Assemble modal
    modal.appendChild(modalImg);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    // Event listeners for closing
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
}

// Initialize zoomable images when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeZoomableImages();
    initializeLandscapePatternAnimation();
});

// SimplexNoise implementation (simplified version)
class SimplexNoise {
    constructor() {
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        
        this.p = [];
        for(let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        
        this.perm = [];
        for(let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }
    
    dot(g, x, y, z) {
        return g[0] * x + g[1] * y + g[2] * z;
    }
    
    noise3D(xin, yin, zin) {
        let n0, n1, n2, n3;
        
        const F3 = 1.0 / 3.0;
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);
        
        const G3 = 1.0 / 6.0;
        const t = (i + j + k) * G3;
        const X0 = i - t;
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        const z0 = zin - Z0;
        
        let i1, j1, k1;
        let i2, j2, k2;
        
        if(x0 >= y0) {
            if(y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
        } else {
            if(y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
        }
        
        const x1 = x0 - i1 + G3;
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3;
        const y2 = y0 - j2 + 2.0 * G3;
        const z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3;
        const y3 = y0 - 1.0 + 3.0 * G3;
        const z3 = z0 - 1.0 + 3.0 * G3;
        
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
        const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
        const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
        
        let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
        if(t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
        }
        
        let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
        if(t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
        }
        
        let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
        if(t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
        }
        
        let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
        if(t3 < 0) n3 = 0.0;
        else {
            t3 *= t3;
            n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
        }
        
        return 32.0 * (n0 + n1 + n2 + n3);
    }
}

// Landscape Pattern Animation
function initializeLandscapePatternAnimation() {
    const canvas = document.getElementById('landscapePatternCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const simplex = new SimplexNoise();
    
    // Original tiles data from CSV
    const origTiles = [
        {pos0: 50, pos1: 0, pos2: 50, pos3: 0, pos4: 62.5, pos5: 100, pos6: 62.5, pos7: 100, pos8: 62.5, pos9: 100, pos10: 50, pos11: 0, pos12: 50, pos13: 0},
        {pos0: 37.5, pos1: 0, pos2: 50, pos3: 0, pos4: 62.5, pos5: 100, pos6: 62.5, pos7: 100, pos8: 50, pos9: 100, pos10: 37.5, pos11: 0, pos12: 37.5, pos13: 0},
        {pos0: 25, pos1: 0, pos2: 50, pos3: 0, pos4: 75, pos5: 100, pos6: 75, pos7: 100, pos8: 50, pos9: 100, pos10: 25, pos11: 0, pos12: 25, pos13: 0},
        {pos0: 12.5, pos1: 0, pos2: 50, pos3: 0, pos4: 87.5, pos5: 100, pos6: 87.5, pos7: 100, pos8: 50, pos9: 100, pos10: 12.5, pos11: 0, pos12: 12.5, pos13: 0},
        {pos0: 0, pos1: 0, pos2: 50, pos3: 0, pos4: 100, pos5: 100, pos6: 100, pos7: 100, pos8: 50, pos9: 100, pos10: 0, pos11: 0, pos12: 0, pos13: 0},
        {pos0: 0, pos1: 0, pos2: 50, pos3: 0, pos4: 100, pos5: 87.5, pos6: 100, pos7: 100, pos8: 50, pos9: 100, pos10: 0, pos11: 12.5, pos12: 0, pos13: 0},
        {pos0: 0, pos1: 0, pos2: 50, pos3: 0, pos4: 100, pos5: 75, pos6: 100, pos7: 100, pos8: 50, pos9: 100, pos10: 0, pos11: 25, pos12: 0, pos13: 0},
        {pos0: 0, pos1: 0, pos2: 50, pos3: 0, pos4: 100, pos5: 62.5, pos6: 100, pos7: 100, pos8: 50, pos9: 100, pos10: 0, pos11: 37.5, pos12: 0, pos13: 0},
        {pos0: 0, pos1: 0, pos2: 50, pos3: 0, pos4: 100, pos5: 50, pos6: 100, pos7: 100, pos8: 50, pos9: 100, pos10: 0, pos11: 50, pos12: 0, pos13: 0},
        {pos0: 0, pos1: 0, pos2: 50, pos3: 0, pos4: 100, pos5: 37.5, pos6: 100, pos7: 100, pos8: 50, pos9: 100, pos10: 0, pos11: 62.5, pos12: 0, pos13: 0}
    ];

    let animationId;
    let startTime = Date.now();

    // Animation parameters
    let scale = 0.055;
    let posX = 1;
    let speed = 0.000055;
    let trans = 0.8;
    const l = 50; // tile size

    // Set canvas size
    function resizeCanvas() {
        const container = canvas.parentElement;
        const w = container.offsetWidth;
        const h = w / 2;
        
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        return { w, h };
    }

    // Get path from interpolated tile data
    function getPath(index, size = 100) {
        const metric = [
            "pos0", "pos1", "pos2", "pos3", "pos4", "pos5", "pos6",
            "pos7", "pos8", "pos9", "pos10", "pos11", "pos12", "pos13"
        ];
        
        const bottom = Math.floor(index / 10);
        const ceiling = Math.ceil(index / 10);
        const pos = index - bottom * 10;
        
        let pathString = "M";
        const scale = size / 100;
        
        for (let i = 0; i < 13; i++) {
            const bottomVal = origTiles[Math.min(bottom, origTiles.length - 1)][metric[i]] || 0;
            const ceilingVal = origTiles[Math.min(ceiling, origTiles.length - 1)][metric[i]] || 0;
            
            const delta = (bottomVal * scale - ceilingVal * scale) / 10;
            let str = "";
            if (i === 1) {
                str = "0L";
            }
            const num = bottomVal * scale - delta * pos;
            pathString += num + ",";
        }
        
        return pathString;
    }

    // Draw path from string
    function drawPathFromString(ctx, pathData, xOffset, yOffset, alpha = 0.5) {
        const path = new Path2D(pathData);
        
        ctx.save();
        ctx.translate(xOffset, yOffset);
        ctx.globalAlpha = alpha;
        ctx.fill(path);
        ctx.restore();
    }

    // Main animation loop
    function animate() {
        const { w, h } = resizeCanvas();
        const now = Date.now();
        const time = (now - startTime) * speed;
        
        const rows = Math.floor(h / l) + 1;
        const columns = Math.floor(w / l) + 2;
        
        // Set background
        ctx.fillStyle = "#e5e9f1";
        ctx.fillRect(0, 0, w, h);
        
        // Draw tiles
        for (let x = 0; x < columns; x += 1) {
            for (let y = 0; y < rows; y += 1) {
                const xPos = x * scale;
                const yPos = y * scale - posX * time;
                const offset = y % 2 === 1 ? -0.5 : 0;
                
                const value = (simplex.noise3D(xPos, yPos, time) + 1) * 0.5;
                const pathIndex = Math.floor(value * 90); // 0 to 90
                const selectedPath = getPath(pathIndex, l);
                
                ctx.fillStyle = "#2D3C5B"; // Memorial color
                
                if (selectedPath) {
                    drawPathFromString(
                        ctx,
                        selectedPath,
                        (x + offset) * l,
                        y * l,
                        value + trans
                    );
                }
            }
        }
        
        animationId = requestAnimationFrame(animate);
    }

    // Initialize
    const { w, h } = resizeCanvas();
    animate();

    // Handle resize
    window.addEventListener('resize', resizeCanvas);

    // Pause animation when not visible (performance optimization)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) animate();
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    });

    observer.observe(canvas);
}

// Impressum Modal Functions
function openImpressum() {
    const modal = document.getElementById('impressum-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImpressum() {
    const modal = document.getElementById('impressum-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close impressum when clicking outside the content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('impressum-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImpressum();
            }
        });
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImpressum();
        }
    });
});

// Cookie Consent Banner
document.addEventListener('DOMContentLoaded', function() {
    const cookieBanner = document.getElementById('cookie-consent');
    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');
    
    if (!cookieBanner) return;
    
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (cookieConsent === null) {
        // Show banner if no choice has been made
        cookieBanner.style.display = 'block';
    }
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieBanner.style.display = 'none';
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'rejected');
            cookieBanner.style.display = 'none';
        });
    }
});
