let video;
let handPose;
let hands = [];
let gesture = "等待辨識...";

// 遊戲相關變數
let gameState = "WAITING"; // WAITING, COUNTDOWN, RESULT
let countdownTimer = 0;
let lastActionTime = 0;
let computerChoice = "";
let playerFinalGesture = "";
let gameResultMessage = "";
let computerColor = "#000000";
let particles = [];

function preload() {
  // preload 函數中不再初始化 ml5.handPose，改為在 setup 中初始化
}

function gotHands(results) {
  hands = results;
}

function setup() {
  // 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  video.hide();

  // 檢查 ml5 是否成功載入再初始化模型
  if (typeof ml5 !== 'undefined') {
    handPose = ml5.handPose(function() {
      console.log("模型準備好了！");
      handPose.detectStart(video, gotHands);
    });
  } else {
    console.error("錯誤：ml5.js 未載入，請檢查 index.html 中的 script 標籤。");
  }
  // 隱藏預設的 HTML 影片元件，避免重複顯示
}

function draw() {
  // 畫布背景顏色為 e7c6ff
  background('#ffccd5');

  // 計算影像顯示的寬高（畫布寬高之較小者的 60%，維持比例或依需求直接設定寬高 60%）
  // 這裡依據你的需求：顯示的影像寬高為整個畫布寬高的 60%
  let vW = width * 0.6;
  let vH = height * 0.6;
  let x = (width - vW) / 2;
  let y = (height - vH) / 2;

  // 鏡面反轉處理：使用 push/pop 確保只有影像和手部關節被反轉
  push();
  // 1. 先移動到影像顯示區域的右邊界
  // 2. 將水平縮放設為 -1 (達成鏡像)
  translate(x + vW, y);
  scale(-1, 1);

  // 將影像繪製在 (0, 0)，此時已經是鏡像狀態
  image(video, 0, 0, vW, vH);

  // 處理偵測到的手勢
  if (hands.length > 0) {
    for (let hand of hands) {
      // 判斷手勢
      gesture = calculateGesture(hand);
      
      // 根據手勢決定顏色
      let handColor = '#ff758f'; // 預設粉紅
      if (gesture.includes("石頭")) handColor = '#800f2f';
      else if (gesture.includes("剪刀")) handColor = '#fff0f3';
      else if (gesture.includes("布")) handColor = '#c9184a';
      else if (gesture === "6") handColor = '#ffb703'; // 6 的顏色

      // 繪製手部關鍵點與連線，傳入動態顏色
      drawKeypoints(hand, 0, 0, vW, vH, handColor);
      
      // 遊戲狀態機控制
      if (gesture === "6" && (gameState === "WAITING" || gameState === "RESULT")) {
        gameState = "COUNTDOWN";
        countdownTimer = 3;
        lastActionTime = millis();
      }
    }
  } else {
    gesture = "請伸出手...";
  }
  pop(); // 恢復座標系，避免文字也被反轉

  // 處理遊戲邏輯與顯示
  displayGameUI(y);

  // 更新與顯示煙火粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function displayGameUI(yOffset) {
  textSize(48);
  textAlign(CENTER, CENTER);
  
  if (gameState === "WAITING") {
    fill(0);
    text("比出「6」的手勢開始遊戲", width / 2, yOffset / 2);
  } 
  else if (gameState === "COUNTDOWN") {
    let elapsed = millis() - lastActionTime;
    if (elapsed < 3000) {
      countdownTimer = 3 - Math.floor(elapsed / 1000);
      fill('#c9184a');
      text("準備... " + countdownTimer, width / 2, yOffset / 2);
    } else {
      // 倒數結束，決定勝負
      runGameLogic();
    }
  } 
  else if (gameState === "RESULT") {
    fill(0);
    textSize(32);
    text(`你出: ${playerFinalGesture}  vs  電腦出: ${computerChoice}`, width / 2, yOffset / 2 - 30);
    fill(computerColor);
    textSize(48);
    text(gameResultMessage, width / 2, yOffset / 2 + 30);
    textSize(24);
    fill(100);
    text("再次比出「6」重新玩", width / 2, height - 50);
  }
}

