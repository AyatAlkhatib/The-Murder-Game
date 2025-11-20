/* Prototype engine for The Disappearance of Room 26
   - chapters
   - rooms (CSS drawn)
   - inventory & notebook
   - suspect board
   - audio engine (safe)
   - puzzle framework (pluggable)
*/

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* UI elements */
const btnStart = $('#btnStart'), btnMute = $('#btnMute');
const startScreen = $('#startScreen'), playScreen = $('#playScreen');
const canvas = $('#canvas');
const navBtns = $$('.navBtn');
const inspectBtn = $('#inspectBtn'), openNotebookBtn = $('#openNotebook');
const inventoryEl = $('#inventory'), notesList = $('#notesList'), noteInput = $('#noteInput'), pinNote = $('#pinNote');
const suspectBoard = $('#suspectBoard'), accuseBtn = $('#accuseBtn');
const modal = $('#modal');
const chapterNum = $('#chapterNum'), timeLeftEl = $('#timeLeft'), notesCount = $('#notesCount');

/* game state */
let state = {
  chapter: 0,
  time: 0,
  currentRoom: 'corridor',
  inventory: [],
  notes: [],
  suspects: [
    {id:'Evelyn', role:'Professor', alibi:'Lecture hall', trust:50},
    {id:'Marcus', role:'Janitor', alibi:'West Wing', trust:30},
    {id:'Rina', role:'Classmate', alibi:'Library', trust:60},
    {id:'Daniel', role:'Transfer', alibi:'Study', trust:20},
  ],
  cluesNeededForFinal: 6,
  muted:false
};

/* --- Audio (safe) --- */
let audioCtx = null;
function safePlayTone(freq,duration=0.6,volume=0.12){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.value = freq;
    o.connect(g); g.connect(audioCtx.destination); g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime+0.02);
    o.start(); o.stop(audioCtx.currentTime+duration);
  }catch(e){}
}

/* --- Startup --- */
btnStart.addEventListener('click', ()=> {
  startScreen.classList.remove('active'); playScreen.classList.add('active');
  state.chapter = 1; chapterNum.textContent = state.chapter;
  state.time = 600; updateTimer();
  renderRoom('corridor');
  renderSuspects(); renderInventory(); renderNotes();
  safePlayTone(120,0.8,0.06);
});

/* mute */
btnMute.addEventListener('click', ()=> {
  state.muted = !state.muted;
  btnMute.textContent = state.muted ? 'Unmute' : 'Mute';
});

