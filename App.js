const urlInput = document.getElementById("urlInput");
const watchButton = document.getElementById("watchButton");
const clearButton = document.getElementById("clearButton");
const exampleButton = document.getElementById("exampleButton");

const errorBox = document.getElementById("error");

const viewerSection = document.getElementById("viewerSection");
const player = document.getElementById("player");

const copyButton = document.getElementById("copyButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const newVideoButton = document.getElementById("newVideoButton");

let currentUrl = "";


/*
 * Extract a TikTok post ID.
 *
 * Supported:
 *
 * https://www.tiktok.com/@user/video/123456789
 * https://www.tiktok.com/@user/video/123456789?...
 *
 * Also accepts URLs containing /video/{id}.
 */

function extractVideoId(input) {

    let url;

    try {
        url = new URL(input);
    } catch {
        return null;
    }

    const hostname = url.hostname.toLowerCase();

    const allowedHosts = [
        "tiktok.com",
        "www.tiktok.com",
        "m.tiktok.com"
    ];

    if (!allowedHosts.includes(hostname)) {
        return null;
    }

    const match = url.pathname.match(
        /\/video\/(\d+)/
    );

    if (!match) {
        return null;
    }

    return match[1];
}


/*
 * Show an error.
 */

function showError(message) {

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");
}


/*
 * Hide error.
 */

function hideError() {

    errorBox.classList.add("hidden");
}


/*
 * Load TikTok player.
 */

function loadVideo() {

    hideError();

    const value = urlInput.value.trim();

    if (!value) {

        showError(
            "Paste a TikTok video URL first."
        );

        return;
    }

    const videoId = extractVideoId(value);

    if (!videoId) {

        showError(
            "Please use a normal TikTok video URL, for example: https://www.tiktok.com/@user/video/123456789"
        );

        return;
    }

    currentUrl = value;

    /*
     * TikTok official embedded player.
     *
     * controls=1
     * progress_bar=1
     * description=0
     * music_info=0
     */

    const playerUrl =
        `https://www.tiktok.com/player/v1/${videoId}` +
        `?controls=1` +
        `&progress_bar=1` +
        `&description=0` +
        `&music_info=0`;

    player.src = playerUrl;

    viewerSection.classList.remove("hidden");

    setTimeout(() => {

        viewerSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 50);
}


/*
 * Clear input.
 */

function clearInput() {

    urlInput.value = "";

    clearButton.classList.add("hidden");

    urlInput.focus();
}


/*
 * Copy current URL.
 */

async function copyCurrentLink() {

    if (!currentUrl) {
        return;
    }

    try {

        await navigator.clipboard.writeText(
            currentUrl
        );

        const original =
            copyButton.textContent;

        copyButton.textContent = "Copied";

        setTimeout(() => {
            copyButton.textContent = original;
        }, 1200);

    } catch {

        showError(
            "Your browser doesn't allow clipboard access."
        );
    }
}


/*
 * Fullscreen.
 */

function fullscreenPlayer() {

    const container =
        document.querySelector(".player-container");

    if (!document.fullscreenElement) {

        container.requestFullscreen?.();

    } else {

        document.exitFullscreen?.();

    }
}


/*
 * New video.
 */

function newVideo() {

    player.src = "";

    viewerSection.classList.add("hidden");

    urlInput.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/*
 * Input events.
 */

urlInput.addEventListener("input", () => {

    const hasValue =
        urlInput.value.trim().length > 0;

    clearButton.classList.toggle(
        "hidden",
        !hasValue
    );

    hideError();
});


urlInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        loadVideo();
    }
});


watchButton.addEventListener(
    "click",
    loadVideo
);


clearButton.addEventListener(
    "click",
    clearInput
);


copyButton.addEventListener(
    "click",
    copyCurrentLink
);


fullscreenButton.addEventListener(
    "click",
    fullscreenPlayer
);


newVideoButton.addEventListener(
    "click",
    newVideo
);


/*
 * Example button.
 */

exampleButton.addEventListener(
    "click",
    () => {

        urlInput.focus();

        urlInput.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
);