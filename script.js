let clues = [];
let culprit = "Alice"; // You can randomize this for replayability

function inspectObject(obj) {
  let clue = obj.getAttribute("data-clue");
  if (!clues.includes(clue)) {
    clues.push(clue);
    updateInventory();
    showMessage(`You found a clue: ${clue}`);
  } else {
    showMessage(`You already inspected this.`);
  }
}

function updateInventory() {
  let list = document.getElementById("clues-list");
  list.innerHTML = "";
  clues.forEach(clue => {
    let li = document.createElement("li");
    li.textContent = clue;
    list.appendChild(li);
  });
}

function interrogate(person) {
  let message = "";
  if (person === culprit) {
    message = `${person} seems nervous and avoids your questions.`;
  } else {
    message = `${person} answers confidently and seems innocent.`;
  }
  showMessage(message);
}

function accuse(person) {
  if (person === culprit) {
    showMessage(`Congratulations! You caught the culprit: ${person} 🎉`);
  } else {
    showMessage(`Wrong accusation! The culprit is still free... 😱`);
  }
}

function showMessage(msg) {
  document.getElementById("message").textContent = msg;
}