function runGameLogic() {
  // 1. 決定玩家當時的手勢
  playerFinalGesture = gesture;
  if (playerFinalGesture === "辨識中..." || playerFinalGesture === "6") {
    playerFinalGesture = "不知所云";
  }

  // 2. 電腦隨機選擇
  let options = ["石頭 (Rock) ✊", "剪刀 (Scissors) ✌️", "布 (Paper) 🖐️"];
  let choiceIdx = Math.floor(random(3));
  computerChoice = options[choiceIdx];
  
  // 設定電腦對應的顏色
  if (choiceIdx === 0) computerColor = "#800f2f";
  else if (choiceIdx === 1) computerColor = "#ff758f"; // 稍微調整淺一點
  else computerColor = "#c9184a";

  // 3. 判斷勝負
  if (playerFinalGesture === computerChoice) {
    gameResultMessage = "平手！ 🤝";
  } else if (
    (playerFinalGesture.includes("石頭") && computerChoice.includes("剪刀")) ||
    (playerFinalGesture.includes("剪刀") && computerChoice.includes("布")) ||
    (playerFinalGesture.includes("布") && computerChoice.includes("石頭"))
  ) {
    gameResultMessage = "你贏了！ 🎉";
    // 贏了就放煙火！
    spawnFirework(width * 0.2, height * 0.5);
    spawnFirework(width * 0.8, height * 0.5);
    spawnFirework(width * 0.5, height * 0.3);
  } else {
    gameResultMessage = "你輸了... 😢";
  }

  gameState = "RESULT";
}

// 簡單的手勢判斷邏輯
function calculateGesture(hand) {
  // 取得手指末端與關節點的 Y 座標
  // 8: 食指末端, 6: 食指第二關節
  // 12: 中指末端, 10: 中指第二關節
  // 16: 無名指末端, 14: 無名指第二關節
  // 20: 小指末端, 18: 小指第二關節
  
  let indexUp = hand.keypoints[8].y < hand.keypoints[6].y;
  let middleUp = hand.keypoints[12].y < hand.keypoints[10].y;
  let ringUp = hand.keypoints[16].y < hand.keypoints[14].y;
  let pinkyUp = hand.keypoints[20].y < hand.keypoints[18].y;
  let thumbUp = hand.keypoints[4].y < hand.keypoints[3].y; // 拇指簡易判斷
  
  // 偵測「6」的手勢 (拇指和小指伸出，其他收起來)
  // 這裡稍微放寬條件，只檢查這兩根手指
  let isSix = thumbUp && pinkyUp && !indexUp && !middleUp && !ringUp;
  
  if (isSix) {
    return "6";
  }

  // 判斷邏輯
  if (indexUp && middleUp && ringUp && pinkyUp) {
    return "布 (Paper) 🖐️";
  } else if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return "剪刀 (Scissors) ✌️";
  } else if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "石頭 (Rock) ✊";
  } else {
    return "辨識中...";
  }
}

// 繪製手部關節點並進行座標轉換
function drawKeypoints(hand, startX, startY, drawW, drawH, handColor) {
  // 確保影片寬高已讀取，避免除以 0
  let vWidth = video.width > 0 ? video.width : 640;
  let vHeight = video.height > 0 ? video.height : 480;

  // 定義手掌關節的連接順序 (0: 手腕, 1-4: 拇指, 5-8: 食指, 9-12: 中指, 13-16: 無名指, 17-20: 小指)
  let connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],     // 拇指
    [0, 5], [5, 6], [6, 7], [7, 8],     // 食指
    [0, 9], [9, 10], [10, 11], [11, 12], // 中指
    [0, 13], [13, 14], [14, 15], [15, 16], // 無名指
    [0, 17], [17, 18], [18, 19], [19, 20], // 小指
    [5, 9], [9, 13], [13, 17]           // 掌心連線
  ];

  // 繪製連線
  stroke(handColor); // 使用動態變更的顏色
  strokeWeight(3);
  for (let conn of connections) {
    let p1 = hand.keypoints[conn[0]];
    let p2 = hand.keypoints[conn[1]];
    let x1 = map(p1.x, 0, vWidth, startX, startX + drawW);
    let y1 = map(p1.y, 0, vHeight, startY, startY + drawH);
    let x2 = map(p2.x, 0, vWidth, startX, startX + drawW);
    let y2 = map(p2.y, 0, vHeight, startY, startY + drawH);
    line(x1, y1, x2, y2);
  }

  // 繪製圓點
  noStroke();
  fill(255); // 關節點改為白色較為亮眼
  for (let i = 0; i < hand.keypoints.length; i++) {
    let kp = hand.keypoints[i];
    
    let mappedX = map(kp.x, 0, vWidth, startX, startX + drawW);
    let mappedY = map(kp.y, 0, vHeight, startY, startY + drawH);
    circle(mappedX, mappedY, 5); // 圓形變小
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}

// 煙火粒子類別
class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 10));
    this.acc = createVector(0, 0.15); // 重力
    this.lifespan = 255;
    this.color = col;
  }
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }
  show() {
    let c = color(this.color);
    fill(red(c), green(c), blue(c), this.lifespan);
    noStroke();
    ellipse(this.pos.x, this.pos.y, random(3, 6));
  }
  isDead() { return this.lifespan < 0; }
}

function spawnFirework(x, y) {
  let p5Colors = ['#800f2f', '#c9184a', '#ff758f', '#ffb703'];
  let col = random(p5Colors);
  for (let i = 0; i < 40; i++) {
    particles.push(new Particle(x, y, col));
  }
}
