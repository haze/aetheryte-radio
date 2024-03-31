function setupControls() {
    setupButton("hum", humGainNode, mainGainNode);
    setupButton("whir", whirGainNode, mainGainNode);
    setupButton("main", mainGainNode, audioContext.destination);
}

function setupButton(kind, targetAudioNode, destinationAudioNode) {
    const togglePlaybackButton = document.createElement("button");
    togglePlaybackButton.onclick = (event) => togglePlayback(event, kind, targetAudioNode, destinationAudioNode);
    updatePlaybackStateButton(togglePlaybackButton, kind);
    document.body.appendChild(togglePlaybackButton);
}

function togglePlayback(event, kind, targetAudioNode, destinationAudioNode) {
    playState[kind] = !playState[kind];
    if (playState[kind]) {
        targetAudioNode.connect(destinationAudioNode);
    } else {
        targetAudioNode.disconnect(destinationAudioNode);
    }
    updatePlaybackStateButton(event.srcElement, kind);
}

function updatePlaybackStateButton(buttonElement, kind) {
    buttonElement.replaceChildren(
        document.createTextNode(
            playState[kind] ? `Mute ${playStateDisplayMap[kind]}` : `Unmute ${playStateDisplayMap[kind]}`,
        ),
    );
}

async function loadSample(audioContext, url) {
    const result = await fetch(url);
    const arrayBuffer = await result.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
}

const playState = { hum: true, whir: true, main: true };
const playStateDisplayMap = { hum: "Hums", whir: "Whirs", main: "both" };
const audioContext = new AudioContext();
const humGainNode = audioContext.createGain();
const whirGainNode = audioContext.createGain();
const mainGainNode = audioContext.createGain();

humGainNode.connect(mainGainNode);
whirGainNode.connect(mainGainNode);
mainGainNode.connect(audioContext.destination);

// remove 25db
mainGainNode.gain.value = Math.pow(10, -20 / 20);

setupControls();

const whirs = await Promise.all([
    loadSample(audioContext, "assets/whir1.wav"),
    loadSample(audioContext, "assets/whir2.wav"),
    loadSample(audioContext, "assets/whir3.wav"),
    loadSample(audioContext, "assets/whir4.wav"),
    loadSample(audioContext, "assets/whir5.wav"),
]);

function randomWhir() {}

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
humSource.buffer = await loadSample(audioContext, "assets/hum.wav");
humSource.playbackRate.value = 0.63;
humSource.connect(humGainNode);
humSource.loop = true;
humSource.start(0);

chooseWhir();
