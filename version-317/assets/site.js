(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function setupMobileNav() {
    var toggle = document.querySelector(".mobile-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(target) {
      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-to")) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  function setupFilters() {
    var holder = document.querySelector("[data-filter-list]");
    if (!holder) {
      return;
    }
    var keyword = holder.querySelector("[data-filter-keyword]");
    var year = holder.querySelector("[data-filter-year]");
    var region = holder.querySelector("[data-filter-region]");
    var count = holder.querySelector("[data-filter-count]");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".category-list .movie-card"));

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function apply() {
      var word = normalize(keyword && keyword.value);
      var y = normalize(year && year.value);
      var r = normalize(region && region.value);
      var shown = 0;
      cards.forEach(function (card) {
        var hay = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-type")
        ].join(" "));
        var okWord = !word || hay.indexOf(word) !== -1;
        var okYear = !y || normalize(card.getAttribute("data-year")) === y;
        var okRegion = !r || normalize(card.getAttribute("data-region")) === r;
        var visible = okWord && okYear && okRegion;
        card.classList.toggle("hidden-by-filter", !visible);
        if (visible) {
          shown += 1;
        }
      });
      if (count) {
        count.textContent = "当前显示 " + shown + " 部";
      }
    }

    [keyword, year, region].forEach(function (el) {
      if (el) {
        el.addEventListener("input", apply);
        el.addEventListener("change", apply);
      }
    });
    apply();
  }

  function movieCard(movie) {
    var tags = movie.tags.slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return [
      "<article class=\"movie-card\">",
      "<a class=\"movie-cover\" href=\"" + movie.file + "\">",
      "<img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
      "<span class=\"play-float\">▶</span>",
      "<span class=\"duration\">" + escapeHtml(movie.duration) + "</span>",
      "<span class=\"card-type\">" + escapeHtml(movie.type) + "</span>",
      "</a>",
      "<div class=\"movie-info\">",
      "<h3><a href=\"" + movie.file + "\">" + escapeHtml(movie.title) + "</a></h3>",
      "<p>" + escapeHtml(movie.oneLine) + "</p>",
      "<div class=\"tag-row\">" + tags + "</div>",
      "<div class=\"movie-meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
      "</div>",
      "</article>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setupSearchPage() {
    var results = document.getElementById("searchResults");
    var input = document.getElementById("searchPageInput");
    var title = document.getElementById("searchResultTitle");
    var note = document.getElementById("searchResultNote");
    if (!results || !input || !window.SiteFilmIndex) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();
    input.value = q;
    if (!q) {
      return;
    }
    var key = q.toLowerCase();
    var list = window.SiteFilmIndex.filter(function (movie) {
      return [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags.join(" "), movie.oneLine]
        .join(" ")
        .toLowerCase()
        .indexOf(key) !== -1;
    }).slice(0, 120);
    title.textContent = "搜索结果";
    note.textContent = list.length ? "以下内容与“" + q + "”相关。" : "没有找到完全匹配的内容，可以更换关键词继续搜索。";
    results.innerHTML = list.length ? list.map(movieCard).join("") : "";
  }

  ready(function () {
    setupMobileNav();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();
