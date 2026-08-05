const tiles = [
  { type: "start", name: "国内国际机场", kicker: "起点", icon: "🛫", note: "再次经过奖励￥20" },
  { type: "city", name: "马来西亚", country: "马来西亚", flag: "MY", region: "asia", price: 120 },
  { type: "city", name: "新加坡", country: "新加坡", flag: "SG", region: "asia", price: 80 },
  { type: "event", name: "带出3友AW", kicker: "事件", icon: "💌", note: "获得￥30", effect: "friend_aw" },
  { type: "city", name: "澳大利亚", country: "澳大利亚", flag: "AU", region: "oceania", price: 160 },
  { type: "city", name: "新西兰", country: "新西兰", flag: "NZ", region: "oceania", price: 100 },
  { type: "station", name: "亚洲站", kicker: "车站", icon: "🚄", note: "缴纳车费 −￥20", price: 20 },
  { type: "city", name: "韩国", country: "韩国", flag: "KR", region: "asia", price: 90 },
  { type: "prison", name: "监狱", kicker: "监狱", icon: "🔒", note: "缴纳￥150保释出狱", price: 150 },
  { type: "city", name: "法国", country: "法国", flag: "FR", region: "europe", price: 120 },
  { type: "city", name: "希腊", country: "希腊", flag: "GR", region: "europe", price: 80 },
  { type: "event", name: "天气炎热中暑", kicker: "事件", icon: "☀️", note: "丢失￥20", effect: "heat_loss" },
  { type: "city", name: "意大利", country: "意大利", flag: "IT", region: "europe", price: 160 },
  { type: "city", name: "英国", country: "英国", flag: "GB", region: "europe", price: 100 },
  { type: "chance", name: "下一局每只鼠鼠", kicker: "机会", icon: "🐭", note: "每只可赚取￥5", effect: "mouse_bonus" },
  { type: "city", name: "荷兰", country: "荷兰", flag: "NL", region: "europe", price: 90 },
  { type: "station", name: "欧洲站", kicker: "车站", icon: "🚉", note: "缴纳车票费 −￥20", price: 20 },
  { type: "city", name: "美国", country: "美国", flag: "US", region: "america", price: 150 },
  { type: "city", name: "巴西", country: "巴西", flag: "BR", region: "america", price: 100 },
  { type: "destiny", name: "下一个撤离", kicker: "命运", icon: "🎴", note: "成功双倍·失败减半", effect: "double_or_half" },
  { type: "city", name: "墨西哥", country: "墨西哥", flag: "MX", region: "america", price: 65 },
  { type: "city", name: "秘鲁", country: "秘鲁", flag: "PE", region: "america", price: 200 },
  { type: "city", name: "阿根廷", country: "阿根廷", flag: "AR", region: "america", price: 160 },
  { type: "city", name: "加拿大", country: "加拿大", flag: "CA", region: "america", price: 70 },
  { type: "station", name: "美洲站", kicker: "车站", icon: "🚆", note: "缴纳车票费 −￥20", price: 20 },
  { type: "city", name: "南非", country: "南非", flag: "ZA", region: "africa", price: 120 },
  { type: "event", name: "刮刮乐", kicker: "事件", icon: "🎁", note: "获得￥20", effect: "scratch_reward" },
  { type: "city", name: "坦桑尼亚", country: "坦桑尼亚", flag: "TZ", region: "africa", price: 65 },
  { type: "city", name: "埃及", country: "埃及", flag: "EG", region: "africa", price: 100 },
  { type: "chance", name: "下一局每杀一人", kicker: "机会", icon: "🎯", note: "可赚取￥5", effect: "kill_bonus" },
  { type: "city", name: "摩洛哥", country: "摩洛哥", flag: "MA", region: "africa", price: 180 },
  { type: "city", name: "阿联酋", country: "阿联酋", flag: "AE", region: "asia", price: 80 }
];

const defaultState = () => ({
  position: 0,
  coins: 20,
  turn: 1,
  rollCredits: 0,
  debt: 0,
  debtName: "",
  doubleNext: false,
  killBonus: false,
  mouseBonus: false,
  sound: true,
  log: [{ label: "READY", text: "起始旅行资金￥20，完成撤离后即可掷骰。" }]
});

