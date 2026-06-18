(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
      return;
    }
    callback();
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  ready(function () {
    var toggle = document.querySelector('.mobile-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        panel.setAttribute('aria-hidden', expanded ? 'true' : 'false');
        panel.classList.toggle('is-open', !expanded);
      });
    }

    document.querySelectorAll('.search-redirect').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        var q = input ? input.value.trim() : '';
        if (!q) {
          event.preventDefault();
          window.location.href = './search.html';
          return;
        }
        event.preventDefault();
        window.location.href = './search.html?q=' + encodeURIComponent(q);
      });
    });

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
      var current = 0;
      var show = function (index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === current);
        });
      };
      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener('click', function () {
          show(dotIndex);
        });
      });
      if (slides.length > 1) {
        window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }
    }

    var filterInput = document.querySelector('.filter-input');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.filter-target .movie-card'));
    if (filterInput && cards.length) {
      var params = new URLSearchParams(window.location.search);
      var initial = params.get('q') || '';
      if (initial) {
        filterInput.value = initial;
      }
      var applyFilter = function () {
        var q = normalize(filterInput.value);
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-tags'),
            card.textContent
          ].join(' '));
          card.classList.toggle('is-hidden-card', q && haystack.indexOf(q) === -1);
        });
      };
      filterInput.addEventListener('input', applyFilter);
      applyFilter();
    }
  });

  window.initMoviePlayer = function (sourceUrl) {
    ready(function () {
      var video = document.getElementById('moviePlayer');
      var layer = document.getElementById('playLayer');
      var button = document.getElementById('playButton');
      var hlsInstance = null;
      var attached = false;
      if (!video || !sourceUrl) {
        return;
      }
      var attach = function () {
        if (attached) {
          return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(sourceUrl);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = sourceUrl;
        } else {
          video.src = sourceUrl;
        }
      };
      var start = function () {
        attach();
        if (layer) {
          layer.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      };
      if (layer) {
        layer.addEventListener('click', start);
      }
      if (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          start();
        });
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener('play', function () {
        if (layer) {
          layer.classList.add('is-hidden');
        }
      });
      video.addEventListener('ended', function () {
        if (layer) {
          layer.classList.remove('is-hidden');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  };
})();
