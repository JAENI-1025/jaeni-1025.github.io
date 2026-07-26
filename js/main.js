/* Jeong Jaeyoun portfolio — interactions */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ───── 커스텀 커서 ───── */
  if (finePointer && !reduced) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx = -100, my = -100, rx = -100, ry = -100;

    let cursorRaf = null;
    function cursorLoop() {
      cursorRaf = null;
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      // 링이 따라잡을 때까지만 루프 유지
      if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) {
        cursorRaf = requestAnimationFrame(cursorLoop);
      }
    }
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (cursorRaf === null) cursorRaf = requestAnimationFrame(cursorLoop);
    });

    document.querySelectorAll('a, button, [data-hover], .card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('is-hovering'));
    });
  }

  /* ───── 히어로 글자: 커서 근접 반발 + 스프링 복귀 ───── */
  document.querySelectorAll('.hero__line').forEach(line => {
    const text = line.dataset.text || '';
    line.innerHTML = [...text].map(ch =>
      `<span class="ltr">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  });

  if (finePointer && !reduced) {
    const letters = [...document.querySelectorAll('.hero__name .ltr')]
      .map(el => ({ el, x: 0, y: 0, vx: 0, vy: 0 }));
    let mouse = { x: -9999, y: -9999, inside: false };
    const RADIUS = 130, FORCE = 34, SPRING = 0.11, DAMP = 0.82;
    const heroEl = document.querySelector('.hero');
    let springRaf = null;

    function springLoop() {
      springRaf = null;
      let active = mouse.inside;
      for (const L of letters) {
        const r = L.el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = cx - mouse.x, dy = cy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0) {
          const p = (1 - dist / RADIUS) * FORCE;
          L.vx += (dx / dist) * p * 0.14;
          L.vy += (dy / dist) * p * 0.14;
        }
        L.vx += -L.x * SPRING; L.vy += -L.y * SPRING;
        L.vx *= DAMP; L.vy *= DAMP;
        L.x += L.vx; L.y += L.vy;
        L.el.style.transform = `translate(${L.x.toFixed(1)}px, ${L.y.toFixed(1)}px)`;
        if (Math.abs(L.x) > 0.1 || Math.abs(L.y) > 0.1 ||
            Math.abs(L.vx) > 0.1 || Math.abs(L.vy) > 0.1) active = true;
      }
      // 커서가 히어로 안에 있거나 글자가 아직 움직이는 동안만 루프 유지
      if (active) springRaf = requestAnimationFrame(springLoop);
    }
    function wakeSpring() {
      if (springRaf === null) springRaf = requestAnimationFrame(springLoop);
    }
    heroEl.addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true;
      wakeSpring();
    });
    heroEl.addEventListener('mouseleave', () => {
      mouse.x = -9999; mouse.y = -9999; mouse.inside = false;
      wakeSpring();
    });
  }

  /* ───── 스크롤 리빌 (IO + 폴백 스윕) ───── */
  const revealEls = new Set(document.querySelectorAll('.reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      // 화면에 들어왔거나, 이미 위로 지나친 요소는 바로 표시
      if (en.isIntersecting || en.boundingClientRect.top < 0) {
        en.target.classList.add('is-in');
        io.unobserve(en.target); revealEls.delete(en.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // IO가 놓치는 경우(점프 스크롤 등) 대비: 뷰포트에 들어온 요소를 직접 스윕
  let sweepQueued = false;
  function sweepReveals() {
    sweepQueued = false;
    revealEls.forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) {
        el.classList.add('is-in');
        io.unobserve(el); revealEls.delete(el);
      }
    });
  }
  function queueSweep() {
    if (!sweepQueued) { sweepQueued = true; requestAnimationFrame(sweepReveals); }
  }
  addEventListener('scroll', queueSweep, { passive: true });
  addEventListener('resize', queueSweep);
  addEventListener('load', queueSweep);

  /* ───── 숫자 카운트업 ───── */
  const statIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      statIO.unobserve(en.target);
      const strongs = en.target.querySelectorAll('strong[data-count]');
      strongs.forEach(s => {
        const target = +s.dataset.count, suffix = s.dataset.suffix || '';
        if (reduced) { s.textContent = target + suffix; return; }
        const t0 = performance.now(), DUR = 1400;
        (function tick(t) {
          const p = Math.min((t - t0) / DUR, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          s.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    });
  }, { threshold: 0.4 });
  const stats = document.querySelector('.stats');
  if (stats) statIO.observe(stats);

  /* ───── 워크 카드: 호버 영상 미리보기 ───── */
  document.querySelectorAll('.card').forEach(card => {
    const video = card.querySelector('.card__video');
    if (video && finePointer && !reduced) {
      card.addEventListener('mouseenter', () => {
        card.classList.add('is-preview');
        video.play().catch(() => {});
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-preview');
        video.pause();
      });
    }
  });

  /* ───── 타임라인 선 드로잉 ───── */
  const timeline = document.querySelector('.timeline');
  if (timeline && !reduced) {
    const drawTimeline = () => {
      const r = timeline.getBoundingClientRect();
      const vh = innerHeight;
      const progress = Math.min(Math.max((vh * 0.75 - r.top) / r.height, 0), 1);
      timeline.style.setProperty('--draw', (progress * 100).toFixed(1) + '%');
    };
    addEventListener('scroll', drawTimeline, { passive: true });
    addEventListener('load', drawTimeline);
    drawTimeline();
  } else if (timeline) {
    timeline.style.setProperty('--draw', '100%');
  }

  /* ───── 모달 ───── */
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');

  function openModal(key) {
    const tpl = document.getElementById('tpl-' + key);
    if (!tpl) return;
    modalContent.replaceChildren(tpl.content.cloneNode(true));
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    modalContent.querySelectorAll('video').forEach(v => v.pause());
    modalContent.replaceChildren();
  }
  document.querySelectorAll('[data-modal]').forEach(card =>
    card.addEventListener('click', () => openModal(card.dataset.modal)));
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ───── 포스터 갤러리: 드래그 스크롤 + 중앙 캡션 ───── */
  const pgal = document.getElementById('pgal');
  if (pgal) {
    const items = [...pgal.querySelectorAll('.pgal__item')];
    const capTitle = document.getElementById('pgalTitle');
    const capCat = document.getElementById('pgalCat');
    let centerRaf = null;

    function updateCenter() {
      centerRaf = null;
      const mid = pgal.scrollLeft + pgal.clientWidth / 2;
      let best = null, bestDist = Infinity;
      for (const it of items) {
        const c = it.offsetLeft + it.offsetWidth / 2;
        const d = Math.abs(c - mid);
        if (d < bestDist) { bestDist = d; best = it; }
      }
      if (!best || best.classList.contains('is-center')) return;
      items.forEach(it => it.classList.toggle('is-center', it === best));
      capTitle.textContent = best.dataset.title;
      capCat.textContent = best.dataset.cat;
    }
    let centerTimer = null;
    function queueCenter() {
      if (centerRaf === null) centerRaf = requestAnimationFrame(updateCenter);
      // rAF가 지연되는 환경 대비 폴백
      clearTimeout(centerTimer);
      centerTimer = setTimeout(updateCenter, 150);
    }
    pgal.addEventListener('scroll', queueCenter, { passive: true });
    addEventListener('resize', queueCenter);
    addEventListener('load', queueCenter);
    updateCenter();

    // 드래그로 넘기기
    let dragging = false, dragMoved = false, startX = 0, startLeft = 0;
    pgal.addEventListener('pointerdown', e => {
      dragging = true; dragMoved = false;
      startX = e.clientX; startLeft = pgal.scrollLeft;
      pgal.classList.add('is-drag');
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) dragMoved = true;
      pgal.scrollLeft = startLeft - dx;
    });
    addEventListener('pointerup', () => {
      if (dragging) { dragging = false; pgal.classList.remove('is-drag'); }
    });

    // 클릭(드래그가 아닐 때만) → 해당 프로젝트 모달
    items.forEach(it => it.addEventListener('click', () => {
      if (dragMoved || !it.dataset.modal) return;
      openModal(it.dataset.modal);
    }));
  }

  /* ───── 이메일 복사 ───── */
  const emailBtn = document.getElementById('emailBtn');
  if (emailBtn) {
    emailBtn.addEventListener('click', async () => {
      const email = emailBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        emailBtn.querySelector('.contact__copied').textContent = '복사됐어요 ✓';
      } catch {
        location.href = 'mailto:' + email;
        return;
      }
      emailBtn.classList.add('is-copied');
      setTimeout(() => emailBtn.classList.remove('is-copied'), 1800);
    });
  }
})();
