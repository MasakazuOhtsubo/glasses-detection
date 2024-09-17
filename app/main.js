const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ビデオサイズ
canvas.width = 640;
canvas.height = 480;

// カメラストリームの取得
navigator.mediaDevices.getUserMedia({
    video: true
}).then(stream => {
    video.srcObject = stream;
}).catch(err => {
    console.error("カメラの起動に失敗しました: ", err);
});

// coco-ssdモデルをロード
let model;
cocoSsd.load().then(loadedModel => {
    model = loadedModel;
    detectObjects();
});

function detectObjects() {
    model.detect(video).then(predictions => {
        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach(prediction => {
            if (prediction.class === 'person' || prediction.class === 'glasses') {
                // 検出された物体に枠を描く
                ctx.beginPath();
                ctx.rect(...prediction.bbox);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'green';
                ctx.fillStyle = 'green';
                ctx.stroke();
                ctx.fillText(
                    prediction.class + ' - ' + Math.round(prediction.score * 100) + '%',
                    prediction.bbox[0],
                    prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
                );
            }
        });

        // 次のフレームで再び検出
        requestAnimationFrame(detectObjects);
    });
}
