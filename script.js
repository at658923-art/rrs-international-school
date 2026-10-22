(() => {
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Keep the single theme control connected to the complete document theme.
  const themeToggle = document.querySelector('#theme-toggle');
  const applyTheme = (isDark, persist = false) => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-pressed', String(isDark));
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
    if (persist) {
      try {
        localStorage.setItem('rrs-theme', isDark ? 'dark' : 'light');
      } catch {
        // The page still switches themes when browser storage is unavailable.
      }
    }
  };

  if (themeToggle) {
    applyTheme(document.documentElement.dataset.theme === 'dark');
    themeToggle.addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme !== 'dark', true);
    });
  }

  // A one-time-per-tab welcome: the school crest travels into the navbar as
  // the visitor scrolls, while the homepage appears underneath.
  const logoIntro = document.querySelector('#logo-intro');
  let introActive = false;
  if (
    logoIntro &&
    document.documentElement.classList.contains('intro-pending') &&
    typeof logoIntro.showModal === 'function'
  ) {
    const introCrest = document.querySelector('#logo-intro-crest');
    const enterButton = document.querySelector('#logo-intro-enter');
    let introLeaving = false;
    introActive = true;

    const finishIntro = () => {
      if (introLeaving) return;
      introLeaving = true;
      const destination = document.querySelector('.brand img');
      const from = introCrest?.getBoundingClientRect();
      const to = destination?.getBoundingClientRect();

      if (introCrest && from && to) {
        const moveX = to.left + to.width / 2 - (from.left + from.width / 2);
        const moveY = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = to.width / from.width;
        introCrest.style.transform =
          'translate(-50%, -50%) translate(' + moveX + 'px, ' +
          moveY + 'px) scale(' + scale + ')';
      }

      logoIntro.classList.add('is-exiting');
      try {
        sessionStorage.setItem('rrs-intro-seen', '1');
      } catch {
        // The intro still completes if browser storage is unavailable.
      }

      window.setTimeout(() => {
        logoIntro.close();
        introActive = false;
        document.documentElement.classList.remove('intro-pending');
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('rrs:intro-complete'));
      }, reduceMotion ? 0 : 760);
    };

    const beginIntroExit = (event) => {
      if (!introActive) return;
      if (event.cancelable) event.preventDefault();
      finishIntro();
    };

    logoIntro.addEventListener('cancel', (event) => {
      event.preventDefault();
      finishIntro();
    });
    enterButton?.addEventListener('click', finishIntro);
    window.addEventListener('wheel', beginIntroExit, { passive: false });
    window.addEventListener('touchmove', beginIntroExit, { passive: false });
    window.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) {
        beginIntroExit(event);
      }
    });

    try {
      logoIntro.showModal();
      enterButton?.focus({ preventScroll: true });
    } catch {
      introActive = false;
      document.documentElement.classList.remove('intro-pending');
    }
  } else {
    document.documentElement.classList.remove('intro-pending');
  }

  // Simplify expensive visual effects on devices with limited resources.
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const limitedDevice = navigator.deviceMemory <= 4 || navigator.hardwareConcurrency <= 4 || connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType);
  if (limitedDevice) document.documentElement.classList.add('performance-lite');

  // Reveal sections when they enter the viewport.
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -35px 0px'
      }
    );

    document.documentElement.classList.add('js-anim');
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) =>
      item.classList.add('is-visible')
    );
  }

  // Mobile navigation.
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.nav-links');

  const closeMenu = () => {
    if (!menuButton || !navigation) return;

    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const expanded =
        menuButton.getAttribute('aria-expanded') === 'true';

      menuButton.setAttribute(
        'aria-expanded',
        String(!expanded)
      );

      navigation.classList.toggle('is-open', !expanded);
      document.body.classList.toggle('menu-open', !expanded);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  // Custom cursor follower.
  const finePointer = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (min-width: 721px)'
  );

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');

  if (finePointer.matches && dot && ring && !reduceMotion) {
    let pointerX = -100;
    let pointerY = -100;
    let ringX = -100;
    let ringY = -100;
    let frame = 0;

    const moveFollower = () => {
      ringX += (pointerX - ringX) * 0.22;
      ringY += (pointerY - ringY) * 0.22;

      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      if (
        Math.abs(pointerX - ringX) +
          Math.abs(pointerY - ringY) <
        0.4
      ) {
        frame = 0;
        return;
      }

      frame = requestAnimationFrame(moveFollower);
    };

    document.addEventListener(
      'pointermove',
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        dot.style.left = `${pointerX}px`;
        dot.style.top = `${pointerY}px`;

        document.body.classList.add('cursor-active');

        if (!frame) {
          frame = requestAnimationFrame(moveFollower);
        }
      },
      { passive: true }
    );

    document.addEventListener('pointerleave', () => {
      document.body.classList.remove('cursor-active');
    });

    document.querySelectorAll(
      'a, button, select, input, textarea, summary'
    ).forEach((target) => {
      target.addEventListener('pointerenter', () => {
        document.body.classList.add('cursor-hover');
      });

      target.addEventListener('pointerleave', () => {
        document.body.classList.remove('cursor-hover');
      });
    });

    document.querySelectorAll('.gallery-item').forEach((target) => {
      target.addEventListener('pointerdown', () => {
        document.body.classList.add('cursor-drag');
      });

      target.addEventListener('pointerup', () => {
        document.body.classList.remove('cursor-drag');
      });

      target.addEventListener('pointerleave', () => {
        document.body.classList.remove('cursor-drag');
      });
    });
  }

  // School photo gallery and lightbox.
  const photoButtons = [
    ...document.querySelectorAll('.gallery-item')
  ];

  const lightbox = document.querySelector('#lightbox');

  if (lightbox && photoButtons.length > 0) {
    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('figcaption');
    const lightboxCount = lightbox.querySelector('.lightbox-count');
    const closeButton = lightbox.querySelector('.lightbox-close');
    const prevButton = lightbox.querySelector('.lightbox-prev');
    const nextButton = lightbox.querySelector('.lightbox-next');

    let activePhoto = 0;

    const showPhoto = (index) => {
      activePhoto =
        (index + photoButtons.length) % photoButtons.length;

      const button = photoButtons[activePhoto];
      const image = button.querySelector('img');

      if (lightboxImage) {
        lightboxImage.src = button.dataset.full || image.src;
        lightboxImage.alt = image.alt;
      }

      if (lightboxCaption) {
        lightboxCaption.textContent =
          button.dataset.caption || image.alt;
      }

      if (lightboxCount) {
        lightboxCount.textContent =
          `${String(activePhoto + 1).padStart(2, '0')} / ` +
          `${String(photoButtons.length).padStart(2, '0')}`;
      }
    };

    photoButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        showPhoto(index);

        if (typeof lightbox.showModal === 'function') {
          lightbox.showModal();
        }
      });
    });

    if (closeButton) {
      closeButton.addEventListener('click', () => lightbox.close());
    }

    if (prevButton) {
      prevButton.addEventListener('click', () =>
        showPhoto(activePhoto - 1)
      );
    }

    if (nextButton) {
      nextButton.addEventListener('click', () =>
        showPhoto(activePhoto + 1)
      );
    }

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        showPhoto(activePhoto - 1);
      }

      if (event.key === 'ArrowRight') {
        showPhoto(activePhoto + 1);
      }
    });
  }

  const musicToggle = document.querySelector('#music-toggle');
  const schoolMusic = document.querySelector('#school-music');
  const musicPlayer = document.querySelector('#music-player');
  const musicCollapse = document.querySelector('#music-collapse');
  const musicSeek = document.querySelector('#music-seek');
  const musicCurrent = document.querySelector('.music-current');
  const musicDuration = document.querySelector('.music-duration');

  if (musicToggle && schoolMusic) {
    const musicLabel = musicToggle.querySelector('.music-label');
    let musicStartedByVisitor = false;
    const avoidAutoplayForConnection = connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType) || navigator.deviceMemory <= 2;
    const setMusicState = (playing, label) => {
      musicToggle.setAttribute('aria-pressed', String(playing));
      musicToggle.setAttribute('aria-label', label);
      musicPlayer?.classList.toggle('is-playing', playing);
      if (musicLabel) musicLabel.textContent = label;
    };

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
      const wholeSeconds = Math.floor(seconds);
      return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
    };

    const updateTimeline = () => {
      const duration = schoolMusic.duration;
      const hasDuration = Number.isFinite(duration) && duration > 0;
      if (musicSeek) {
        musicSeek.disabled = !hasDuration;
        musicSeek.value = hasDuration
          ? String((schoolMusic.currentTime / duration) * 100)
          : '0';
      }
      if (musicCurrent) musicCurrent.textContent = formatTime(schoolMusic.currentTime);
      if (musicDuration) musicDuration.textContent = formatTime(duration);
    };

    const startMusic = async (fromVisitor = false) => {
      try {
        if (fromVisitor) musicStartedByVisitor = true;
        if (schoolMusic.error) schoolMusic.load();
        schoolMusic.volume = 0.12;
        // Muted autoplay is permitted by more browsers. Try to make it audible
        // at a gentle level once playback begins; a visitor gesture retries it
        // unmuted if their browser requires that.
        schoolMusic.muted = !fromVisitor;
        await schoolMusic.play();
        if (!fromVisitor) window.setTimeout(() => { schoolMusic.muted = false; }, 250);
        setMusicState(true, 'Pause school music');
        return true;
      } catch (error) {
        setMusicState(false, schoolMusic.error ? 'Music file could not load' : 'Tap to play music');
        return false;
      }
    };

    schoolMusic.addEventListener('playing', () => {
      setMusicState(true, 'Pause school music');
      updateTimeline();
    });
    schoolMusic.addEventListener('pause', () => setMusicState(false, 'Play school music'));
    schoolMusic.addEventListener('error', () => setMusicState(false, 'Music file could not load'));
    schoolMusic.addEventListener('timeupdate', updateTimeline);
    schoolMusic.addEventListener('loadedmetadata', updateTimeline);
    schoolMusic.addEventListener('durationchange', updateTimeline);

    musicSeek?.addEventListener('input', () => {
      if (Number.isFinite(schoolMusic.duration) && schoolMusic.duration > 0) {
        schoolMusic.currentTime = (Number(musicSeek.value) / 100) * schoolMusic.duration;
        updateTimeline();
      }
    });

    musicCollapse?.addEventListener('click', () => {
      musicPlayer?.classList.remove('is-expanded');
      musicToggle.setAttribute('aria-expanded', 'false');
    });

    const startOnFirstInteraction = (event) => {
      document.removeEventListener('pointerdown', startOnFirstInteraction);
      document.removeEventListener('keydown', startOnFirstInteraction);
      if (avoidAutoplayForConnection) return;
      if (event.target instanceof Element && event.target.closest('#music-toggle, #theme-toggle, #logo-intro')) return;
      startMusic(true);
    };

    // Attempt default playback after the page loads. Browsers may require a
    // gesture, so the first ordinary tap or key press starts it automatically.
    const attemptDefaultPlayback = () => {
      if (document.documentElement.classList.contains('intro-pending')) {
        window.addEventListener('rrs:intro-complete', attemptDefaultPlayback, { once: true });
        return;
      }
      document.addEventListener('pointerdown', startOnFirstInteraction, { passive: true });
      document.addEventListener('keydown', startOnFirstInteraction);
      const startWhenIdle = () => {
        if (!musicStartedByVisitor) startMusic();
      };
      if (avoidAutoplayForConnection) {
        setMusicState(false, 'Tap to play school music');
      } else if ('requestIdleCallback' in window) {
        window.requestIdleCallback(startWhenIdle, { timeout: 3000 });
      } else {
        window.setTimeout(startWhenIdle, 1500);
      }
    };
    if (document.readyState === 'complete') {
      attemptDefaultPlayback();
    } else {
      window.addEventListener('load', attemptDefaultPlayback, { once: true });
    }

    musicToggle.addEventListener('click', async () => {
      musicPlayer?.classList.add('is-expanded');
      musicToggle.setAttribute('aria-expanded', 'true');
      // Some browsers clear the paused flag while waiting for the first audio
      // bytes. Treat that as not playing so a click always retries playback.
      if (!schoolMusic.paused && schoolMusic.currentTime > 0 && !schoolMusic.muted) {
        schoolMusic.pause();
        setMusicState(false, 'Play school music');
      } else {
        await startMusic(true);
      }
    });
  }

  // B-roll media stays unloaded until a visitor chooses to play it.
  document.querySelectorAll('.broll-play').forEach((button) => {
    button.addEventListener('click', () => {
      const frame = button.closest('.broll-frame');
      const video = document.createElement('video');
      video.controls = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-label', button.getAttribute('aria-label') || 'School-life video');
      video.src = button.dataset.videoSrc;
      frame.replaceChildren(video);
      video.play().catch(() => {
        video.controls = true;
      });
    });
  });

  // Google Sheets enquiry form.
  const form = document.querySelector('#enquiry-form');
  const formStatus = document.querySelector('#form-status');
  const cookieNotice = document.querySelector('#cookie-notice');
  const cookieChoiceName = 'rrs_cookie_choice';
  const cookieDismissKey = 'rrs-cookie-dismissed-this-tab';

  // Remove enquiry drafts created by the previous optional browser-save feature.
  try {
    sessionStorage.removeItem('rrs-enquiry-draft-v1');
    sessionStorage.removeItem('rrs-enquiry-draft-opt-in');
  } catch (error) {
    // Storage can be disabled; no enquiry data is written by this version.
  }

  function hasCookie(name) {
    return document.cookie.split(';').some((part) => part.trim().startsWith(`${name}=`));
  }

  if (cookieNotice) {
    let dismissedThisTab = false;
    try {
      dismissedThisTab = sessionStorage.getItem(cookieDismissKey) === 'yes';
    } catch (error) {
      // If storage is unavailable, the notice still works for this page view.
    }

    if (!hasCookie(cookieChoiceName) && !dismissedThisTab) cookieNotice.hidden = false;

    document.querySelector('#cookie-accept')?.addEventListener('click', () => {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${cookieChoiceName}=essential; Max-Age=15552000; Path=/; SameSite=Lax${secure}`;
      cookieNotice.hidden = true;
    });

    document.querySelector('#cookie-dismiss')?.addEventListener('click', () => {
      try {
        sessionStorage.setItem(cookieDismissKey, 'yes');
      } catch (error) {
        // Hide the notice for this page view even when storage is unavailable.
      }
      cookieNotice.hidden = true;
    });
  }

  // Your Google Apps Script Web App URL.
  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzncilFfeTOaWa6apmnqCpODSK6pYsucUn7_qrUjttPCh95aIVES_az6ZDr1Sa9_LI-/exec';

  // A single state renderer keeps the form's feedback consistent and accessible.
  const stateIcons = {
    info: '<circle cx="20" cy="20" r="14"/><path d="M20 18v9m0-15h.01"/>',
    loading: '<circle class="state-spinner-track" cx="20" cy="20" r="14"/><path class="state-spinner" d="M20 6a14 14 0 0 1 14 14"/><path d="m13 24 7-12 7 12m-10-6h6m-10 10h14"/>',
    pending: '<circle cx="20" cy="20" r="14"/><path d="M20 11v10l6 3"/>',
    success: '<path class="success-check" d="M9 20.5 16 27l15-16"/><circle cx="20" cy="20" r="15"/>',
    error: '<path d="M20 7v15m0 6h.01"/><path d="M17.4 5.8 4.8 27.2A3 3 0 0 0 7.4 32h25.2a3 3 0 0 0 2.6-4.8L22.6 5.8a3 3 0 0 0-5.2 0Z"/>',
    offline: '<path d="M7 14a20 20 0 0 1 21-4m-18 10a13 13 0 0 1 10-4m-7 10a5 5 0 0 1 5-1"/><path d="m7 7 26 26"/>'
  };

  function setFormState(type, message, actions = []) {
    if (!formStatus) return;
    const symbol = formStatus.querySelector('.state-symbol');
    const copy = formStatus.querySelector('.state-copy');
    const actionBox = formStatus.querySelector('.form-state-actions');
    const icon = stateIcons[type] || stateIcons.info;
    symbol.innerHTML = `<svg class="state-svg" viewBox="0 0 40 40" aria-hidden="true">${icon}</svg>`;
    copy.textContent = message;
    formStatus.className = `form-status is-${type}`;
    actionBox.replaceChildren();
    actionBox.hidden = actions.length === 0;
    actions.forEach(({ label, href, onClick }) => {
      const action = href ? document.createElement('a') : document.createElement('button');
      action.textContent = label;
      action.className = 'form-state-action';
      if (href) {
        action.href = href;
      } else {
        action.type = 'button';
        action.addEventListener('click', onClick);
      }
      actionBox.append(action);
    });
  }

  // A retry verifies that this site's assets can be reached; it never resends a form.
  const networkState = document.querySelector('#network-state');
  const networkTitle = document.querySelector('#network-title');
  const networkMessage = document.querySelector('#network-message');
  const networkRetry = document.querySelector('#network-retry');
  let networkProbeRunning = false;

  async function probeConnection() {
    if (!networkState || networkProbeRunning) return;
    networkProbeRunning = true;
    networkRetry.disabled = true;
    networkRetry.textContent = 'Checking…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const probeUrl = new URL('optimized-assets/logo.png', document.baseURI);
      probeUrl.searchParams.set('connection-check', String(Date.now()));
      const response = await fetch(probeUrl, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Site asset unavailable');
      networkState.classList.remove('is-offline');
      networkState.classList.add('is-reconnected');
      networkTitle.textContent = 'Connection restored';
      networkMessage.textContent = 'The school website is reachable again.';
      networkRetry.textContent = 'Connected';
      window.setTimeout(() => {
        networkState.hidden = true;
        networkState.classList.remove('is-reconnected');
      }, 1800);
    } catch {
      networkState.hidden = false;
      networkState.classList.remove('is-reconnected');
      networkState.classList.add('is-offline');
      networkTitle.textContent = navigator.onLine ? 'Website could not be reached' : 'Connection interrupted';
      networkMessage.textContent = navigator.onLine
        ? 'Your device is online, but this page could not reach its host. Check again in a moment.'
        : 'Check your internet connection, then try again.';
      networkRetry.textContent = 'Retry connection';
    } finally {
      window.clearTimeout(timeout);
      networkRetry.disabled = false;
      networkProbeRunning = false;
    }
  }

  networkRetry?.addEventListener('click', probeConnection);
  window.addEventListener('offline', () => {
    if (!networkState) return;
    networkState.hidden = false;
    networkState.classList.remove('is-reconnected');
    networkState.classList.add('is-offline');
    networkTitle.textContent = 'Connection interrupted';
    networkMessage.textContent = 'If you just sent an enquiry, its delivery may be uncertain. Check with the school before sending again.';
    networkRetry.textContent = 'Retry connection';
  });
  window.addEventListener('online', probeConnection);
  if (!navigator.onLine && networkState) {
    networkState.hidden = false;
    networkState.classList.add('is-offline');
    networkMessage.textContent = 'You are offline. Enquiries will not be sent until your connection returns.';
  }

  if (form && formStatus) {
    const controls = [...form.querySelectorAll('input, select, textarea')];
    const mobileField = form.querySelector('[name="mobile"]');
    const submitButton = form.querySelector('button[type="submit"]');
    const callSchoolAction = { label: 'Call the school', href: 'tel:+919123470121' };
    let submitting = false;
    let deliveryUnconfirmed = false;
    let slowTimer = 0;

    controls.forEach((control, index) => {
      const error = document.createElement('span');
      error.className = 'field-error';
      error.id = `${control.id || `enquiry-field-${index + 1}`}-error`;
      error.hidden = true;
      error.setAttribute('aria-live', 'polite');
      const consentLabel = control.closest('.consent-row');
      (consentLabel || control).insertAdjacentElement('afterend', error);
      const describedBy = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      control.setAttribute('aria-describedby', [...describedBy, error.id].join(' '));
    });

    function validateField(control) {
      let message = '';
      if (control === mobileField && control.value.trim() && !/^(?:\+91[ -]?)?[6-9][0-9]{9}$/.test(control.value.trim())) {
        message = 'Enter a valid 10-digit Indian mobile number, optionally starting with +91.';
      } else if (!control.checkValidity()) {
        message = control.validationMessage || 'Please complete this field.';
      }
      const error = form.querySelector(`#${CSS.escape(control.id)}-error`);
      control.setAttribute('aria-invalid', String(Boolean(message)));
      error.textContent = message;
      error.hidden = !message;
      return !message;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting || deliveryUnconfirmed) return;

      const invalidControl = controls.find((control) => !validateField(control));
      if (invalidControl) {
        setFormState('error', 'Please review the highlighted fields and try again.');
        invalidControl.focus();
        return;
      }

      if (!navigator.onLine) {
        setFormState('offline', 'Your device is offline. The enquiry has not been sent. Reconnect and try again.');
        networkState?.removeAttribute('hidden');
        networkTitle && (networkTitle.textContent = 'You are offline');
        networkMessage && (networkMessage.textContent = 'Reconnect before sending your enquiry.');
        return;
      }

      // Validate the URL format.
      if (
        !GOOGLE_SCRIPT_URL.startsWith(
          'https://script.google.com/macros/s/'
        ) ||
        !GOOGLE_SCRIPT_URL.endsWith('/exec')
      ) {
        setFormState('error', 'The enquiry connection is not configured correctly. Please call the school.');
        return;
      }

      const classSelect = form.querySelector('[name="stage"]');

      const data = {
parentName: form.querySelector('[name="parentName"]').value.trim(),
studentName: form.querySelector('[name="studentName"]').value.trim(),
phone: form.querySelector('[name="mobile"]').value.trim(),
email: form.querySelector('[name="email"]').value.trim(),
studentClass: classSelect.selectedOptions[0].text,
enquiryType:
classSelect.value === 'general'
? 'General enquiry'
: 'Admissions enquiry',
message: form.querySelector('[name="message"]').value.trim()
};


      submitting = true;
      submitButton.disabled = true;
      form.setAttribute('aria-busy', 'true');
      setFormState('loading', 'Sending your enquiry securely to the school…');
      slowTimer = window.setTimeout(() => {
        if (submitting) {
          formStatus.classList.add('is-slow');
          formStatus.querySelector('.state-copy').textContent = 'This is taking longer than expected. Please keep this page open; your details are still here.';
        }
      }, 1600);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          signal: controller.signal,
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(data)
        });

        // An opaque response means the spreadsheet's saved result is not readable.
        deliveryUnconfirmed = true;
        if (response.type !== 'opaque') {
          let result = {};
          try { result = await response.json(); } catch { /* A non-JSON result is not a save confirmation. */ }
          if (response.ok && (result.saved === true || result.success === true)) {
            submitButton.textContent = 'Enquiry saved';
            setFormState('success', 'The school’s enquiry service confirmed that your details were saved. The school team can follow up with you.', [callSchoolAction]);
          } else {
            submitButton.textContent = 'Successfully Submitted';
            setFormState('error', response.status >= 500
              ? 'The school enquiry service is available. Your details remain in the form; contact the school for more enquiry.'
              : 'The enquiry service did  confirm that the spreadsheet saved your details. Please call the school before submitting again.', [callSchoolAction]);
          }
        } else {
          submitButton.textContent = 'Successfully Submitted';
          setFormState('successful', 'The request reached the school’s web endpoint, but its spreadsheet response is hidden from this page. The enquiry is  confirmed as saved. Please call the school before submitting again.', [callSchoolAction]);
        }
      } catch (error) {
        deliveryUnconfirmed = true;
        submitButton.textContent = 'Check before retrying';
        const timedOut = error?.name === 'AbortError';
        setFormState(timedOut ? 'timeout' : 'error', timedOut
          ? 'No confirmation arrived within 20 seconds. The request may still have reached the school, so call to check before retrying.'
          : 'The connection failed before a response could be read. The request may have reached the school; call to check before retrying.', [
            callSchoolAction,
            { label: 'I checked; retry enquiry', onClick: () => {
              deliveryUnconfirmed = false;
              submitButton.disabled = false;
              submitButton.textContent = 'Send enquiry';
              setFormState('info', 'Your details are still in the form. You can submit again after checking with the school.');
              form.requestSubmit();
            } }
          ]);
      } finally {
        window.clearTimeout(timeout);
        window.clearTimeout(slowTimer);
        submitting = false;
        submitButton.disabled = deliveryUnconfirmed;
        form.removeAttribute('aria-busy');
      }
    });

    controls.forEach((control) => {
      const clearInvalidState = () => {
        if (control.getAttribute('aria-invalid') === 'true') validateField(control);
      };
      control.addEventListener('input', clearInvalidState);
      control.addEventListener('change', clearInvalidState);
    });
  }

  // Current year in the footer.
  const year = document.querySelector('#year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

})();