let state = loadState();
let isMoving = false;
let audioContext;
let toastTimer;
let previewTimer;

const board = document.querySelector("#board");
const rollButton = document.querySelector("#rollButton");
const successButton = document.querySelector("#successButton");
const failureButton = document.querySelector("#failureButton");
const extractionValue = document.querySelector("#extractionValue");
const bigRedValue = document.querySelector("#bigRedValue");
const extractionExtras = document.querySelector("#extractionExtras");
const killRecordField = document.querySelector("#killRecordField");
const mouseRecordField = document.querySelector("#mouseRecordField");
const killCount = document.querySelector("#killCount");
const mouseCount = document.querySelector("#mouseCount");
const specialLoot = document.querySelector("#specialLoot");
const dice = document.querySelector("#dice");
const coinValue = document.querySelector("#coinValue");
const debtWalletValue = document.querySelector("#xpValue");
const turnValue = document.querySelector("#turnValue");
const levelValue = document.querySelector("#levelValue");
const playerLocation = document.querySelector("#playerLocation");
const landingCard = document.querySelector("#landingCard");
const landingIcon = document.querySelector("#landingIcon");
const landingTitle = document.querySelector("#landingTitle");
const landingText = document.querySelector("#landingText");
const diceHeadline = document.querySelector("#diceHeadline");
const diceSubline = document.querySelector("#diceSubline");
const tripLog = document.querySelector("#tripLog");
const rollCreditStatus = document.querySelector("#rollCreditStatus");
const debtStatus = document.querySelector("#debtStatus");
const effectStatus = document.querySelector("#effectStatus");
const statusBadge = document.querySelector("#statusBadge");
const rulesDialog = document.querySelector("#rulesDialog");
const resultDialog = document.querySelector("#resultDialog");
const toast = document.querySelector("#toast");
const soundButton = document.querySelector("#soundButton");
const centerCoinValue = document.querySelector("#centerCoinValue");
const centerDebtValue = document.querySelector("#centerDebtValue");
const centerCreditValue = document.querySelector("#centerCreditValue");
const centerEffectValue = document.querySelector("#centerEffectValue");
const centerStatusBadge = document.querySelector("#centerStatusBadge");
const centerProgressValue = document.querySelector("#centerProgressValue");
const centerProgressBar = document.querySelector("#centerProgressBar");
const centerLocationValue = document.querySelector("#centerLocationValue");
const centerNextValue = document.querySelector("#centerNextValue");
const centerActionValue = document.querySelector("#centerActionValue");
const liveDateTime = document.querySelector("#liveDateTime");

function updateLiveDateTime() {
  const now = new Date();
  liveDateTime.dateTime = now.toISOString();
  liveDateTime.textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).format(now).replaceAll("/", ".");
}

updateLiveDateTime();
window.setInterval(updateLiveDateTime, 1000);

function loadState() {
  try {
    const stored = localStorage.getItem("beaver-world-monopoly-v2");
    if (!stored) return defaultState();
    const parsed = JSON.parse(stored);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem("beaver-world-monopoly-v2", JSON.stringify(state));
  } catch {
    // Local storage is optional; the game still works without it.
  }
}

function boardPosition(index) {
  if (index <= 8) return { row: 1, column: index + 1 };
  if (index <= 15) return { row: index - 7, column: 9 };
  if (index === 16) return { row: 9, column: 9 };
  if (index <= 23) return { row: 9, column: 25 - index };
  if (index === 24) return { row: 9, column: 1 };
  return { row: 33 - index, column: 1 };
}

function renderBoard() {
  board.querySelectorAll(".tile").forEach((tile) => tile.remove());

  tiles.forEach((tile, index) => {
    const cell = document.createElement("div");
    const { row, column } = boardPosition(index);
    const isCorner = [0, 8, 16, 24].includes(index);
    cell.className = `tile tile--${tile.type}${tile.region ? ` tile--${tile.region}` : ""}${isCorner ? " tile--corner" : ""}`;
    cell.dataset.index = index;
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.style.gridRow = row;
    cell.style.gridColumn = column;
    cell.setAttribute("aria-label", tileAriaLabel(tile));

    if (tile.type === "city") {
      cell.innerHTML = `
        <span class="tile-flag" aria-hidden="true">${tile.flag}</span>
        <strong class="tile-name tile-name--country">${tile.name}</strong>
        <span class="tile-price">${tile.price}</span>
      `;
    } else {
      cell.classList.add("tile--special");
      cell.innerHTML = `
        <span class="special-icon" aria-hidden="true">${tile.icon}</span>
        <span class="special-kicker">${tile.kicker}</span>
        <strong class="special-name">${tile.name}</strong>
        <small class="special-note">${tile.note || ""}</small>
      `;
    }
    cell.addEventListener("click", () => previewTile(index));
    cell.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      previewTile(index);
    });
    board.appendChild(cell);
  });

  syncBoardState();
}

