(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-site-nav]");
        if (toggle && nav) {
            toggle.addEventListener("click", function () {
                nav.classList.toggle("is-open");
            });
        }

        var carousel = document.querySelector("[data-hero-carousel]");
        if (carousel) {
            var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
            var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
            var active = 0;
            var timer = null;

            function showSlide(index) {
                if (!slides.length) {
                    return;
                }
                active = (index + slides.length) % slides.length;
                slides.forEach(function (slide, i) {
                    slide.classList.toggle("is-active", i === active);
                });
                dots.forEach(function (dot, i) {
                    dot.classList.toggle("is-active", i === active);
                });
            }

            function startTimer() {
                if (timer) {
                    clearInterval(timer);
                }
                timer = setInterval(function () {
                    showSlide(active + 1);
                }, 5200);
            }

            dots.forEach(function (dot) {
                dot.addEventListener("click", function () {
                    showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
                    startTimer();
                });
            });

            showSlide(0);
            startTimer();
        }

        document.querySelectorAll("[data-card-scope]").forEach(function (scope) {
            var search = scope.querySelector("[data-card-search]");
            var filters = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-key]"));
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".searchable-card"));
            var empty = scope.querySelector("[data-no-results]");

            if (search && search.getAttribute("data-query-param")) {
                var params = new URLSearchParams(window.location.search);
                var value = params.get(search.getAttribute("data-query-param"));
                if (value) {
                    search.value = value;
                }
            }

            function normalize(value) {
                return String(value || "").trim().toLowerCase();
            }

            function applyFilter() {
                var term = normalize(search ? search.value : "");
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.dataset.title,
                        card.dataset.year,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.genre,
                        card.dataset.tags
                    ].join(" "));
                    var ok = !term || haystack.indexOf(term) !== -1;
                    filters.forEach(function (filter) {
                        var key = filter.getAttribute("data-filter-key");
                        var expected = normalize(filter.value);
                        var actual = normalize(card.dataset[key]);
                        if (expected && actual !== expected) {
                            ok = false;
                        }
                    });
                    card.classList.toggle("is-hidden", !ok);
                    if (ok) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            if (search) {
                search.addEventListener("input", applyFilter);
            }
            filters.forEach(function (filter) {
                filter.addEventListener("change", applyFilter);
            });
            applyFilter();
        });
    });

    window.setupPlayer = function (videoId, coverId, sourceUrl) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        var hlsInstance = null;
        var loaded = false;

        if (!video || !cover || !sourceUrl) {
            return;
        }

        function loadVideo() {
            if (loaded) {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(sourceUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = sourceUrl;
            }
            loaded = true;
        }

        function playVideo() {
            loadVideo();
            cover.classList.add("is-hidden");
            video.setAttribute("controls", "controls");
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        cover.addEventListener("click", playVideo);
        video.addEventListener("click", function () {
            if (!loaded) {
                playVideo();
            }
        });
        window.addEventListener("pagehide", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };
})();
