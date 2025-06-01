"use strict";
const audioFilePath = "./audio";
const genderOption = ["male", "female"];
const genderVariants = ["a", "b", "c", "d", "e"];
const playerEvents = [
    "angry",
    "cheer",
    "confused",
    "exert_medium",
    "exert_small",
    "flirt",
    "gen_t1",
    "gen_t2",
    "gen_t3",
    "gen_t4",
    "greet",
    "hitreact_large",
    "hitreact_medium",
    "hitreact_small",
    "jump",
    "land_stunned",
    "land",
    "laugh",
    "point",
    "thanks",
    "voice_select",
    "yawn",
];
const voiceLabelMap = [
    ["Voice 1", "female_a"],
    ["Voice 2", "female_b"],
    ["Voice 3", "female_c"],
    ["Voice 4", "female_d"],
    ["Voice 5", "female_e"],
    ["Voice 6", "male_a"],
    ["Voice 7", "male_b"],
    ["Voice 8", "male_c"],
    ["Voice 9", "male_d"],
    ["Voice 10", "male_e"],
];
function getAudioFileName({ voiceType, event, number }) {
    const paddedNumber = number.toString().padStart(2, "0");
    return `vo_${voiceType}_${event}_${paddedNumber}.wav`;
}
function getNextNumber(lastPlayedAudio, parts) {
    if (!lastPlayedAudio || lastPlayedAudio.voiceType !== parts.voiceType || lastPlayedAudio.event !== parts.event) {
        return 1;
    }
    return (lastPlayedAudio.number % 5 + 1);
}
function getNextEvent(lastPlayedAudio, voiceType) {
    if (!lastPlayedAudio || lastPlayedAudio.voiceType !== voiceType) {
        return "voice_select";
    }
    if (lastPlayedAudio.number < 5) {
        return lastPlayedAudio.event;
    }
    const currentIndex = playerEvents.indexOf(lastPlayedAudio.event);
    const nextIndex = (currentIndex + 1) % playerEvents.length;
    return playerEvents[nextIndex];
}
async function playAudio(parts, audioPlayer) {
    const audioFileName = getAudioFileName(parts);
    audioPlayer.src = `${audioFilePath}/${audioFileName}`;
    return audioPlayer.play();
}
let lastPlayedAudio = null;
const player = document.getElementById("audio_player");
if (!player) {
    throw new Error("Audio player not found.");
}
function setAllNotPlaying() {
    [...document.getElementsByTagName("voice-option")].forEach((el) => {
        el.removeAttribute("playing");
    });
}
player.addEventListener("ended", () => {
    setAllNotPlaying();
});
player.addEventListener("play", () => {
    setAllNotPlaying();
    const playingVoiceType = lastPlayedAudio?.voiceType;
    if (!playingVoiceType) {
        return;
    }
    const voiceOption = document.querySelector("voice-option[type='" + playingVoiceType + "']");
    if (voiceOption) {
        voiceOption.setAttribute("playing", "true");
    }
});
const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`
  .audio-icon {
    cursor: pointer;
    margin-left: 8px;
    margin-right: -8px;
    display: inline-block;
  }
`);
class VoiceOption extends HTMLElement {
    static observedAttributes = ["playing"];
    shadow;
    icon = document.createElement("span");
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.shadow.textContent = this.textContent || "";
        this.shadow.appendChild(this.icon);
        this.icon.className = "audio-icon";
        this.icon.textContent = "🔈";
        this.icon.style.visibility = "hidden";
        this.tabIndex = 0;
        this.shadow.adoptedStyleSheets = [stylesheet];
    }
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === "playing") {
            if (newValue) {
                this.icon.textContent = "🔊";
                this.icon.style.visibility = "visible";
            }
            else {
                this.icon.textContent = "🔈";
                this.icon.style.visibility = "hidden";
            }
        }
    }
    connectedCallback() {
        this.addEventListener("click", () => {
            // this.focus();
            this.play();
        });
        this.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.play();
            }
        });
    }
    async play() {
        const voiceType = this.getAttribute("type");
        const eventSelector = document.getElementById("voice_event");
        const event = eventSelector?.value ?? "voice_select";
        const cycleEvents = document.getElementById("cycle_all")
            ?.checked ?? false;
        if (!voiceType || !event) {
            console.error("Voice type or event not set.");
            return;
        }
        const audioParts = {
            voiceType,
            event,
            number: getNextNumber(lastPlayedAudio, { voiceType, event }),
        };
        const nextEvent = getNextEvent(lastPlayedAudio, voiceType);
        if (cycleEvents &&
            lastPlayedAudio?.event === event &&
            lastPlayedAudio?.voiceType === voiceType &&
            audioParts.event !== nextEvent) {
            audioParts.event = nextEvent;
            if (eventSelector)
                eventSelector.value = nextEvent;
        }
        lastPlayedAudio = audioParts;
        return playAudio(audioParts, player);
    }
}
window.customElements.define("voice-option", VoiceOption);