/* --- Timer --- */
let timerInterval = null;
function updateTimer(){
  timeLeftEl.textContent = formatTime(state.time);
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    state.time--;
    timeLeftEl.textContent = formatTime(state.time);
    if (state.time <= 0){
      clearInterval(timerInterval);
      gameOver('Time has run out. The academy keeps its secrets.');
    }
  },1000);
}
function formatTime(sec){ const m=Math.floor(sec/60), s=sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

/* --- Navigation --- */
navBtns.forEach(b=> b.addEventListener('click', ()=> {
  const r = b.dataset.room;
  renderRoom(r);
  safePlayTone(240,0.2,0.04);
}));

/* --- Render room (CSS-drawn) --- */
function renderRoom(room){
  state.currentRoom = room;
  $('#canvas').innerHTML = '';
  chapterNum.textContent = state.chapter;
  // base scene
  const scene = document.createElement('div'); scene.className='scene';
  // different room shapes
  if (room==='corridor'){
    const col = document.createElement('div'); col.className='candle'; col.style.right='14%';
    scene.appendChild(col);
    addHotspot(scene,'mysteriousMark','A strange mark on the floor','A faded spiral etched in the stone.');
  } else if (room==='library'){
    const shelf = document.createElement('div'); shelf.className='shelf';
    for(let i=0;i<30;i++){ const b=document.createElement('div'); b.className='book'; shelf.appendChild(b) }
    scene.appendChild(shelf);
    addHotspot(scene,'hollowBook','Hollow book','You find a hollow book with a small brass key inside.');
  } else if (room==='westwing'){
    const sign = document.createElement('div'); sign.className='small'; sign.textContent='West Wing (locked)';
    sign.style.position='absolute'; sign.style.left='10%'; sign.style.top='12%';
    scene.appendChild(sign);
    addHotspot(scene,'lockedDoor','A locked door','A keyhole with a circular symbol.');
  } else if (room==='basement'){
    const crate = document.createElement('div'); crate.className='book'; crate.style.width='160px'; crate.style.height='80px'; crate.style.left='20%'; crate.style.top='56%'; crate.style.position='absolute';
    scene.appendChild(crate);
    addHotspot(scene,'tornJournal','Torn journal','A page mentions "Room 26" in a shaky hand.');
  } else if (room==='study'){
    const desk = document.createElement('div'); desk.className='book'; desk.style.width='260px'; desk.style.height='100px'; desk.style.left='30%'; desk.style.top='58%'; desk.style.position='absolute';
    scene.appendChild(desk);
    addHotspot(scene,'burnedNote','Burned note','Half a sentence remains: "...do not follow the echo."');
  }
  canvas.appendChild(scene);
}

/* --- Hotspot helper --- */
function addHotspot(parent, id, label, message){
  const h = document.createElement('div'); h.className='hotspot';
  h.dataset.id = id; h.innerHTML = `<div class="small">${label}</div>`;
  // position randomly-ish to look natural
  h.style.left = (10 + Math.random()*70) + '%';
  h.style.top = (20 + Math.random()*60) + '%';
  parent.appendChild(h);
  h.addEventListener('click', (e)=>{
    e.stopPropagation();
    inspectHotspot(id,label,message);
    safePlayTone(520,0.12,0.06);
  });
}

/* --- Inspect action --- */
function inspectHotspot(id,label,message){
  // Add to inventory if new
  if(!state.inventory.includes(id)){
    state.inventory.push(id);
    renderInventory();
    showModal(`<h3>${label}</h3><p>${message}</p><p class="small">Clue added to Inventory.</p>`,
      [{text:'Add to Notebook', action:()=>{ addNote(`${label}: ${message}`); closeModal(); }},
       {text:'Close', action: closeModal}]
    );
  } else {
    showModal(`<h3>${label}</h3><p>${message}</p>`,[{text:'Close', action:closeModal}]);
  }
}

/* --- Inventory / Notebook --- */
function renderInventory(){
  inventoryEl.innerHTML = '';
  if(state.inventory.length===0){ inventoryEl.textContent = 'No clues yet'; return; }
  state.inventory.forEach(id=>{
    const d = document.createElement('div'); d.className='item'; d.textContent = prettyName(id);
    d.addEventListener('click', ()=> { addNote(prettyName(id)+' (extracted)'); });
    inventoryEl.appendChild(d);
  });
}
function addNote(text){
  state.notes.push(text);
  renderNotes();
  safePlayTone(360,0.18,0.05);
}
function renderNotes(){
  notesList.innerHTML = '';
  if(state.notes.length===0) notesList.textContent='(empty)';
  else state.notes.forEach((n,i)=> {
    const el = document.createElement('div'); el.className='item'; el.textContent = `${i+1}. ${n}`;
    notesList.appendChild(el);
  });
  notesCount.textContent = state.notes.length;
}

/* pin note button */
$('#pinNote').addEventListener('click', ()=> {
  const t = noteInput.value.trim();
  if(!t) { showToast('Write something to pin.'); return; }
  addNote(t);
  noteInput.value = '';
});

/* --- Suspects --- */
function renderSuspects(){
  suspectBoard.innerHTML = '';
  state.suspects.forEach(s=>{
    const el = document.createElement('div'); el.className='suspect';
    el.innerHTML = `<div><div class="name">${s.id}</div><div class="small">${s.role} • Alibi: ${s.alibi}</div></div>
      <div style="margin-left:auto"><button class="btn small" data-id="${s.id}">Interrogate</button></div>`;
    suspectBoard.appendChild(el);
    el.querySelector('button').addEventListener('click', ()=> interrogate(s));
  });
}

/* interrogation */
function interrogate(sus){
  // short dynamic interrogation: reveals a random comment and may add clue
  const lines = [
    `${sus.id} looks nervous and avoids eye contact.`,
    `${sus.id} claims they were alone in ${sus.alibi}.`,
    `${sus.id} slips: "I heard a voice."`,
    `${sus.id} appears confident and mentions the old archives.`
  ];
  const pick = lines[Math.floor(Math.random()*lines.length)];
  showModal(`<h3>Interrogate ${sus.id}</h3><p>${pick}</p>`, [
    { text:'Press harder', action: ()=> { addNote(`Pressed ${sus.id}: "${pick}"`); closeModal(); } },
    { text:'Close', action: closeModal }
  ]);
}

/* --- Accuse flow --- */
accuseBtn.addEventListener('click', ()=> {
  // Simple accuse modal — shows suspects
  const buttons = state.suspects.map(s=> ({ text:s.id, action: ()=> finalizeAccuse(s.id) }) );
  showModal(`<h3>Make an Accusation</h3><p>Choose who you think is responsible for Alina's disappearance.</p>`, buttons.concat([{text:'Cancel', action: closeModal}]));
});

function finalizeAccuse(name){
  closeModal();
  // evaluation: require many clues & notes (hard)
  const required = state.cluesNeededForFinal;
  const score = state.inventory.length + Math.floor(state.notes.length/1.5);
  if(score >= required && name === 'Daniel'){ // for prototype, Daniel is the 'correct' culprit
    showModal(`<h3>Correct</h3><p>You deduced that ${name} used hidden passages and manipulated the experiment. You expose the academy.</p>`, [{text:'End', action: ()=> location.reload()}]);
  } else {
    // wrong accusation -> penalty
    state.time = Math.max(30, state.time - 180);
    updateTimer();
    showModal(`<h3>Wrong</h3><p>The accusation fails. Time slips away; the academy grows colder.</p>`, [{text:'Continue', action: closeModal}]);
  }
}

/* --- Modal helpers --- */
function showModal(html, buttons=[]){
  modal.classList.remove('hidden'); modal.innerHTML = `<div class="inner">${html}<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">${buttons.map((b,i)=>`<button class="btn" data-index="${i}">${b.text}</button>`).join('')}</div></div>`;
  buttons.forEach((b,i)=> {
    modal.querySelector(`button[data-index="${i}"]`).addEventListener('click', ()=> b.action());
  });
}
function closeModal(){ modal.classList.add('hidden'); modal.innerHTML='';}

/* --- Utility & pretty names --- */
function prettyName(id){
  const map = {
    'mysteriousMark':'Spiral Mark',
    'hollowBook':'Hollow Book (Brass Key)',
    'lockedDoor':'Locked Door (circular keyhole)',
    'tornJournal':'Torn Journal (Room 26)',
    'burnedNote':'Burned Note (echo line)'
  };
  return map[id] || id;
}
function showToast(t){ console.log('toast:',t); }

/* --- Puzzle framework (stubs) --- */
/* Hard puzzles: implement these functions and call them from hotspots or modal callbacks */

function puzzleCipher(cipherText){
  // Example: extremely hard substitution shift + transposition
  // Stub: open modal with input and check
  showModal(`<h3>Cipher</h3><p>Decrypt: ${cipherText}</p><input id="cipherAnswer" style="width:100%;margin-top:8px"><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn" id="tryCipher">Try</button></div>`, []);
  modal.querySelector('#tryCipher').addEventListener('click', ()=>{
    const ans = modal.querySelector('#cipherAnswer').value.trim().toLowerCase();
    if(ans === 'midnight'){ addNote('Decrypted cipher: midnight'); closeModal(); }
    else { showToast('Incorrect. Think about architecture and acrostics.'); }
  });
}

function puzzleBlueprint(data){
  // Complex puzzle: rotate rooms in the blueprint to match real map
  // Implement interactive rotation and pattern recognition.
  showModal(`<h3>Blueprint Puzzle</h3><p>(Complex blueprint puzzle placeholder)</p>`, [{text:'Close', action: closeModal}]);
}

function puzzleLogicGrid(data){
  // Classic logic-grid puzzle: match suspects, tools, times.
  showModal(`<h3>Logic Grid</h3><p>Solve the grid to deduce who moved where when.</p>`, [{text:'Close', action: closeModal}]);
}

/* small init */
renderSuspects(); renderInventory(); renderNotes();
