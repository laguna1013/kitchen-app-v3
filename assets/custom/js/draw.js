let clickX = [];
let clickY = [];
let clickDrag = [];
let flag;
let webcam;

let canvas;
let ctx;

let addClick = (x, y, dragging) => {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
}

let draw = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas

    ctx.strokeStyle = "black";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;

    for (var i = 0; i < clickX.length; i++) {
        ctx.beginPath();
        if (clickDrag[i] && i) {
            ctx.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            ctx.moveTo(clickX[i] - 1, clickY[i]);
        }
        ctx.lineTo(clickX[i], clickY[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

let sign_erase = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    clickX = [];
    clickY = [];
    clickDrag = [];
    $('.signature-image').attr('src', '');
    $('.signature-image').addClass('hide');
    $('.signature-canvas').removeClass('hide');
}

let sign_save = () => {
    var dataURL = canvas.toDataURL();
    sign_erase();
    $('.signature-canvas').addClass('hide');
    $('.signature-image').removeClass('hide');
    $('.signature-image').attr('src', dataURL);
}

let start_draw = (id) => {
    if(id == 0){
        canvas = document.querySelector('#add-raw-modal .signature-canvas');
    }else{
        canvas = document.querySelector('#dispose-raw-modal .signature-canvas');
    }
    ctx = canvas.getContext("2d");
    sign_erase();
    $('.signature-canvas').removeClass('hide');
    $('.signature-image').addClass('hide');
}

// Cam control
let camera_trigger = (id) => {
    let webcamElement;
    let canvasElement;
    let snapSoundElement;
    if(id == 0){
        webcamElement = document.querySelector('#add-raw-modal .webcam');
        canvasElement = document.querySelector('#add-raw-modal .canvas');
        snapSoundElement = document.querySelector('#add-raw-modal .snapSound');
    }else{
        webcamElement = document.querySelector('#dispose-raw-modal .webcam');
        canvasElement = document.querySelector('#dispose-raw-modal .canvas');
        snapSoundElement = document.querySelector('#dispose-raw-modal .snapSound');
    }
    $('.webcam').removeClass('hide');
    $('.camera-image').addClass('hide');
    $('.camera-image').attr('src', '');
    webcam = new Webcam(webcamElement, 'user', canvasElement, snapSoundElement);
    webcam.start()
        .then(result =>{
            console.log("webcam started");
        })
        .catch(err => {
            console.log(err);
            kitchen_notification("Camera not found!", `Your device does not have camera. Please install it before using this function.`, 'assets/img/media/danger.png', false, 5000);
        });
}

let camera_snap = () => {
    let picture = webcam.snap();
    webcam.stop();
    $('.webcam').addClass('hide');
    $('.canvas').addClass('hide');
    $('.camera-image').attr('src', picture);
    $('.camera-image').removeClass('hide');
}

$('.signature-canvas').mousedown(function(e) {
    var offset = $(this).offset()
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;

    flag = true;
    addClick(e.pageX - offset.left, e.pageY - offset.top);
    draw();
});

$('.signature-canvas').mousemove(function(e) {
    if (flag) {
        var offset = $(this).offset();
        addClick(e.pageX - offset.left, e.pageY - offset.top, true);
        draw();
    }
});

$('.signature-canvas').mouseup(function(e) {
    flag = false;
});

$('.signature-canvas').mouseleave(function(e) {
    flag = false;
});
