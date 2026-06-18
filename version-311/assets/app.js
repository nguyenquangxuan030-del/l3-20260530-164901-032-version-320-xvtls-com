(function () {
    var header = document.querySelector('[data-header]');
    var navToggle = document.querySelector('[data-nav-toggle]');
    var mainNav = document.querySelector('[data-main-nav]');

    function updateHeader() {
        if (!header) {
            return;
        }
        header.classList.toggle('is-scrolled', window.scrollY > 20);
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function () {
            mainNav.classList.toggle('is-open');
            document.body.classList.toggle('is-nav-open', mainNav.classList.contains('is-open'));
        });
    }

    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (href.replace('./', '') === path) {
            link.classList.add('is-active');
        }
    });

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var activeSlide = 0;
    var slideTimer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        activeSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === activeSlide);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === activeSlide);
        });
    }

    function startHero() {
        if (slideTimer || slides.length < 2) {
            return;
        }
        slideTimer = window.setInterval(function () {
            showSlide(activeSlide + 1);
        }, 5000);
    }

    dots.forEach(function (dot, dotIndex) {
        dot.addEventListener('click', function () {
            showSlide(dotIndex);
            if (slideTimer) {
                window.clearInterval(slideTimer);
                slideTimer = null;
            }
            startHero();
        });
    });

    showSlide(0);
    startHero();

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function matchesCard(card, query, category, year) {
        var haystack = [
            card.dataset.title,
            card.dataset.category,
            card.dataset.region,
            card.dataset.year,
            card.dataset.genre
        ].join(' ').toLowerCase();
        var categoryOk = !category || category === 'all' || normalize(card.dataset.category) === normalize(category);
        var yearOk = !year || year === 'all' || normalize(card.dataset.year).indexOf(normalize(year)) !== -1;
        return haystack.indexOf(query) !== -1 && categoryOk && yearOk;
    }

    function setupLocalFilters() {
        var input = document.querySelector('[data-local-search]');
        var category = document.querySelector('[data-local-category]');
        var year = document.querySelector('[data-local-year]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
        var empty = document.querySelector('[data-empty-state]');
        if (!cards.length) {
            return;
        }
        function apply() {
            var query = normalize(input ? input.value : '');
            var cat = category ? category.value : 'all';
            var yr = year ? year.value : 'all';
            var visible = 0;
            cards.forEach(function (card) {
                var ok = matchesCard(card, query, cat, yr);
                card.style.display = ok ? '' : 'none';
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }
        [input, category, year].forEach(function (control) {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });
        apply();
    }

    setupLocalFilters();

    function setupGlobalSearch() {
        var input = document.querySelector('[data-site-search]');
        var panel = document.querySelector('[data-search-panel]');
        var submit = document.querySelector('[data-search-submit]');
        var index = window.MovieSearchIndex || [];
        if (!input || !panel || !index.length) {
            return;
        }
        function render() {
            var query = normalize(input.value);
            if (!query) {
                panel.innerHTML = '';
                panel.classList.remove('is-visible');
                return;
            }
            var results = index.filter(function (item) {
                return normalize(item.title + ' ' + item.category + ' ' + item.region + ' ' + item.year + ' ' + item.genre).indexOf(query) !== -1;
            }).slice(0, 12);
            panel.innerHTML = results.map(function (item) {
                return '<a class="search-result" href="' + item.url + '">' +
                    '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '">' +
                    '<span><strong>' + escapeHtml(item.title) + '</strong>' +
                    '<span>' + escapeHtml(item.category + ' · ' + item.year + ' · ' + item.region) + '</span></span>' +
                    '</a>';
            }).join('');
            panel.classList.toggle('is-visible', results.length > 0);
        }
        input.addEventListener('input', render);
        if (submit) {
            submit.addEventListener('click', render);
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    setupGlobalSearch();

    function setupPlayers() {
        document.querySelectorAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            if (!video) {
                return;
            }
            var source = video.getAttribute('data-video-src');
            var prepared = false;
            var hlsInstance = null;

            function prepare() {
                if (prepared || !source) {
                    return;
                }
                prepared = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = source;
                }
            }

            function start() {
                prepare();
                if (button) {
                    button.classList.add('is-hidden');
                }
                video.controls = true;
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {});
                }
            }

            player.addEventListener('click', function (event) {
                if (event.target === video && prepared) {
                    return;
                }
                start();
            });

            if (button) {
                button.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    start();
                });
            }

            video.addEventListener('play', function () {
                if (button) {
                    button.classList.add('is-hidden');
                }
            });

            video.addEventListener('emptied', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
                prepared = false;
            });
        });
    }

    setupPlayers();
})();
