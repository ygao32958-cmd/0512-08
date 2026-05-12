let capture;
let faceMesh;
let handPose;
let faces = [];
let hands = [];
let earringImgs = [];
let currentEarringIndex = 0; // 預設顯示第一款

// 最新版 ml5.js 建議在 preload 載入模型
function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: false });
  handPose = ml5.handPose({ flipped: false });
  
  // 載入 5 款耳環圖片
  earringImgs[0] = loadImage('pic/acc1_ring.png');
  earringImgs[1] = loadImage('pic/acc2_pearl.png');
  earringImgs[2] = loadImage('pic/acc3_tassel.png');
  earringImgs[3] = loadImage('pic/acc4_jade.png');
  earringImgs[4] = loadImage('pic/acc5_phoenix.png');
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 設定攝影機，移除了外部的 .size() 以避免部分瀏覽器失效
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 這裡設定基礎辨識尺寸
  capture.hide(); // 隱藏原本出現在畫布下方的 HTML 影片元件

  // 開始連續偵測
  faceMesh.detectStart(capture, gotFaces);
  handPose.detectStart(capture, gotHands);
}

function draw() {
  background('#e7c6ff');

  // 繪製半透明灰色浮水印文字 (置中上方)
  fill(128, 128, 128, 150); // 灰色，150 為透明度
  noStroke();
  textAlign(CENTER, TOP);
  textSize(24);
  text("414730878 高翊嘉", width / 2, 20);
  text("作品為影像辨識_耳環臉譜", width / 2, 55);

  // 根據手勢更新耳環索引
  updateEarringIndex();

  // 檢查攝影機是否已啟動，避免寬度為 0 導致計算錯誤
  if (capture.width === 0) return;

  // 設定影像顯示的寬高為畫布的 50%
  let vW = width * 0.5;
  let vH = height * 0.5;

  // 計算置中座標
  let x = (width - vW) / 2;
  let y = (height - vH) / 2;

  push();
  // 實作左右顛倒（鏡像）
  translate(x + vW, y); // 先移動到影像右側邊界
  scale(-1, 1);         // 水平翻轉座標系
  image(capture, 0, 0, vW, vH); // 在翻轉後的座標系中繪製影像

  // 繪製耳環效果
  if (faces.length > 0) {
    let face = faces[0];
    
    // MediaPipe FaceMesh 索引：150 (左耳垂), 379 (右耳垂)
    let leftLobe = face.keypoints[150];
    let rightLobe = face.keypoints[379];

    // 計算影像相對於顯示區域的縮放比例
    let sX = vW / capture.width;
    let sY = vH / capture.height;

    // 繪製左右耳環，傳入側邊參數以判斷「往外」的方向
    drawEarring(leftLobe.x * sX, leftLobe.y * sY, "left");
    drawEarring(rightLobe.x * sX, rightLobe.y * sY, "right");
  }
  pop();
}

function updateEarringIndex() {
  if (hands.length > 0) {
    let hand = hands[0];
    let fingerCount = 0;

    // 簡單判斷手指是否伸直：指尖(tip) Y 座標低於第二關節(pip) Y 座標
    // 索引點：食指 8 vs 6, 中指 12 vs 10, 無名指 16 vs 14, 小指 20 vs 18
    if (hand.keypoints[8].y < hand.keypoints[6].y) fingerCount++;
    if (hand.keypoints[12].y < hand.keypoints[10].y) fingerCount++;
    if (hand.keypoints[16].y < hand.keypoints[14].y) fingerCount++;
    if (hand.keypoints[20].y < hand.keypoints[18].y) fingerCount++;
    
    // 大拇指判斷比較特殊（水平位移），這裡簡化處理或略過，或用 y 座標概估
    if (hand.keypoints[4].y < hand.keypoints[3].y) fingerCount++;

    // 如果有伸出手指 (1-5)，則更新目前款式
    if (fingerCount >= 1 && fingerCount <= 5) {
      currentEarringIndex = fingerCount - 1;
    }
  }
}

function drawEarring(x, y, side) {
  let img = earringImgs[currentEarringIndex];
  if (img) {
    push();
    // 設定圖片寬度（例如 40 像素），高度依比例縮放
    let imgW = 40;
    let imgH = img.height * (imgW / img.width);
    
    // 定義移動比率 (0.2 表示移動圖片寬/高的 20%)
    let moveOutRatio = 0.2;
    let moveUpRatio = 0.1;

    // 計算偏移量
    // 「往外」：左耳向左 (在鏡像座標中為 +X)，右耳向右 (在鏡像座標中為 -X)
    let offsetX = (side === "left") ? (imgW * moveOutRatio) : (-imgW * moveOutRatio);
    // 「往上」：Y 減少
    let offsetY = - (imgH * moveUpRatio);

    imageMode(CENTER);
    // 原本是 y + imgH/2 (掛在耳垂下)，現在加入位移比率
    image(img, x + offsetX, y + (imgH / 2) + offsetY, imgW, imgH);
    pop();
  }
}
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
