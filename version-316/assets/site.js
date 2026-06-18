(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMobileMenu() {
    var button = qs('[data-menu-toggle]');
    var menu = qs('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }

    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initInlineCardFilters() {
    qsa('[data-card-filter]').forEach(function (input) {
      var section = input.closest('.content-section') || document;
      var grid = qs('[data-card-grid]', section);
      var counter = qs('[data-filter-count]', section);
      if (!grid) {
        return;
      }

      var cards = qsa('.movie-card', grid);
      function filter() {
        var query = normalize(input.value);
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize(card.getAttribute('data-search'));
          var matched = !query || haystack.indexOf(query) !== -1;
          card.hidden = !matched;
          if (matched) {
            visible += 1;
          }
        });
        if (counter) {
          counter.textContent = visible + ' 部影片';
        }
      }

      input.addEventListener('input', filter);
      filter();
    });
  }

  function buildMovieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    if (!tags) {
      tags = '<span>' + escapeHtml(movie.type) + '</span>';
    }

    return '' +
      '<a class="movie-card" href="movie/' + movie.id + '.html">' +
        '<figure class="poster-frame">' +
          '<img src="./' + movie.coverFile + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
          '<span class="poster-badge">' + escapeHtml(movie.category) + '</span>' +
          '<span class="poster-duration">' + escapeHtml(movie.duration) + '</span>' +
          '<span class="poster-play">▶</span>' +
        '</figure>' +
        '<div class="card-body">' +
          '<h3>' + escapeHtml(movie.title) + '</h3>' +
          '<p>' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="card-meta">' +
            '<span>' + escapeHtml(movie.region) + '</span>' +
            '<span>' + escapeHtml(movie.year) + '</span>' +
            '<span>' + escapeHtml(movie.type) + '</span>' +
          '</div>' +
          '<div class="tag-row">' + tags + '</div>' +
        '</div>' +
      '</a>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var root = qs('[data-search-page]');
    if (!root || !window.MOVIE_DATA) {
      return;
    }

    var queryInput = qs('[data-search-query]', root);
    var categorySelect = qs('[data-search-category]', root);
    var regionSelect = qs('[data-search-region]', root);
    var typeSelect = qs('[data-search-type]', root);
    var yearSelect = qs('[data-search-year]', root);
    var resetButton = qs('[data-search-reset]', root);
    var results = qs('[data-search-results]', root);
    var summary = qs('[data-search-summary]', root);
    var urlParams = new URLSearchParams(window.location.search);

    if (queryInput && urlParams.get('q')) {
      queryInput.value = urlParams.get('q');
    }
    if (categorySelect && urlParams.get('category')) {
      categorySelect.value = urlParams.get('category');
    }
    if (regionSelect && urlParams.get('region')) {
      regionSelect.value = urlParams.get('region');
    }
    if (typeSelect && urlParams.get('type')) {
      typeSelect.value = urlParams.get('type');
    }
    if (yearSelect && urlParams.get('year')) {
      yearSelect.value = urlParams.get('year');
    }

    function render() {
      var query = normalize(queryInput && queryInput.value);
      var category = categorySelect && categorySelect.value;
      var region = regionSelect && regionSelect.value;
      var type = typeSelect && typeSelect.value;
      var year = yearSelect && yearSelect.value;

      var matched = window.MOVIE_DATA.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genreRaw,
          movie.oneLine,
          movie.category,
          (movie.tags || []).join(' ')
        ].join(' '));

        return (!query || haystack.indexOf(query) !== -1) &&
          (!category || movie.category === category) &&
          (!region || movie.region === region) &&
          (!type || movie.type === type) &&
          (!year || movie.year === year);
      });

      if (summary) {
        summary.textContent = '找到 ' + matched.length + ' 部影片';
      }
      if (results) {
        results.innerHTML = matched.slice(0, 240).map(buildMovieCard).join('');
        if (matched.length > 240) {
          results.insertAdjacentHTML('beforeend', '<p class="search-summary">当前显示前 240 条结果，请继续输入关键词缩小范围。</p>');
        }
      }
    }

    [queryInput, categorySelect, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', render);
        control.addEventListener('change', render);
      }
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        [queryInput, categorySelect, regionSelect, typeSelect, yearSelect].forEach(function (control) {
          if (control) {
            control.value = '';
          }
        });
        render();
      });
    }

    render();
  }

  function initPlayer() {
    var frame = qs('[data-player]');
    if (!frame) {
      return;
    }

    var video = qs('video[data-src]', frame);
    var startButton = qs('[data-player-start]', frame);
    var status = qs('[data-player-status]', frame);
    var hlsInstance = null;
    var initialized = false;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function initializeSource() {
      if (!video || initialized) {
        return Promise.resolve();
      }

      initialized = true;
      var src = video.getAttribute('data-src');
      setStatus('正在加载视频...');

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('视频加载完成。');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus('视频加载失败，请检查网络或地址。');
          }
        });
        return Promise.resolve();
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        setStatus('浏览器视频播放能力已启用。');
        return Promise.resolve();
      }

      setStatus('当前浏览器暂不支持此视频播放方式。');
      return Promise.resolve();
    }

    function playVideo() {
      initializeSource().then(function () {
        if (!video) {
          return;
        }
        var playPromise = video.play();
        frame.classList.add('is-playing');
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            setStatus('浏览器阻止自动播放，请再次点击播放器。');
            frame.classList.remove('is-playing');
          });
        }
      });
    }

    if (startButton) {
      startButton.addEventListener('click', playVideo);
    }
    if (video) {
      video.addEventListener('play', function () {
        frame.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        frame.classList.remove('is-playing');
      });
      video.addEventListener('click', function () {
        if (!initialized) {
          playVideo();
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initInlineCardFilters();
    initSearchPage();
    initPlayer();
  });
})();