function tileAriaLabel(tile) {
  if (tile.type === "city") return `${tile.name}，门票￥${tile.price}`;
  return `${tile.kicker}，${tile.name}，${tile.note || ""}`;
}

function previewTile(index) {
  if (isMoving) return;
  const tile = tiles[index];
  const cell = board.querySelector(`.tile[data-index="${index}"]`);
  board.querySelectorAll(".tile.is-preview").forEach((item) => item.classList.remove("is-preview"));
  window.clearTimeout(previewTimer);
  cell?.classList.add("is-preview");
  const detail = tile.type === "city" ? `${tile.name} · 门票￥${tile.price}` : `${tile.kicker} · ${tile.name}${tile.note ? ` · ${tile.note}` : ""}`;
  showToast(detail);
  previewTimer = window.setTimeout(() => cell?.classList.remove("is-preview"), 1100);
}

function syncBoardState(hopping = false) {
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.classList.toggle("is-current", Number(tile.dataset.index) === state.position);
  });

  let token = document.querySelector(".player-token");
  if (!token) {
    token = document.createElement("div");
    token.className = "player-token";
    token.textContent = "🦫";
    token.setAttribute("aria-label", "海狸队长棋子");
  }
  token.classList.toggle("is-hopping", hopping);
  document.querySelector(`.tile[data-index="${state.position}"]`)?.appendChild(token);
}

function updateUI() {
  const current = tiles[state.position];
  coinValue.textContent = state.coins.toLocaleString("zh-CN");
  debtWalletValue.textContent = state.debt.toLocaleString("zh-CN");
  turnValue.textContent = state.turn;
  levelValue.textContent = state.position;
  playerLocation.textContent = `📍 ${current.name}`;
  updateLandingCard(current);
  updateSettlementStatus();
  updateLog();
  updateSoundButton();
  syncBoardState();
  saveState();
}

function updateLandingCard(tile) {
  landingIcon.textContent = tile.flag || tile.icon || "🌏";
  landingTitle.textContent = tile.name;
  if (tile.type === "city") {
    landingText.textContent = `环球国家格 · 门票￥${tile.price}`;
  } else {
    landingText.textContent = tile.note || "完成本格结算后继续旅行。";
  }
}

function updateSettlementStatus() {
  const effects = [];
  if (state.doubleNext) effects.push("下次撤离成功双倍／失败减半");
  if (state.killBonus) effects.push("机会战绩：每次击杀+￥5");
  if (state.mouseBonus) effects.push("机会战绩：每只鼠鼠+￥5");

  const hasKillRecord = state.killBonus;
  const hasMouseRecord = state.mouseBonus;
  extractionExtras.classList.toggle("has-chance-record", hasKillRecord || hasMouseRecord);
  extractionExtras.classList.toggle("has-two-chance-records", hasKillRecord && hasMouseRecord);
  killRecordField.hidden = !hasKillRecord;
  mouseRecordField.hidden = !hasMouseRecord;
  if (!hasKillRecord) killCount.value = "0";
  if (!hasMouseRecord) mouseCount.value = "0";

  rollCreditStatus.textContent = state.rollCredits > 0 ? "已获得×1" : "未获得";
  debtStatus.textContent = `￥${state.debt}`;
  effectStatus.textContent = effects.join("；") || "无";
  debtWalletValue.textContent = `￥${state.debt}`;

  if (state.debt > 0) {
    statusBadge.textContent = "欠费停留";
    diceHeadline.textContent = `还需补缴￥${state.debt}`;
    diceSubline.textContent = `停留在${state.debtName}，撤离成功补齐差价后才能继续`;
  } else if (state.rollCredits > 0) {
    statusBadge.textContent = "可以掷骰";
    diceHeadline.textContent = "已获得一次掷骰资格";
    diceSubline.textContent = "点击掷骰子，前往下一个国家";
  } else {
    statusBadge.textContent = "等待撤离";
    diceHeadline.textContent = "撤离成功才可掷骰子";
    diceSubline.textContent = "撤离失败扣￥10；命运效果可能改变结算";
  }

  rollButton.disabled = isMoving || state.rollCredits < 1 || state.debt > 0;
  successButton.disabled = isMoving || state.rollCredits > 0;
  failureButton.disabled = isMoving || state.rollCredits > 0;

  centerCoinValue.textContent = state.coins.toLocaleString("zh-CN");
  centerDebtValue.textContent = `￥${state.debt}`;
  centerCreditValue.textContent = state.rollCredits > 0 ? "已获得×1" : "未获得";
  centerEffectValue.textContent = effects.join("；") || "无";
  centerStatusBadge.textContent = statusBadge.textContent;
  updateCenterJourney();
}

