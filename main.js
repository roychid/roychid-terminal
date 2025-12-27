document.addEventListener('DOMContentLoaded', function(){
    // Hamburger toggle with accessibility
    const nav = document.querySelector('nav');
    let particlesPaused = window.innerWidth < 700;
    if(nav){
        const btn = document.createElement('button');
        btn.className = 'hamburger';
        btn.setAttribute('aria-label','Toggle navigation');
        btn.setAttribute('aria-expanded','false');
        btn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
        nav.appendChild(btn);

        const navLinks = nav.querySelector('.nav-links');
        function openNav(open){
            nav.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        btn.addEventListener('click', ()=> openNav(!nav.classList.contains('open')));
        navLinks?.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> openNav(false)));

        // close on outside click
        document.addEventListener('click', (e)=>{
            if(!nav.classList.contains('open')) return;
            if(!nav.contains(e.target)) openNav(false);
        });

        // close on Escape
        document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') openNav(false); });
    }

    // Particles: tuned speed/density with small-screen reductions
    (function(){
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const canvas = document.getElementById('particles-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // reflect initial small-screen pause state in UI (if control exists)
        const pbtnUI = document.querySelector('.particle-toggle');
        if(pbtnUI){ pbtnUI.setAttribute('aria-pressed', (!particlesPaused).toString()); pbtnUI.textContent = particlesPaused ? '✖' : '✳️'; }

        // tunable multipliers
        let SPEED_MULT = 1.0;
        let DENSITY_MULT = 1.0;
        let LINE_DIST = 120;

        function updateSettings(){
            if(width < 480){ SPEED_MULT = 0.9; DENSITY_MULT = 1.0; LINE_DIST = 100; }
            else if(width < 900){ SPEED_MULT = 1.1; DENSITY_MULT = 1.2; LINE_DIST = 140; }
            else { SPEED_MULT = 1.4; DENSITY_MULT = 1.4; LINE_DIST = 160; }
        }

        function particleCount(){
            const areaBase = (width * height) / 35000; // denser than before
            const base = Math.floor(areaBase * DENSITY_MULT);
            return Math.max(20, Math.min(300, base));
        }

        let PARTICLE_COUNT = particleCount();
        let particles = [];

        function rand(min, max){ return Math.random() * (max - min) + min; }

        function initParticles(){
            updateSettings();
            PARTICLE_COUNT = particleCount();
            particles = [];
            for(let i=0;i<PARTICLE_COUNT;i++){
                const speed = rand(0.4, 1.2) * SPEED_MULT; // faster
                const angle = rand(0, Math.PI * 2);
                particles.push({ x: rand(0, width), y: rand(0, height), r: rand(0.8, 3.2), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, hue: rand(115,170) });
            }
        }

        window.addEventListener('resize', ()=>{
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // auto-pause particles on small screens to save CPU/battery
            particlesPaused = window.innerWidth < 700;
            if(pbtnUI){ pbtnUI.setAttribute('aria-pressed', (!particlesPaused).toString()); pbtnUI.textContent = particlesPaused ? '✖' : '✳️'; }
            initParticles();
        });

        function draw(){
            if (particlesPaused) { ctx.clearRect(0,0,width,height); requestAnimationFrame(draw); return; }
            ctx.clearRect(0,0,width,height);
            ctx.globalCompositeOperation = 'lighter';
            for(const p of particles){
                p.x += p.vx; p.y += p.vy;
                if(p.x < -10) p.x = width + 10; if(p.x > width + 10) p.x = -10;
                if(p.y < -10) p.y = height + 10; if(p.y > height + 10) p.y = -10;
                ctx.beginPath(); ctx.fillStyle = `hsla(${p.hue},85%,55%,0.36)`; ctx.arc(p.x,p.y, Math.max(1.2, p.r * 1.6),0,Math.PI*2); ctx.fill();
            }
            // stronger lines between nearby particles
            for(let i=0;i<particles.length;i++){
                for(let j=i+1;j<particles.length;j++){
                    const a = particles[i], b = particles[j];
                    const dx = a.x - b.x, dy = a.y - b.y; const dist = Math.hypot(dx,dy);
                    if(dist < LINE_DIST){
                        ctx.beginPath();
                        const alpha = 0.18 * (1 - dist / LINE_DIST);
                        ctx.strokeStyle = `rgba(39,201,63,${alpha})`;
                        ctx.lineWidth = 2;
                        ctx.moveTo(a.x,a.y);
                        ctx.lineTo(b.x,b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalCompositeOperation = 'source-over';
            requestAnimationFrame(draw);
        }

        initParticles(); requestAnimationFrame(draw);
    })();

    /* Additional UI: theme toggle, particle toggle, scroll reveal, back-to-top */
    (function(){
        // Theme toggle with persistence
        const themeBtn = document.querySelector('.theme-toggle');
        function applyTheme(t){
            document.documentElement.setAttribute('data-theme', t);
            if(themeBtn) themeBtn.textContent = t === 'dark' ? '🌙' : '☀️';
        }
        const saved = localStorage.getItem('theme') || 'dark';
        applyTheme(saved);
        themeBtn?.addEventListener('click', ()=>{
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', next); applyTheme(next);
        });

        // Particle pause/resume
        const pbtn = document.querySelector('.particle-toggle');
        pbtn?.addEventListener('click', ()=>{
            particlesPaused = !particlesPaused;
            pbtn.setAttribute('aria-pressed', (!particlesPaused).toString());
            pbtn.textContent = particlesPaused ? '✖' : '✳️';
        });

        // Scroll reveal + animate progress bars when revealed
        const revealTargets = document.querySelectorAll('.hero-content, .blog-card, .project-card, .terminal-box');
        revealTargets.forEach(el=> el.classList.add('reveal'));

        function animateProgressIn(root){
            const bars = (root || document).querySelectorAll('.progress-bar');
            bars.forEach(bar=>{
                if(bar.dataset.animated) return;
                const target = parseInt(bar.getAttribute('data-target') || '0', 10);
                bar.dataset.animated = '1';
                // trigger width transition
                requestAnimationFrame(()=> bar.style.width = target + '%');
                // animate percent text
                const pct = bar.closest('.skill-progress')?.querySelector('.progress-percent');
                if(pct){
                    let cur = 0; const step = Math.max(1, Math.floor(target / 24));
                    const t = setInterval(()=>{ cur = Math.min(target, cur + step); pct.textContent = cur + '%'; if(cur >= target) clearInterval(t); }, 30);
                }
            });
        }

        const ro = new IntersectionObserver((entries, obs)=>{
            entries.forEach(en=>{
                if(en.isIntersecting){
                    en.target.classList.add('show');
                    // animate any progress bars inside the revealed target
                    animateProgressIn(en.target);
                    obs.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        // Observe reveals that are inside currently visible sections (home by default)
        function observeVisibleReveals(sectionEl){ if(!sectionEl) return; sectionEl.querySelectorAll('.reveal').forEach(r=> ro.observe(r)); }
        observeVisibleReveals(document.getElementById('home'));

        // Back to top
        const back = document.createElement('button'); back.className = 'back-to-top'; back.title = 'Back to top'; back.innerHTML = '↑'; document.body.appendChild(back);
        window.addEventListener('scroll', ()=>{ back.classList.toggle('visible', window.scrollY > 400); });
        back.addEventListener('click', ()=> window.scrollTo({ top: 0, behavior: 'smooth' }));

        // Navigation: show only the section user clicked (disable scroll-reveals showing other sections)
        const navLinks = document.querySelectorAll('nav .nav-links a');
        const sectionsList = ['home','blog','projects','tools','contact'];
        function showOnlySection(id){
            sectionsList.forEach(s=>{
                const el = document.getElementById(s);
                if(!el) return;
                if(s === id) {
                    el.classList.add('visible');
                } else {
                    el.classList.remove('visible');
                    // clear any reveal 'show' state so it can animate when reopened
                    el.querySelectorAll('.reveal.show').forEach(r=> r.classList.remove('show'));
                    // reset progress bars so they can animate again next time
                    el.querySelectorAll('.progress-bar').forEach(pb=>{
                        pb.removeAttribute('data-animated'); pb.style.width = '0%';
                        const pct = pb.closest('.skill-progress')?.querySelector('.progress-percent'); if(pct) pct.textContent = '0%';
                    });
                }
            });
            const sec = document.getElementById(id);
            if(sec){
                // observe revealables inside this section and animate
                observeVisibleReveals(sec);
                // scroll the section into view (account for sticky header)
                const header = document.querySelector('header');
                const headerOffset = header ? header.offsetHeight : 0;
                const top = window.pageYOffset + sec.getBoundingClientRect().top - headerOffset - 12;
                window.scrollTo({ top, behavior: 'smooth' });
                // allow a frame for visibility/scroll to apply before animating
                setTimeout(()=> animateProgressIn(sec), 180);
                // focus first focusable after scrolling
                setTimeout(()=> sec.querySelector('input,button,a,textarea')?.focus(), 300);
            }
            // update nav active state
            navLinks.forEach(a=> a.classList.toggle('active', a.getAttribute('href') === ('#'+id)));
            // update URL hash without jumping
            history.replaceState(null, '', id === 'home' ? '' : ('#'+id));
        }
        navLinks.forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); const target = (a.getAttribute('href')||'').replace('#',''); if(target) showOnlySection(target); }));
        // start at home
        showOnlySection('home');
    })();

        /* Contact form handling: client validation + submit (mailto fallback or POST to data-endpoint) */
        (function(){
            const form = document.getElementById('contactForm');
            if(!form) return;
            const status = document.getElementById('cf-status');

            function validateEmail(email){
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            }

            form.addEventListener('submit', async function(e){
                e.preventDefault();
                status.textContent = '';
                const name = form.querySelector('#cf-name').value.trim();
                const email = form.querySelector('#cf-email').value.trim();
                const subject = form.querySelector('#cf-subject').value.trim();
                const message = form.querySelector('#cf-message').value.trim();

                if(!name || !email || !subject || !message){
                    status.style.color = '#ffbd2e'; status.textContent = 'Please fill all required fields.'; return;
                }
                if(!validateEmail(email)){
                    status.style.color = '#ffbd2e'; status.textContent = 'Please enter a valid email.'; return;
                }

                const endpoint = form.getAttribute('data-endpoint');
                // Disable while sending
                const submitBtn = form.querySelector('.form-submit');
                submitBtn.disabled = true; submitBtn.style.opacity = '0.7';

                if(endpoint){
                    try{
                        const res = await fetch(endpoint, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, email, subject, message })
                        });
                        if(res.ok){ status.style.color = '#00ff88'; status.textContent = 'Message sent — thank you!'; form.reset(); }
                        else { status.style.color = '#ff5f56'; status.textContent = 'Failed to send. Try again later.'; }
                    }catch(err){ status.style.color = '#ff5f56'; status.textContent = 'Network error. Try again later.'; }
                } else {
                    // mailto fallback
                    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+message)}`;
                    window.location.href = mailto;
                    status.style.color = '#00ff88'; status.textContent = 'Opening your email client...';
                }

                submitBtn.disabled = false; submitBtn.style.opacity = '1';
            });
        })();
});
