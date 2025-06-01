"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
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
  if (
    !lastPlayedAudio ||
    lastPlayedAudio.voiceType !== parts.voiceType ||
    lastPlayedAudio.event !== parts.event
  ) {
    return 1;
  }
  return (lastPlayedAudio.number % 5) + 1;
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
function playAudio(parts, audioPlayer) {
  return __awaiter(this, void 0, void 0, function* () {
    const audioFileName = getAudioFileName(parts);
    audioPlayer.src = `${audioFilePath}/${audioFileName}`;
    return audioPlayer.play();
  });
}
function createAudioPlayerForm(root) {
  const voiceForm = document.createElement("form");
  voiceForm.id = "voices";
  const eventSelector = document.createElement("select");
  eventSelector.id = "event-selector";
  eventSelector.name = "event";
  playerEvents.forEach((event) => {
    const option = document.createElement("option");
    option.value = event;
    if (option.value === "voice_select") {
      option.selected = true;
    }
    option.textContent = event.replace(/_/g, " ");
    eventSelector.appendChild(option);
  });
  const randomOption = document.createElement("option");
  randomOption.value = "";
  randomOption.textContent = "cycle through all";
  eventSelector.appendChild(randomOption);
  const voiceOptionsContainer = document.createElement("div");
  voiceOptionsContainer.className = "voice-options";
  const buttonText = {
    play: "Play &#9658;",
  };
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.innerHTML = buttonText.play;
  playButton.disabled = true;
  voiceLabelMap.map(([label, voiceType]) => {
    const voiceOption = document.createElement("div");
    voiceOption.className = "voice-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "voice";
    input.value = voiceType;
    input.id = `voice-${voiceType}`;
    const labelElement = document.createElement("label");
    labelElement.htmlFor = `voice-${voiceType}`;
    labelElement.textContent = label;
    voiceOption.appendChild(input);
    voiceOption.appendChild(labelElement);
    voiceOptionsContainer.appendChild(voiceOption);
    voiceOption.addEventListener("click", () => {
      playButton.disabled = false;
    });
  });
  root.appendChild(voiceForm);
  voiceForm.appendChild(eventSelector);
  voiceForm.appendChild(voiceOptionsContainer);
  voiceForm.appendChild(playButton);
  const audioPlayer = new Audio();
  let isPlaying = false;
  audioPlayer.preload = "auto";
  audioPlayer.onplay = () => {
    // playButton.innerHTML = buttonText.playing;
    isPlaying = true;
  };
  audioPlayer.onpause = () => {
    playButton.innerHTML = buttonText.play;
    isPlaying = false;
  };
  audioPlayer.onended = () => {
    playButton.innerHTML = buttonText.play;
    isPlaying = false;
  };
  audioPlayer.onerror = () => {
    console.error("Error loading audio file:", audioPlayer.error);
    playButton.innerHTML = buttonText.play;
    isPlaying = false;
  };
  let lastPlayedAudio = null;
  playButton.addEventListener("click", (e) => {
    e.preventDefault();
    const selectedVoice = voiceForm.elements.namedItem("voice").value;
    let selectedEvent = voiceForm.elements.namedItem("event").value;
    if (selectedVoice === "") {
      alert("Please select a voice before playing.");
      return;
    }
    if (selectedEvent === "") {
      selectedEvent = getNextEvent(lastPlayedAudio, selectedVoice);
    }
    const audioFile = {
      voiceType: selectedVoice,
      event: selectedEvent,
      number: getNextNumber(lastPlayedAudio, {
        voiceType: selectedVoice,
        event: selectedEvent,
      }),
    };
    lastPlayedAudio = audioFile;
    playAudio(audioFile, audioPlayer).catch((err) =>
      console.error("Error playing audio:", err)
    );
  });
}