function updateCenterJourney() {
  const current = tiles[state.position];
  const next = tiles[(state.position + 1) % tiles.length];
  centerProgressValue.textContent = `${state.position + 1} / ${tiles.length} 格`;
  centerProgressBar.style.width = `${((state.position + 1) / tiles.length) * 100}%`;
  centerLocationValue.textContent = current.name;
  centerNextValue.textContent = next.type === "city" ? `${next.name} · ￥${next.price}` : `${next.kicker} · ${next.name}`;

  if (state.debt > 0) {
    centerActionValue.textContent = `补齐￥${state.debt}后继续`;
  } else if (isMoving) {
    centerActionValue.textContent = "正在前往下一站";
  } else if (state.rollCredits > 0) {
    centerActionValue.textContent = "已获得资格，可以掷骰";
  } else {
    centerActionValue.textContent = "先完成撤离结算";
  }
}

function updateLog() {
  tripLog.innerHTML = "";
  state.log.slice(0, 8).forEach((entry) => {
    const li = document.createElement("li");
    const time = document.createElement("time");
    const span = document.createElement("span");
    time.textContent = entry.label;
    span.textContent = entry.text;
    li.append(time, span);
    tripLog.appendChild(li);
  });
}

function updateSoundButton() {
  soundButton.setAttribute("aria-pressed", String(state.sound));
  soundButton.querySelector(".button-label").textContent = state.sound ? "音效开" : "音效关";
  soundButton.querySelector("span:first-child").textContent = state.sound ? "♪" : "×";
}

function addLog(text, label = `T${state.turn.toString().padStart(2, "0")}`) {
  state.log.unshift({ label, text });
  state.log = state.log.slice(0, 14);
}

function settleSuccess() {
  if (isMoving || state.rollCredits > 0) return;
  let reward = Number(extractionValue.value);
  const redBonus = Number(bigRedValue.value);
  const specialBonus = specialLoot.checked ? 130 : 0;
  const kills = Math.max(0, Math.min(30, Number(killCount.value) || 0));
  const mice = Math.max(0, Math.min(30, Number(mouseCount.value) || 0));
  const killReward = state.killBonus ? kills * 5 : 0;
  const mouseReward = state.mouseBonus ? mice * 5 : 0;
  const chanceRecords = [];
  if (state.killBonus) chanceRecords.push(`击杀 ${kills} 人`);
  if (state.mouseBonus) chanceRecords.push(`鼠鼠 ${mice} 只`);
  const chanceReward = killReward + mouseReward;
  const baseBeforeDouble = reward + redBonus + specialBonus + killReward + mouseReward;

  if (state.doubleNext) {
    reward = baseBeforeDouble * 2;
    state.doubleNext = false;
  } else {
    reward = baseBeforeDouble;
  }

  state.killBonus = false;
  state.mouseBonus = false;
  state.coins += reward;
  addLog(`撤离成功，结算获得￥${reward}。`, "SUCCESS");
  if (chanceRecords.length) {
    addLog(`机会战绩：${chanceRecords.join("、")}，额外获得￥${chanceReward}。`, "CHANCE");
  }

  if (state.debt > 0) {
    const paid = Math.min(state.coins, state.debt);
    state.coins -= paid;
    state.debt -= paid;
    addLog(`向${state.debtName}补缴￥${paid}${state.debt > 0 ? `，仍欠￥${state.debt}` : "，费用已补齐"}。`, "PAY");
    if (state.debt === 0) state.debtName = "";
  }

  if (state.debt === 0) state.rollCredits = 1;
  resetSettlementInputs();
  playRewardSound();
  emitBoardParticles("￥", 12, "#dca934");
  showToast(`撤离成功：+￥${reward}${state.debt > 0 ? ` · 仍欠￥${state.debt}` : " · 获得掷骰资格"}`);
  updateUI();
}

