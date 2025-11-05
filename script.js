const startBtn = document.getElementById("start-btn");
const introScreen = document.getElementById("intro-screen");
const roomScreen = document.getElementById("room-screen");
const roomTitle = document.getElementById("room-title");
const moveBtns = document.querySelectorAll(".move-btn");
const dialogueBox = document.getElementById("dialogue-box");
const dialogueText = document.getElementById("dialogue-text");
const nextDialogue = document.getElementById("next-dialogue");
const messageBox = document.getElementById("message");
const nextRoundBtn = document.getElementById("next-round");

// Sounds
const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("click-sound");
const suspenseSound = document.getElementById("suspense-sound");

let visitedRooms = new Set();
let round = 1;

const rooms = {
  library: {
    name: "Library",
    message: "Old books line the shelves. One seems recently moved.",
    clue: "Hidden note: 'Meet me at midnight.'",
  },
  kitchen: {
    name: "Kitchen",
    message: "The knife rack is missing one blade.",
    clue: "Bloody knife under the counter.",
  },
  study: {
    name: "Study Room",
    message: "A letter on the desk reads: 'You can’t trust them...'",
    clue: "Letter signed by someone named A.R.",
  },
};

// Start game
startBtn.addEventListener("click", () => {
  clickSound.play();
  bgMusic.volume = 0.3;
  bgMusic.play();
  introScreen.classList.remove("active");
  roomScreen.classList.add("active");
  showMessage("You enter the mansion...");
});

// Room navigation
moveBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const room = btn.dataset.room;
    enterRoom(room);
    clickSound.play();
  });
});

// Enter a room
function enterRoom(room) {
  const data = rooms[room];
  roomTitle.textContent = data.name;
  showMessage(data.message);
  suspenseSound.currentTime = 0;
  suspenseSound.play();
  visitedRooms.add(room);
  triggerDialogue(data.clue);

  // Check if all rooms are visited
  if (visitedRooms.size === 3) {
    nextRoundBtn.classList.remove("hidden");
  }
}

// Dialogue box
function triggerDialogue(text) {
  dialogueBox.style.display = "block";
  dialogueText.textContent = text;
}

nextDialogue.addEventListener("click", () => {
  dialogueBox.style.display = "none";
});

// Next round
nextRoundBtn.addEventListener("click", () => {
  round++;
  nextRoundBtn.classList.add("hidden");

  if (round === 2) {
    showMessage("Round 2: You’ve gathered clues. Someone among you is the killer...");
  } else if (round === 3) {
    showMessage("Final Round: Make your accusation. The truth will be revealed soon.");
  } else {
    showMessage("Game Over — you survived the night.");
  }
});

function showMessage(text) {
  messageBox.textContent = text;
}
