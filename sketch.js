let video;

function setup() {
  // 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  // 隱藏預設的 HTML 影片元件，避免重複顯示
  video.hide();
}

function draw() {
  // 畫布背景顏色為 e7c6ff
  background('#e7c6ff');

  // 計算影像顯示的寬高（畫布寬高的 60%）並置中
  let vW = width * 0.6;
  let vH = height * 0.6;
  let x = (width - vW) / 2;
  let y = (height - vH) / 2;

  // 將影像繪製在畫布中間
  image(video, x, y, vW, vH);
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