function settleFailure() {
  if (isMoving || state.rollCredits > 0) return;
  let message;
  if (state.doubleNext) {
    const before = state.coins;
    state.coins = Math.floor(state.coins / 2);
    state.doubleNext = false;
    message = `命运生效：撤离失败，金币由￥${before}减半为￥${state.coins}。`;
  } else {
    const deducted = Math.min(10, state.coins);
    state.coins -= deducted;
    message = `撤离失败，从金币钱包扣除￥${deducted}。`;
  }
  state.rollCredits = 0;
  state.killBonus = false;
  state.mouseBonus = false;
  resetSettlementInputs();
  addLog(message, "FAILED");
  playTone(210, .2, "sine", .05);
  showToast(message);
  updateUI();
}

function resetSettlementInputs() {
  bigRedValue.value = "0";
  killCount.value = "0";
  mouseCount.value = "0";
  specialLoot.checked = false;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function rollDice() {
  if (isMoving || state.rollCredits < 1 || state.debt > 0 || resultDialog.open || rulesDialog.open) return;
  isMoving = true;
  board.classList.add("is-moving");
  state.rollCredits = 0;
  updateSettlementStatus();
  dice.classList.add("is-rolling");
  diceHeadline.textContent = "骰子滚动中…";
  diceSubline.textContent = "海狸队长正在确认下一站";
  playTone(430, .07, "square");

  const finalRoll = Math.floor(Math.random() * 6) + 1;
  for (let i = 0; i < 8; i += 1) {
    setDiceFace(Math.floor(Math.random() * 6) + 1);
    await wait(80);
  }
  setDiceFace(finalRoll);
  dice.classList.remove("is-rolling");
  playTone(620, .1, "sine");

  for (let step = 0; step < finalRoll; step += 1) {
    const previous = state.position;
    state.position = (state.position + 1) % tiles.length;
    if (previous === tiles.length - 1 && state.position === 0) {
      state.coins += 20;
      addLog("再次经过国内国际机场，获得￥20。", "AIRPORT");
      showToast("经过国内国际机场：+￥20");
      emitBoardParticles("✦", 8, "#5fb8dd");
    }
    syncBoardState(true);
    playTone(330 + step * 34, .045, "sine", .025);
    await wait(190);
    syncBoardState(false);
    await wait(65);
  }

  state.turn += 1;
  await handleLanding();
  isMoving = false;
  board.classList.remove("is-moving");
  updateUI();
  landingCard.classList.add("is-updated");
  window.setTimeout(() => landingCard.classList.remove("is-updated"), 700);
  centerBoardOnCurrent(true);
}

function setDiceFace(face) {
  dice.dataset.face = String(face);
  dice.setAttribute("aria-label", `骰子点数${face}`);
}

async function handleLanding() {
  const tile = tiles[state.position];

  if (tile.type === "city") {
    const fullyPaid = chargeFee(tile.price, `${tile.name}门票`);
    if (fullyPaid) {
      addLog(`抵达${tile.name}，缴纳门票￥${tile.price}。`, "TICKET");
      showToast(`${tile.name}门票：−￥${tile.price}`);
    }
    return;
  }

  if (tile.type === "station") {
    const fullyPaid = chargeFee(20, `${tile.name}车票`);
    if (fullyPaid) {
      state.rollCredits = 1;
      addLog(`抵达${tile.name}，缴纳￥20车票，可重新掷骰。`, "STATION");
      showResult({ icon: "🚉", kicker: "STATION", title: tile.name, text: "已缴纳￥20车票，可以重新掷骰前往下一站。", amountText: "−￥20 · 再掷一次" });
    }
    return;
  }

  if (tile.type === "prison") {
    const fullyPaid = chargeFee(150, "监狱保释费");
    if (fullyPaid) {
      addLog("抵达监狱，缴纳￥150保释出狱。", "PRISON");
      showResult({ icon: "🔒", kicker: "PRISON", title: "缴纳保释费", text: "已按照海报规则缴纳￥150保释出狱。", amountText: "−￥150" });
    }
    return;
  }

  if (tile.type === "start") {
    addLog("停在国内国际机场，下一次撤离成功后继续出发。", "AIRPORT");
    return;
  }

  applySpecialTile(tile);
}

function chargeFee(amount, label) {
  if (state.coins >= amount) {
    state.coins -= amount;
    return true;
  }

  const paid = state.coins;
  state.coins = 0;
  state.debt = amount - paid;
  state.debtName = label;
  state.rollCredits = 0;
  addLog(`${label}需￥${amount}，已支付￥${paid}，仍欠￥${state.debt}，原地停留。`, "OWE");
  showResult({ icon: "🪙", kicker: "COINS NEEDED", title: "金币不足，原地停留", text: `需要通过撤离成功补齐${label}的差价，补齐后才能继续掷骰。`, amountText: `待缴￥${state.debt}` });
  return false;
}

function applySpecialTile(tile) {
  let result;
  if (tile.effect === "friend_aw") {
    state.coins += 30;
    result = { icon: "💌", kicker: "EVENT", title: "带出3友AW", text: "按照海报事件规则，获得￥30。", amountText: "+￥30" };
  } else if (tile.effect === "heat_loss") {
    const loss = Math.min(20, state.coins);
    state.coins -= loss;
    result = { icon: "☀️", kicker: "EVENT", title: "天气炎热中暑", text: "按照海报事件规则，丢失￥20。", amountText: `−￥${loss}` };
  } else if (tile.effect === "mouse_bonus") {
    state.mouseBonus = true;
    result = { icon: "🐭", kicker: "CHANCE", title: "下一局每只鼠鼠", text: "机会战绩将显示鼠鼠数量；下一次撤离成功时，每只可额外获得￥5。", amountText: "每只+￥5" };
  } else if (tile.effect === "double_or_half") {
    state.doubleNext = true;
    result = { icon: "🎴", kicker: "DESTINY", title: "命运：下一个撤离", text: "撤离成功奖励双倍金币；撤离失败，现有金币减半。", amountText: "成功×2 · 失败÷2" };
  } else if (tile.effect === "scratch_reward") {
    state.coins += 20;
    result = { icon: "🎁", kicker: "EVENT", title: "刮刮乐", text: "按照海报事件规则，获得￥20。", amountText: "+￥20" };
  } else if (tile.effect === "kill_bonus") {
    state.killBonus = true;
    result = { icon: "🎯", kicker: "CHANCE", title: "下一局每杀一人", text: "机会战绩将显示击杀数量；下一次撤离结算时，每击杀一人可获得￥5。", amountText: "每杀一人+￥5" };
  }

  state.rollCredits = 1;
  addLog(`${tile.kicker}：${tile.name}，结算后可重新掷骰。`, tile.kicker.toUpperCase());
  if (result) showResult(result);
  emitBoardParticles("✦", 9, tile.effect === "heat_loss" ? "#ed789a" : "#62b9db");
  playRewardSound();
}

function emitBoardParticles(symbol = "✦", count = 9, color = "#f3bd37") {
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");
    particle.className = "board-particle";
    particle.textContent = symbol;
    particle.style.setProperty("--particle-x", `${38 + Math.random() * 24}%`);
    particle.style.setProperty("--particle-y", `${48 + Math.random() * 18}%`);
    particle.style.setProperty("--particle-dx", `${Math.round((Math.random() - .5) * 150)}px`);
    particle.style.setProperty("--particle-rotate", `${Math.round((Math.random() - .5) * 110)}deg`);
    particle.style.setProperty("--particle-color", color);
    particle.style.animationDelay = `${index * 35}ms`;
    board.appendChild(particle);
    window.setTimeout(() => particle.remove(), 1200 + index * 35);
  }
}

