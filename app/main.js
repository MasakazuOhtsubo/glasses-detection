const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const cameraSelect = document.getElementById('cameraSelect');
const ctx = canvas.getContext('2d');

canvas.width = 640;
canvas.height = 480;

let model;
let currentStream;

// デバイスリストの取得とカメラ選択ドロップダウンに表示
navigator.mediaDevices.enumerateDevices().then(devices => {
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    videoDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `カメラ ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(option);
    });

    if (videoDevices.length > 0) {
        // 初期カメラの設定
        startCamera(videoDevices[0].deviceId);
    }
});

// カメラ変更イベント
cameraSelect.onchange = () => {
    startCamera(cameraSelect.value);
};

// カメラの起動
function startCamera(deviceId) {
    if (currentStream) {
        // 前のストリームを停止
        currentStream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
    }).then(stream => {
        currentStream = stream;
        video.srcObject = stream;
    }).catch(err => {
        console.error("カメラの起動に失敗しました: ", err);
    });
}

// coco-ssdモデルをロードして物体検出を開始
cocoSsd.load().then(loadedModel => {
    model = loadedModel;
    detectObjects();
});

function detectObjects() {
    model.detect(video).then(predictions => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach(prediction => {
            if (prediction.class === 'person' || prediction.class === 'glasses') {
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

        // 再帰的に検出を繰り返す
        requestAnimationFrame(detectObjects);
    });
}
