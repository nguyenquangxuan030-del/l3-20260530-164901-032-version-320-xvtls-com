(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");

  if (header && toggle) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("nav-open");
    });
  }

  const hero = document.querySelector("[data-hero]");

  if (hero) {
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    let current = 0;

    const showSlide = function (next) {
      current = (next + slides.length) % slides.length;
      slides.forEach(function (slide, index) {
        slide.classList.toggle("active", index === current);
      });
      dots.forEach(function (dot, index) {
        dot.classList.toggle("active", index === current);
      });
    };

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }
  }

  const searchInputs = Array.from(document.querySelectorAll(".movie-search"));

  searchInputs.forEach(function (input) {
    input.addEventListener("input", function () {
      const value = input.value.trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll(".movie-card"));

      cards.forEach(function (card) {
        const text = ((card.getAttribute("data-title") || "") + " " + (card.getAttribute("data-meta") || "") + " " + card.textContent).toLowerCase();
        card.classList.toggle("hidden-by-search", value.length > 0 && !text.includes(value));
      });
    });
  });

  const player = document.querySelector("[data-player]");

  if (player) {
    const video = player.querySelector("video");
    const trigger = player.querySelector("[data-play]");
    const stream = player.getAttribute("data-stream");
    let hlsInstance = null;

    const startPlayback = function () {
      if (!video || !stream) {
        return;
      }

      player.classList.add("is-playing");

      if (window.Hls && window.Hls.isSupported()) {
        if (!hlsInstance) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.play().catch(function () {});
        }
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        if (video.src !== stream) {
          video.src = stream;
        }
        video.play().catch(function () {});
      } else {
        window.location.href = stream;
      }
    };

    if (trigger) {
      trigger.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        startPlayback();
      }
    });
  }
})();
