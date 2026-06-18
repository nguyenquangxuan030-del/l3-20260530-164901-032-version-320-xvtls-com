function initStaticPlayer(videoId, buttonId, streamUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var attached = false;
    var hls = null;

    function attachStream() {
        if (!video || !streamUrl || attached) {
            return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
        attached = true;
    }

    function startPlayback() {
        attachStream();
        if (button) {
            button.classList.add("is-hidden");
        }
        var action = video.play();
        if (action && typeof action.catch === "function") {
            action.catch(function () {
                if (button) {
                    button.classList.remove("is-hidden");
                }
            });
        }
    }

    if (button) {
        button.addEventListener("click", startPlayback);
    }

    if (video) {
        video.addEventListener("click", function () {
            if (!attached || video.paused) {
                startPlayback();
            }
        });
    }
}