function centerBoardOnCurrent(smooth = true) {
  if (window.innerWidth >= 760) return;
  const scroller = document.querySelector(".board-scroll");
  const currentTile = document.querySelector(`.tile[data-index="${state.position}"]`);
  if (!scroller || !currentTile) return;
  const targetLeft = currentTile.offsetLeft - (scroller.clientWidth - currentTile.clientWidth) / 2;
  scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: smooth ? "smooth" : "auto" });
}

function centerExtractionOnMobile() {
  if (window.innerWidth >= 760) return;
  const scroller = document.querySelector(".board-scroll");
  const extractionShell = document.querySelector(".center-extraction-shell");
  if (!scroller || !extractionShell) return;
  const targetLeft = extractionShell.offsetLeft + (extractionShell.clientWidth - scroller.clientWidth) / 2;
  scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
}

function showResult({ icon, kicker, title, text, amountText }) {
  document.querySelector("#resultIcon").textContent = icon;
  document.querySelector("#resultKicker").textContent = kicker;
  document.querySelector("#resultTitle").textContent = title;
  document.querySelector("#resultText").textContent = text;
  document.querySelector("#resultAmount").textContent = amountText;
  if (!resultDialog.open) resultDialog.showModal();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function playTone(frequency, duration = .08, type = "sine", volume = .035) {
  if (!state.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio is optional.
  }
}

function playRewardSound() {
  playTone(520, .1, "sine", .035);
  window.setTimeout(() => playTone(740, .14, "sine", .035), 90);
}

function toggleSound() {
  state.sound = !state.sound;
  updateSoundButton();
  saveState();
  if (state.sound) playRewardSound();
  showToast(state.sound ? "旅行音效已开启" : "旅行音效已关闭");
}

function resetGame() {
  const approved = window.confirm("确定重新开始吗？当前金币、欠费和特殊效果都会重置。\n金币钱包将恢复为￥20，已锁定的环球路线也会解除。");
  if (!approved) return;
  const keepSound = state.sound;
  state = defaultState();
  state.sound = keepSound;
  setDiceFace(1);
  resetSettlementInputs();
  resetPlanSelection();
  renderBoard();
  updateUI();
  showToast("新一局已开始：金币钱包￥20");
}

rollButton.addEventListener("click", rollDice);
successButton.addEventListener("click", settleSuccess);
failureButton.addEventListener("click", settleFailure);
soundButton.addEventListener("click", toggleSound);
document.querySelector("#resetButton").addEventListener("click", resetGame);
document.querySelector("#rulesButton").addEventListener("click", () => rulesDialog.showModal());
document.querySelector("#closeRulesButton").addEventListener("click", () => rulesDialog.close());
document.querySelector("#startPlayingButton").addEventListener("click", () => rulesDialog.close());
document.querySelector("#closeResultButton").addEventListener("click", () => resultDialog.close());

const planButtons = [...document.querySelectorAll(".plan-row")];
const planList = document.querySelector("#planList");
const routeOrderPanel = document.querySelector("#routeOrderPanel");
const planHeaderStatus = document.querySelector("#planHeaderStatus");
const selectedPlanTitle = document.querySelector("#selectedPlanTitle");
const selectedPlanSummary = document.querySelector("#selectedPlanSummary");
const confirmPlanButton = document.querySelector("#confirmPlanButton");
let selectedPlanButton = null;
let planConfirmed = false;

function selectPlan(planButton, announce = true) {
  if (planConfirmed) {
    showToast("路线已经锁定，如需更换请点击顶部「重开」");
    return;
  }
  selectedPlanButton = planButton;
  planList.classList.add("has-selection");
  routeOrderPanel.classList.remove("is-confirmed");
  confirmPlanButton.classList.remove("is-confirmed");

  planButtons.forEach((button) => {
    const selected = button === planButton;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector(".plan-tag i").textContent = selected ? "✓" : "○";
    button.querySelector(".plan-tag b").textContent = selected ? "已选择" : "选择路线";
  });

  const { plan, price, guarantee, countries } = planButton.dataset;
  selectedPlanTitle.textContent = `已选择：${plan}`;
  selectedPlanSummary.textContent = `${price} · 保 ${guarantee} · 环游 ${countries} 个国家`;
  planHeaderStatus.textContent = `当前选择：${plan} · 请确认后联系人工客服下单`;
  confirmPlanButton.disabled = false;
  confirmPlanButton.textContent = `确认「${plan}」`;

  try {
    localStorage.setItem("haili-club-selected-plan", plan);
    localStorage.removeItem("haili-club-plan-confirmed");
  } catch {
    // Route selection still works when local storage is unavailable.
  }

  if (announce) showToast(`已选择「${plan}」：${price} · 环游${countries}个国家`);
}

function confirmSelectedPlan(announce = true) {
  if (!selectedPlanButton) return;
  planConfirmed = true;
  const { plan, price, guarantee, countries } = selectedPlanButton.dataset;
  planList.classList.add("is-locked");
  routeOrderPanel.classList.add("is-confirmed");
  confirmPlanButton.classList.add("is-confirmed");
  confirmPlanButton.disabled = true;
  confirmPlanButton.textContent = "✓ 已确认并锁定";
  selectedPlanTitle.textContent = `路线已锁定：${plan}`;
  selectedPlanSummary.textContent = `${price} · 保 ${guarantee} · 环游 ${countries} 个国家｜如需更换，请点击顶部「重开」`;
  planHeaderStatus.textContent = `已锁定：${plan} · 路线不可更换，重开后可重新选择`;

  planButtons.forEach((button) => {
    const selected = button === selectedPlanButton;
    button.disabled = true;
    button.querySelector(".plan-tag i").textContent = selected ? "✓" : "×";
    button.querySelector(".plan-tag b").textContent = selected ? "已锁定" : "不可更换";
  });

  try {
    localStorage.setItem("haili-club-plan-confirmed", "true");
  } catch {
    // Locking still works for the current page when local storage is unavailable.
  }

  if (announce) showToast("路线已确认并锁定；如需更换，请点击顶部「重开」");
}

function resetPlanSelection() {
  planConfirmed = false;
  selectedPlanButton = null;
  planList.classList.remove("has-selection", "is-locked");
  routeOrderPanel.classList.remove("is-confirmed");
  confirmPlanButton.classList.remove("is-confirmed");
  confirmPlanButton.disabled = true;
  confirmPlanButton.textContent = "请先选择路线";
  selectedPlanTitle.textContent = "尚未选择环球路线";
  selectedPlanSummary.textContent = "请点击上方任一套餐，查看下单内容";
  planHeaderStatus.textContent = "先选择路线，再确认下单 · 当前未选择";

  planButtons.forEach((button) => {
    button.disabled = false;
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
    button.querySelector(".plan-tag i").textContent = "○";
    button.querySelector(".plan-tag b").textContent = "选择路线";
  });

  try {
    localStorage.removeItem("haili-club-selected-plan");
    localStorage.removeItem("haili-club-plan-confirmed");
  } catch {
    // Ignore unavailable local storage.
  }
}

planButtons.forEach((planButton) => {
  planButton.setAttribute("aria-pressed", "false");
  planButton.addEventListener("click", () => selectPlan(planButton));
});

confirmPlanButton.addEventListener("click", () => confirmSelectedPlan());

try {
  const savedPlan = localStorage.getItem("haili-club-selected-plan");
  const savedConfirmed = localStorage.getItem("haili-club-plan-confirmed") === "true";
  const savedButton = planButtons.find((button) => button.dataset.plan === savedPlan);
  if (savedButton) selectPlan(savedButton, false);
  if (savedButton && savedConfirmed) confirmSelectedPlan(false);
} catch {
  // Ignore unavailable local storage.
}

board.addEventListener("pointermove", (event) => {
  const bounds = board.getBoundingClientRect();
  board.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
  board.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  board.classList.add("has-pointer");
});

board.addEventListener("pointerleave", () => board.classList.remove("has-pointer"));

rulesDialog.addEventListener("click", (event) => {
  if (event.target === rulesDialog) rulesDialog.close();
});

resultDialog.addEventListener("click", (event) => {
  if (event.target === resultDialog) resultDialog.close();
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || event.target.closest("button, a, input, select, dialog")) return;
  event.preventDefault();
  rollDice();
});

document.querySelector("#centerExtractionMount")?.appendChild(document.querySelector(".extraction-panel"));
renderBoard();
updateUI();
requestAnimationFrame(centerExtractionOnMobile);
