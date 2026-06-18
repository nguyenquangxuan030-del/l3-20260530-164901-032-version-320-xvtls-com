(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var toggle = document.querySelector("[data-nav-toggle]");
        var mobileNav = document.querySelector("[data-mobile-nav]");
        if (toggle && mobileNav) {
            toggle.addEventListener("click", function () {
                mobileNav.classList.toggle("open");
            });
        }

        var hero = document.querySelector("[data-hero]");
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-slide-target]"));
            var prev = hero.querySelector("[data-hero-prev]");
            var next = hero.querySelector("[data-hero-next]");
            var index = 0;
            var timer = null;

            function showSlide(nextIndex) {
                if (!slides.length) {
                    return;
                }
                index = (nextIndex + slides.length) % slides.length;
                slides.forEach(function (slide, position) {
                    slide.classList.toggle("active", position === index);
                });
                dots.forEach(function (dot, position) {
                    dot.classList.toggle("active", position === index);
                });
            }

            function startTimer() {
                if (timer) {
                    clearInterval(timer);
                }
                timer = setInterval(function () {
                    showSlide(index + 1);
                }, 5200);
            }

            dots.forEach(function (dot) {
                dot.addEventListener("click", function () {
                    showSlide(Number(dot.getAttribute("data-slide-target")) || 0);
                    startTimer();
                });
            });

            if (prev) {
                prev.addEventListener("click", function () {
                    showSlide(index - 1);
                    startTimer();
                });
            }

            if (next) {
                next.addEventListener("click", function () {
                    showSlide(index + 1);
                    startTimer();
                });
            }

            showSlide(0);
            startTimer();
        }

        var grids = Array.prototype.slice.call(document.querySelectorAll("[data-card-grid]"));
        grids.forEach(function (grid) {
            var section = grid.closest(".content-section") || document;
            var keywordInput = section.querySelector("[data-filter-input]");
            var typeSelect = section.querySelector("[data-filter-type]");
            var yearSelect = section.querySelector("[data-filter-year]");
            var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));

            function applyFilters() {
                var keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : "";
                var type = typeSelect ? typeSelect.value : "";
                var year = yearSelect ? yearSelect.value : "";
                cards.forEach(function (card) {
                    var search = (card.getAttribute("data-search") || "").toLowerCase();
                    var cardType = card.getAttribute("data-type") || "";
                    var cardYear = card.getAttribute("data-year") || "";
                    var visible = true;
                    if (keyword && search.indexOf(keyword) === -1) {
                        visible = false;
                    }
                    if (type && cardType !== type) {
                        visible = false;
                    }
                    if (year && cardYear !== year) {
                        visible = false;
                    }
                    card.classList.toggle("is-filtered-out", !visible);
                });
            }

            [keywordInput, typeSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", applyFilters);
                    control.addEventListener("change", applyFilters);
                }
            });
        });

        var searchForm = document.querySelector("[data-search-form]");
        var searchInput = document.querySelector("[data-search-input]");
        var searchResults = document.querySelector("[data-search-results]");
        if (searchForm && searchInput && searchResults && window.SEARCH_MOVIES) {
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q") || "";
            searchInput.value = initialQuery;

            function resultCard(item) {
                return [
                    '<article class="search-card">',
                    '<a href="' + item.url + '"><img src="' + item.cover + '" alt="' + item.title.replace(/"/g, "&quot;") + '"></a>',
                    '<div>',
                    '<a href="' + item.url + '"><h2>' + item.title + '</h2></a>',
                    '<p>' + item.desc + '</p>',
                    '<div class="movie-meta"><span>' + item.year + '</span><span>' + item.region + '</span><span>' + item.type + '</span><span>' + item.category + '</span></div>',
                    '</div>',
                    '</article>'
                ].join("");
            }

            function doSearch() {
                var query = searchInput.value.trim().toLowerCase();
                var items = window.SEARCH_MOVIES;
                var matches = items.filter(function (item) {
                    if (!query) {
                        return false;
                    }
                    return item.search.indexOf(query) !== -1;
                }).slice(0, 80);
                if (!query) {
                    searchResults.innerHTML = "";
                    return;
                }
                if (!matches.length) {
                    searchResults.innerHTML = '<div class="story-card"><h2>未找到匹配影片</h2><p>可以尝试输入更短的片名、地区、年份或类型。</p></div>';
                    return;
                }
                searchResults.innerHTML = matches.map(resultCard).join("");
            }

            searchForm.addEventListener("submit", function (event) {
                event.preventDefault();
                var query = searchInput.value.trim();
                if (query) {
                    history.replaceState(null, "", "./search.html?q=" + encodeURIComponent(query));
                }
                doSearch();
            });

            searchInput.addEventListener("input", doSearch);
            doSearch();
        }
    });
})();
