function setupControls() {
    // setup mute buttons
    setupButton("hum", humGainNode, mainGainNode);
    setupButton("whir", whirGainNode, mainGainNode);
    setupButton("main", mainGainNode, audioContext.destination);
    // setup volume slider
    setupVolumeSlider();
}

function setVolume(volume) {
    localStorage.setItem("volume", volume);
    mainGainNode.gain.value = volume;
}

function setupVolumeSlider() {
    const volumeSliderContainer = document.createElement("div");
    volumeSliderContainer.style.display = "flex";
    volumeSliderContainer.style.gap = "0.5rem";
    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.name = "volume";
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = "any";
    volumeSlider.value = Math.pow(mainGainNode.gain.value / 0.125, 2);
    volumeSlider.oninput = (event) => setVolume(Math.sqrt(event.target.value) * 0.125);
    const resetVolumeButton = document.createElement("button");
    resetVolumeButton.onclick = () => {
        volumeSlider.value = Math.pow(Math.pow(10, -20 / 20) / 0.125, 2);
        setVolume(Math.sqrt(volumeSlider.value) * 0.125);
    };
    resetVolumeButton.appendChild(document.createTextNode("Reset"));
    volumeSliderContainer.appendChild(document.createTextNode("Volume"));
    volumeSliderContainer.appendChild(resetVolumeButton);
    volumeSliderContainer.appendChild(volumeSlider);
    document.body.appendChild(volumeSliderContainer);
}

function setupButton(kind, targetAudioNode, destinationAudioNode) {
    const togglePlaybackButton = document.createElement("button");
    togglePlaybackButton.onclick = (event) => togglePlayback(event, kind, targetAudioNode, destinationAudioNode);
    updatePlaybackStateButton(togglePlaybackButton, kind);
    document.body.appendChild(togglePlaybackButton);
}

function togglePlayback(event, kind, targetAudioNode, destinationAudioNode) {
    playState[kind] = !playState[kind];
    localStorage.setItem(kind, !!playState[kind]);
    console.log(playState);
    if (playState[kind]) {
        targetAudioNode.connect(destinationAudioNode);
        if (kind === "main") {
            audioContext.resume();
        }
    } else {
        targetAudioNode.disconnect(destinationAudioNode);
    }
    updatePlaybackStateButton(event.srcElement, kind);
}

function updatePlaybackStateButton(buttonElement, kind) {
    buttonElement.replaceChildren(
        document.createTextNode(
            kind === "main"
                ? playState[kind]
                    ? "Disconnect"
                    : "Connect"
                : playState[kind]
                  ? `Mute ${playStateDisplayMap[kind]}`
                  : `Unmute ${playStateDisplayMap[kind]}`,
        ),
    );
}

async function loadSample(audioContext, url) {
    const result = await fetch(url);
    const arrayBuffer = await result.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

const playState = {
    hum: localStorage.getItem("hum") === "true" ?? true,
    whir: localStorage.getItem("whir") === "true" ?? true,
    main: false,
};
const playStateDisplayMap = { hum: "Hums", whir: "Whirs", main: "output" };
console.log(playState);
const audioContext = new AudioContext();
const humGainNode = audioContext.createGain();
const whirGainNode = audioContext.createGain();
const mainGainNode = audioContext.createGain();

if (playState.hum) humGainNode.connect(mainGainNode);
if (playState.whir) whirGainNode.connect(mainGainNode);

// remove 25db
mainGainNode.gain.value = localStorage.getItem("volume") ?? Math.pow(10, -20 / 20);

setupControls();

// https://stackoverflow.com/a/23522755
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const whirs = isSafari
    ? await Promise.all([
          loadSample(audioContext, "assets/whir1.wav.opus.aac"),
          loadSample(audioContext, "assets/whir2.wav.opus.aac"),
          loadSample(audioContext, "assets/whir3.wav.opus.aac"),
          loadSample(audioContext, "assets/whir4.wav.opus.aac"),
          loadSample(audioContext, "assets/whir5.wav.opus.aac"),
      ])
    : await Promise.all([
          loadSample(audioContext, "assets/whir1.wav.opus"),
          loadSample(audioContext, "assets/whir2.wav.opus"),
          loadSample(audioContext, "assets/whir3.wav.opus"),
          loadSample(audioContext, "assets/whir4.wav.opus"),
          loadSample(audioContext, "assets/whir5.wav.opus"),
      ]);

function chooseWhir() {
    const whirSource = audioContext.createBufferSource();
    const whirIndex = Math.floor(Math.random() * whirs.length);
    const whirPlaybackRate = Math.random() * (1 - 0.794) + 0.794;
    whirGainNode.gain.value = Math.random() * (1 - 0.6) + 0.6;
    console.log(
        "Whir",
        whirIndex + 1,
        "rate=",
        whirPlaybackRate.toFixed(2),
        "gain=",
        whirGainNode.gain.value.toFixed(2),
    );
    whirSource.buffer = whirs[whirIndex];
    whirSource.playbackRate.value = whirPlaybackRate;
    whirSource.connect(whirGainNode);
    whirSource.start(0);
    whirSource.onended = () => {
        // disconnect self and re-queue another whir
        whirSource.disconnect(whirGainNode);
        const nextWhirDelay = Math.floor(Math.random() * 2001);
        console.log("Next whir in", nextWhirDelay, "ms");
        setTimeout(chooseWhir, nextWhirDelay);
    };
}

const humSource = audioContext.createBufferSource();
humSource.buffer = await loadSample(audioContext, isSafari ? "assets/hum.wav.opus.aac" : "assets/hum.wav.opus");
humSource.playbackRate.value = 0.63;
humSource.connect(humGainNode);
humSource.loop = true;
humSource.start(0);

chooseWhir();
