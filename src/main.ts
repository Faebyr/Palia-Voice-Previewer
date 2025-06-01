const audioFilePath = "./audio"

const genderOption = ["male", "female"] as const
const genderVariants = ["a", "b", "c", "d", "e"] as const
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
] as const

type VoiceType = `${(typeof genderOption)[number]}_${typeof genderVariants[number]}`
type PlayerEvent = typeof playerEvents[number]
type AudioFileName = ReturnType<typeof getAudioFileName>

const voiceLabelMap: [string, VoiceType][] = [
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
]

type AudioFileParts = {
    voiceType: VoiceType,
    event: PlayerEvent,
    number: 1 | 2 | 3 | 4 | 5
}

function getAudioFileName({ voiceType, event, number }: AudioFileParts) {
    const paddedNumber = number.toString().padStart(2, "0") as "01" | "02" | "03" | "04" | "05"
    return `vo_${voiceType}_${event}_${paddedNumber}.wav` as const
}

function getNextNumber(
    lastPlayedAudio: AudioFileParts | null,
    parts: Omit<AudioFileParts, "number">
): AudioFileParts["number"] {
    if (!lastPlayedAudio || lastPlayedAudio.voiceType !== parts.voiceType || lastPlayedAudio.event !== parts.event) {
        return 1 as const
    }
    
    return (lastPlayedAudio.number % 5 + 1) as AudioFileParts["number"];
}

function getNextEvent(
  lastPlayedAudio: AudioFileParts | null,
  voiceType: VoiceType
): PlayerEvent {
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

async function playAudio(parts: AudioFileParts, audioPlayer: HTMLAudioElement) {
  const audioFileName = getAudioFileName(parts);

  audioPlayer.src = `${audioFilePath}/${audioFileName}`;
  return audioPlayer.play();
}

let lastPlayedAudio: AudioFileParts | null = null;

const player = document.getElementById("audio_player") as HTMLAudioElement;

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

  const voiceOption = document.querySelector<VoiceOption>(
    "voice-option[type='" + playingVoiceType + "']"
  );

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

  private shadow: ShadowRoot;
  private icon = document.createElement("span");

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

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ) {
    if (name === "playing") {
      if (newValue) {
        this.icon.textContent = "🔊";
        this.icon.style.visibility = "visible";
      } else {
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
    const voiceType = this.getAttribute("type") as VoiceType;
    const eventSelector = document.getElementById(
      "voice_event"
    ) as HTMLSelectElement | null;
    const event = (eventSelector?.value as PlayerEvent) ?? "voice_select";
    const cycleEvents =
      (document.getElementById("cycle_all") as HTMLInputElement | null)
        ?.checked ?? false;

    if (!voiceType || !event) {
      console.error("Voice type or event not set.");
      return;
    }

    const audioParts: AudioFileParts = {
      voiceType,
      event,
      number: getNextNumber(lastPlayedAudio, { voiceType, event }),
    };

    const nextEvent = getNextEvent(lastPlayedAudio, voiceType);
    if (
      cycleEvents &&
      lastPlayedAudio?.event === event &&
      lastPlayedAudio?.voiceType === voiceType &&
      audioParts.event !== nextEvent
    ) {
      audioParts.event = nextEvent;
      if (eventSelector) eventSelector.value = nextEvent;
    }

    lastPlayedAudio = audioParts;
    return playAudio(audioParts, player);
  }
}

window.customElements.define("voice-option", VoiceOption);
