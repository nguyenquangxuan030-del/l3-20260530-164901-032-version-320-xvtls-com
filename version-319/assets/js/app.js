(function () {
  'use strict';

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setStatus(text) {
    var status = qs('[data-player-status]');
    if (status) {
      status.textContent = text;
    }
  }

  function setupNavigation() {
    var toggle = qs('[data-menu-toggle]');
    var mobile = qs('[data-mobile-nav]');
    if (!toggle || !mobile) {
      return;
    }
    toggle.addEventListener('click', function () {
      mobile.classList.toggle('is-open');
    });
  }

  function hideBrokenImages() {
    document.addEventListener('error', function (event) {
      var target = event.target;
      if (target && target.tagName === 'IMG') {
        target.style.display = 'none';
      }
    }, true);
  }

  function setupPlayer() {
    var video = qs('[data-player]');
    var button = qs('[data-play-button]');
    if (!video || !button) {
      return;
    }

    var source = video.getAttribute('data-src');
    var hlsInstance = null;
    var hasLoaded = false;

    function loadAndPlay() {
      if (!source) {
        setStatus('未找到播放源');
        return;
      }

      button.classList.add('is-hidden');
      setStatus('正在加载播放源...');

      if (hasLoaded) {
        video.play().catch(function () {
          setStatus('浏览器阻止了自动播放，请再次点击视频控制栏');
        });
        return;
      }

      hasLoaded = true;

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('播放源加载完成');
          video.play().catch(function () {
            setStatus('请点击播放器控制栏开始播放');
          });
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setStatus('网络错误，正在重试...');
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setStatus('媒体错误，正在恢复...');
            hlsInstance.recoverMediaError();
          } else {
            setStatus('播放失败，请刷新页面重试');
            hlsInstance.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', function () {
          setStatus('播放源加载完成');
          video.play().catch(function () {
            setStatus('请点击播放器控制栏开始播放');
          });
        }, { once: true });
      } else {
        setStatus('当前浏览器不支持 HLS 播放');
      }
    }

    button.addEventListener('click', loadAndPlay);
    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
      setStatus('正在播放');
    });
    video.addEventListener('pause', function () {
      setStatus('已暂停');
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  function movieCard(movie) {
    return [
      '<a class="movie-card movie-card--small" href="' + movie.detail + '" title="' + escapeHtml(movie.title) + '">',
      '  <span class="poster-frame">',
      '    <span class="poster-fallback">经典亚洲电影</span>',
      '    <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '  </span>',
      '  <span class="movie-card__body">',
      '    <strong class="movie-card__title">' + escapeHtml(movie.title) + '</strong>',
      '    <span class="movie-card__meta">' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</span>',
      '    <span class="movie-card__desc">' + escapeHtml(movie.one_line) + '</span>',
      '  </span>',
      '</a>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupSearch() {
    var form = qs('[data-search-form]');
    var resultRoot = qs('[data-search-results]');
    var summary = qs('[data-search-summary]');
    if (!form || !resultRoot || !summary) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    ['q', 'region', 'year', 'type'].forEach(function (name) {
      var value = params.get(name);
      if (value && form.elements[name]) {
        form.elements[name].value = value;
      }
    });

    fetch('assets/data/movies.json')
      .then(function (res) { return res.json(); })
      .then(function (movies) {
        function render() {
          var q = normalize(form.elements.q.value);
          var region = form.elements.region.value;
          var year = form.elements.year.value;
          var type = form.elements.type.value;

          var results = movies.filter(function (movie) {
            var matchesQuery = !q || normalize(movie.search).indexOf(q) !== -1;
            var matchesRegion = !region || movie.region_group === region;
            var matchesYear = !year || movie.year === year;
            var matchesType = !type || movie.type_group === type;
            return matchesQuery && matchesRegion && matchesYear && matchesType;
          }).slice(0, 120);

          summary.textContent = '找到 ' + results.length + ' 条匹配结果，最多显示前 120 条。';
          if (!results.length) {
            resultRoot.innerHTML = '<div class="detail-card"><h2>暂无结果</h2><p>可以尝试减少关键词或切换筛选条件。</p></div>';
            return;
          }
          resultRoot.innerHTML = '<div class="movie-grid">' + results.map(movieCard).join('') + '</div>';
        }

        form.addEventListener('submit', function (event) {
          event.preventDefault();
          render();
        });
        qsa('input, select', form).forEach(function (field) {
          field.addEventListener('input', render);
          field.addEventListener('change', render);
        });
        render();
      })
      .catch(function () {
        summary.textContent = '搜索数据加载失败，请检查 assets/data/movies.json 是否存在。';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    hideBrokenImages();
    setupPlayer();
    setupSearch();
  });
})();
