(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMobileMenu() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        restart();
      });
    });
    show(0);
    restart();
  }

  function initFilterCards() {
    var input = document.querySelector("[data-card-filter]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
    var count = document.querySelector("[data-filter-count]");
    if (!input || !cards.length) {
      return;
    }

    function applyFilter() {
      var query = input.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre")
        ].join(" ").toLowerCase();
        var matched = !query || haystack.indexOf(query) !== -1;
        card.style.display = matched ? "" : "none";
        if (matched) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = String(visible);
      }
    }

    input.addEventListener("input", applyFilter);
    applyFilter();
  }

  function getQuery(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderSearchCard(movie) {
    return [
      '<article class="movie-card movie-card--medium" data-filter-card>',
      '  <a class="movie-card-link" href="movies/movie-' + movie.id + '.html" title="' + escapeHtml(movie.title) + ' 在线观看">',
      '    <div class="poster-wrap">',
      '      <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + ' 海报" loading="lazy">',
      '      <span class="pill pill-top">' + escapeHtml(movie.type) + '</span>',
      '      <span class="rating-badge">★ ' + escapeHtml(movie.rating) + '</span>',
      '      <span class="play-float">▶</span>',
      '    </div>',
      '    <div class="movie-card-body">',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine) + '</p>',
      '      <div class="card-meta">',
      '        <span>' + escapeHtml(movie.year) + '</span>',
      '        <span>' + escapeHtml(movie.region) + '</span>',
      '        <span>' + escapeHtml(movie.genreRaw) + '</span>',
      '      </div>',
      '    </div>',
      '  </a>',
      '  <a class="category-chip" href="categories/' + movie.categorySlug + '.html">' + escapeHtml(movie.category) + '</a>',
      '</article>'
    ].join("
");
  }

  function initSearchPage() {
    var form = document.querySelector("[data-search-form]");
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");
    var summary = document.querySelector("[data-search-summary]");
    if (!form || !input || !results || !window.MOVIES_INDEX) {
      return;
    }

    function applySearch(query) {
      var value = query.trim().toLowerCase();
      var list = window.MOVIES_INDEX;
      if (value) {
        list = list.filter(function (movie) {
          return [
            movie.title,
            movie.oneLine,
            movie.summary,
            movie.region,
            movie.type,
            movie.genreRaw,
            movie.tags.join(" "),
            movie.year
          ].join(" ").toLowerCase().indexOf(value) !== -1;
        });
      }
      var limited = list.slice(0, 240);
      results.innerHTML = limited.map(renderSearchCard).join("
") || '<div class="empty-state">没有找到匹配影片，请换一个关键词。</div>';
      if (summary) {
        summary.textContent = value
          ? '找到 ' + list.length + ' 部影片，当前展示前 ' + limited.length + ' 部。'
          : '输入关键词可以按片名、简介、类型、地区或标签检索，默认展示前 240 部影片。';
      }
    }

    var initialQuery = getQuery("q");
    input.value = initialQuery;
    applySearch(initialQuery);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = input.value.trim();
      var url = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
      history.replaceState(null, '', url);
      applySearch(query);
    });
  }

  function initPlayer() {
    var video = document.querySelector("[data-hls-video]");
    var start = document.querySelector("[data-player-start]");
    var overlay = document.querySelector("[data-player-overlay]");
    var message = document.querySelector("[data-player-message]");
    if (!video) {
      return;
    }
    var source = video.getAttribute("data-src");
    var initialized = false;
    var hlsInstance = null;

    function setMessage(text) {
      if (message) {
        message.textContent = text;
      }
    }

    function setupSource() {
      if (initialized || !source) {
        return;
      }
      initialized = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setMessage("播放源已载入，可开始播放。");
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage("播放源载入异常，已尝试使用浏览器原生播放能力。");
            hlsInstance.destroy();
            hlsInstance = null;
            video.src = source;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        setMessage("使用浏览器原生 HLS 播放。");
      } else {
        video.src = source;
        setMessage("当前浏览器可能需要 HLS 支持才能播放。可换用 Safari、Edge 或 Chrome。 ");
      }
    }

    function playVideo() {
      setupSource();
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          setMessage("浏览器阻止了自动播放，请再次点击播放按钮。");
        });
      }
    }

    if (start) {
      start.addEventListener("click", function () {
        playVideo();
      });
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    video.addEventListener("pause", function () {
      if (overlay && video.currentTime === 0) {
        overlay.classList.remove("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    initMobileMenu();
    initHero();
    initFilterCards();
    initSearchPage();
    initPlayer();
  });
})();
