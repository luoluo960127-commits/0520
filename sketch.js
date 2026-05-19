let video;
let handPose;
let hands = [];
let gesture = "等待辨識...";

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
  background('#e7c6ff');

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
      // 繪製手部關鍵點（在反轉後的座標系中，起點為 0, 0）
      drawKeypoints(hand, 0, 0, vW, vH);
    }
  } else {
    gesture = "請伸出手...";
  }
  pop(); // 恢復座標系，避免文字也被反轉

  // 顯示辨識結果文字
  fill(0);
  textSize(48);
  textAlign(CENTER, CENTER);
  text(gesture, width / 2, y / 2);
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
function drawKeypoints(hand, startX, startY, drawW, drawH) {
  // 確保影片寬高已讀取，避免除以 0
  let vWidth = video.width > 0 ? video.width : 640;
  let vHeight = video.height > 0 ? video.height : 480;

  for (let i = 0; i < hand.keypoints.length; i++) {
    let kp = hand.keypoints[i];
    
    // 將攝影機座標 (kp.x, kp.y) 映射到畫布上顯示影片的區域
    let mappedX = map(kp.x, 0, vWidth, startX, startX + drawW);
    let mappedY = map(kp.y, 0, vHeight, startY, startY + drawH);

    fill(0, 255, 0);
    noStroke();
    circle(mappedX, mappedY, 10);
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
