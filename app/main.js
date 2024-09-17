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
    console.log('カメラデバイス一覧:', videoDevices);
    videoDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `カメラ ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(option);
    });

    if (videoDevices.length > 0) {
        // 初期カメラの設定
        console.log('初期カメラ:', videoDevices[0].deviceId);
        startCamera(videoDevices[0].deviceId);
    }
});

// カメラ変更イベント
cameraSelect.onchange = () => {
    console.log('選択されたカメラ:', cameraSelect.value);
    startCamera(cameraSelect.value);
};

// カメラの起動
function startCamera(deviceId) {
    if (currentStream) {
        // 前のストリームを停止
        console.log('前のストリームを停止します');
        currentStream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
    }).then(stream => {
        currentStream = stream;
        video.srcObject = stream;

        console.log('カメラストリームが開始されました:', stream);

        // 動画の再生が準備できたら物体検出を開始
        video.onloadedmetadata = () => {
            video.play();  // カメラ映像の再生を開始
            console.log('ビデオのメタデータがロードされました');

            if (!model) {
                // モデルのロードが完了していない場合、モデルをロード
                console.log('モデルをロードしています...');
                cocoSsd.load().then(loadedModel => {
                    model = loadedModel;
                    console.log('モデルがロードされました');
                    detectObjects();  // 検出処理を開始
                });
            } else {
                console.log('既存のモデルを使用して検出を開始します');
                detectObjects();  // モデルが既にロード済みの場合は検出を開始
            }
        };
    }).catch(err => {
        console.error("カメラの起動に失敗しました: ", err);
    });
}

// 検出処理の実行
function detectObjects() {
    console.log('物体検出を開始します');
    model.detect(video).then(predictions => {
        console.log('物体検出の結果:', predictions);
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

        // 次のフレームで再び検出
        requestAnimationFrame(detectObjects);
    }).catch(err => {
        console.error("物体検出中にエラーが発生しました: ", err);
    });
}
