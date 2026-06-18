(function () {
  document.querySelectorAll(".player-card[data-video]").forEach(function (box) {
    var stream = box.getAttribute("data-video");
    var video = box.querySelector("video");
    var cover = box.querySelector(".player-cover");
    var hls = null;
    var ready = false;

    function attachStream() {
      if (ready || !video || !stream) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        ready = true;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        ready = true;
        return;
      }
      video.src = stream;
      ready = true;
    }

    function playVideo() {
      attachStream();
      if (cover) {
        cover.classList.add("is-hidden");
      }
      video.setAttribute("controls", "controls");
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener("click", playVideo);
    }
    if (video) {
      video.addEventListener("click", function () {
        if (video.paused) {
          playVideo();
        }
      });
    }
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
  });
})();
