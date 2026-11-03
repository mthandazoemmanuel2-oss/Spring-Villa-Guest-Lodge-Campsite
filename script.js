document.addEventListener('DOMContentLoaded', () => {
  const revealTargets = document.querySelectorAll(
    '.listing-card, .activity-card, .stay-card, .gallery-item, .camping-layout'
  );
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.room-card-image').forEach((gallery) => {
    const image = gallery.querySelector('img[data-gallery-images]');
    if (!image) return;

    const count = gallery.querySelector('[data-gallery-count]');
    const previous = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    const images = image.dataset.galleryImages.split('|').filter(Boolean);
    const originalAlt = image.alt;
    let activeIndex = 0;

    const showImage = (index) => {
      activeIndex = (index + images.length) % images.length;
      image.classList.add('is-changing');
      image.src = images[activeIndex];
      image.alt = `${originalAlt}, photo ${activeIndex + 1} of ${images.length}`;
      count.textContent = `${activeIndex + 1} / ${images.length}`;
      image.addEventListener('load', () => image.classList.remove('is-changing'), { once: true });
    };

    previous.addEventListener('click', () => showImage(activeIndex - 1));
    next.addEventListener('click', () => showImage(activeIndex + 1));
  });

  document.addEventListener('click', (event) => {
    if (reducedMotion) return;
    const action = event.target.closest(
      'button, .primary-btn, .secondary-btn, .card-link, .stay-details-link, .homepage-guide-card'
    );
    if (!action) return;

    action.classList.remove('interaction-feedback');
    window.requestAnimationFrame(() => action.classList.add('interaction-feedback'));
    window.setTimeout(() => action.classList.remove('interaction-feedback'), 360);
  });

  const heroPhotos = [
    'Spring Villa...11.jpg',
    'Spring Villa...5.jpg',
    'Spring Villa...6.jpg',
    'Spring Villa...7.jpg',
    'Spring Villa...8.jpg',
    'Spring Villa...9.jpg',
    'Spring Villa...10.jpg',
  ];
  const heroLayers = document.querySelectorAll('.hero-photo');

  if (heroLayers.length === 2) {
    let activeLayer = heroLayers[0];
    let inactiveLayer = heroLayers[1];
    let nextPhoto = 1;
    activeLayer.style.backgroundImage = `url("${heroPhotos[0]}")`;
    inactiveLayer.style.backgroundImage = `url("${heroPhotos[nextPhoto]}")`;
    activeLayer.classList.add('is-active');

    if (!reducedMotion && heroPhotos.length > 1) {
      window.setInterval(() => {
        if (document.hidden) return;

        inactiveLayer.classList.add('is-active');
        activeLayer.classList.remove('is-active');
        [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];
        nextPhoto = (nextPhoto + 1) % heroPhotos.length;
        const layerToPrepare = inactiveLayer;
        window.setTimeout(() => {
          layerToPrepare.style.backgroundImage = `url("${heroPhotos[nextPhoto]}")`;
        }, 1700);
      }, 10000);
    }
  }

  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

    revealTargets.forEach((target) => {
      target.classList.add('scroll-reveal');
      revealObserver.observe(target);
    });
  }

  const wishlistButtons = document.querySelectorAll('.stay-wishlist[data-wishlist-id]');
  const wishlistStatus = document.getElementById('wishlistStatus');

  if (wishlistButtons.length > 0) {
    let wishlist;
    let wishlistAvailable = true;

    try {
      const savedWishlist = window.localStorage.getItem('springVillaWishlist');
      wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      if (!Array.isArray(wishlist) || wishlist.some((item) => typeof item !== 'string')) {
        throw new Error('Saved wishlist data is invalid.');
      }
    } catch (error) {
      wishlistAvailable = false;
      wishlistButtons.forEach((button) => { button.disabled = true; });
      wishlistStatus.textContent = `Wishlist is unavailable in this browser: ${error.message}`;
    }

    if (wishlistAvailable) {
      wishlistButtons.forEach((button) => {
        const accommodationId = button.dataset.wishlistId;
        const accommodationName = button.dataset.wishlistName;
        const isSaved = wishlist.includes(accommodationId);
        button.setAttribute('aria-pressed', String(isSaved));
        button.setAttribute(
          'aria-label',
          `${isSaved ? 'Remove' : 'Add'} ${accommodationName} ${isSaved ? 'from' : 'to'} wishlist`
        );

        button.addEventListener('click', () => {
          const currentlySaved = wishlist.includes(accommodationId);
          const updatedWishlist = currentlySaved
            ? wishlist.filter((item) => item !== accommodationId)
            : [...wishlist, accommodationId];

          try {
            window.localStorage.setItem('springVillaWishlist', JSON.stringify(updatedWishlist));
            wishlist = updatedWishlist;
            button.setAttribute('aria-pressed', String(!currentlySaved));
            button.setAttribute(
              'aria-label',
              `${currentlySaved ? 'Add' : 'Remove'} ${accommodationName} ${currentlySaved ? 'to' : 'from'} wishlist`
            );
            wishlistStatus.textContent = currentlySaved
              ? `${accommodationName} removed from your wishlist.`
              : `${accommodationName} saved to your wishlist on this device.`;
          } catch (error) {
            wishlistStatus.textContent = `Could not update wishlist: ${error.message}`;
          }
        });
      });
    }
  }

  const mapFrame = document.getElementById('springVillaMap');
  const mapLayerButtons = document.querySelectorAll('[data-map-layer]');

  if (mapFrame && mapLayerButtons.length > 0) {
    const mapQuery = encodeURIComponent('Spring Villa Guest Lodge and Campsite, Victoria Falls, Zimbabwe');

    mapLayerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const layer = button.dataset.mapLayer;
        if (layer !== 'm' && layer !== 'k') return;

        mapFrame.src = `https://maps.google.com/maps?q=${mapQuery}&t=${layer}&z=14&output=embed`;
        mapLayerButtons.forEach((candidate) => {
          if (candidate.hasAttribute('data-map-layer')) {
            candidate.setAttribute('aria-pressed', String(candidate === button));
          }
        });
      });
    });
  }

  const form = document.querySelector('.search-bar');

  if (form) {
    const checkIn = form.querySelector('input[aria-label="Check-in date"]');
    const checkOut = form.querySelector('input[aria-label="Check-out date"]');
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    checkIn.min = todayString;
    checkOut.min = todayString;
    checkIn.addEventListener('change', () => {
      checkOut.min = checkIn.value || todayString;
      if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = '';
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      if (checkOut.value <= checkIn.value) {
        checkOut.setCustomValidity('Choose a check-out date after check-in.');
        checkOut.reportValidity();
        checkOut.setCustomValidity('');
        return;
      }

      const guests = form.querySelector('select[aria-label="Guests"]').value.replace(' guests', '');
      const selectedStay = form.querySelector('select[aria-label="Accommodation type"]').value;
      const stayType = {
        'All stays': 'standard-room',
        Rooms: 'standard-room',
        Camping: 'campsite',
        'Family units': 'family-unit',
      }[selectedStay];
      const params = new URLSearchParams({
        stay: stayType,
        checkIn: checkIn.value,
        checkOut: checkOut.value,
        guests,
      });

      window.location.href = `booking.html?${params}`;
    });
  }
});
