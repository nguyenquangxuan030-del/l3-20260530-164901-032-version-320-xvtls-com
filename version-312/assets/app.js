(function () {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
    });
  }

  var hero = document.querySelector(".hero-slider");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector(".hero-prev");
    var next = hero.querySelector(".hero-next");
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    if (slides.length > 1) {
      if (prev) {
        prev.addEventListener("click", function () {
          showSlide(current - 1);
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          showSlide(current + 1);
        });
      }
      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          showSlide(parseInt(dot.getAttribute("data-slide"), 10));
        });
      });
      window.setInterval(function () {
        showSlide(current + 1);
      }, 6500);
    }
  }

  document.querySelectorAll(".filter-panel").forEach(function (panel) {
    var listId = panel.getAttribute("data-filter-list");
    var list = document.getElementById(listId);
    if (!list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
    var keywordInput = panel.querySelector(".filter-keyword");
    var yearSelect = panel.querySelector(".filter-year");
    var typeSelect = panel.querySelector(".filter-type");
    var reset = panel.querySelector(".filter-reset");

    function applyFilter() {
      var keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
      var year = yearSelect ? yearSelect.value : "";
      var type = typeSelect ? typeSelect.value : "";
      cards.forEach(function (card) {
        var title = (card.getAttribute("data-title") || "").toLowerCase();
        var cardYear = card.getAttribute("data-year") || "";
        var cardType = card.getAttribute("data-type") || "";
        var genre = (card.getAttribute("data-genre") || "").toLowerCase();
        var matchedKeyword = !keyword || title.indexOf(keyword) > -1 || genre.indexOf(keyword) > -1;
        var matchedYear = !year || cardYear === year;
        var matchedType = !type || cardType === type;
        card.style.display = matchedKeyword && matchedYear && matchedType ? "" : "none";
      });
    }

    [keywordInput, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });

    if (reset) {
      reset.addEventListener("click", function () {
        if (keywordInput) {
          keywordInput.value = "";
        }
        if (yearSelect) {
          yearSelect.value = "";
        }
        if (typeSelect) {
          typeSelect.value = "";
        }
        applyFilter();
      });
    }
  });

  var searchInput = document.getElementById("search-input");
  var searchResults = document.getElementById("search-results");
  var searchCount = document.getElementById("search-count");
  if (searchInput && searchResults && Array.isArray(window.SITE_MOVIES)) {
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    searchInput.value = initialQuery;

    function card(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");
      return "<article class=\"movie-card\">" +
        "<a class=\"poster-link\" href=\"" + escapeHtml(movie.url) + "\">" +
        "<div class=\"poster-frame\">" +
        "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\">" +
        "<span class=\"duration\">" + escapeHtml(movie.duration) + "</span>" +
        "<span class=\"rating\">★ " + escapeHtml(movie.rating) + "</span>" +
        "<span class=\"play-badge\">▶</span>" +
        "</div></a>" +
        "<div class=\"movie-info\">" +
        "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
        "<div class=\"movie-meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><a href=\"" + escapeHtml(movie.categoryUrl) + "\">" + escapeHtml(movie.category) + "</a></div>" +
        "<p>" + escapeHtml(movie.oneLine) + "</p>" +
        "<div class=\"tag-row\">" + tags + "</div>" +
        "</div></article>";
    }

    function runSearch() {
      var query = searchInput.value.trim().toLowerCase();
      var results = window.SITE_MOVIES.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.oneLine,
          (movie.tags || []).join(" ")
        ].join(" ").toLowerCase();
        return !query || haystack.indexOf(query) > -1;
      }).slice(0, 160);

      searchResults.innerHTML = results.map(card).join("");
      searchCount.textContent = query ? "找到 " + results.length + " 条相关影片" : "显示推荐影片 " + results.length + " 条";
    }

    searchInput.form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = searchInput.value.trim();
      var nextUrl = query ? "search.html?q=" + encodeURIComponent(query) : "search.html";
      window.history.replaceState(null, "", nextUrl);
      runSearch();
    });
    searchInput.addEventListener("input", runSearch);
    runSearch();
  }
})();
