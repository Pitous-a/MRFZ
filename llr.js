const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d", {
    willReadFrequently: true
});
//重置画布
const initCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

//清空画布
const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//获取随机数
const getRandom = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//图片路径列表
const BASEURL = "./img/";
const suffix = ".png";
// const imgList = ["logo_kazimierz", "logo_rhine", "logo_rhodes2", "logo_yan", "logo_victoria"];
const imgList = ["logo_kazimierz", "logo_rhine", "logo_yan", "logo_victoria"];
let nowImg = 0;

let mouseX = null;
let mouseY = null;

let timer = null;
document.addEventListener("mousemove", function (e) {
    setTimeout(function () {
        initCanvasSize();
        mouseX = e.clientX;
        mouseY = e.clientY;
        // requestAnimationFrame(circle);
    }, 100);
});


//页面可见性改变事件
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        //定时器
        timer = setInterval(update(), 5000);
    }
    else {
        // particles = [];
        clearInterval(timer);
    }
});

// 粒子类
class Particle {

    constructor(tx, ty, average_x, average_y) {
        // this.x = getRandom(canvas.width / 2 - 512, canvas.width / 2 + 512);
        // this.y = getRandom(canvas.height / 2 - 512, canvas.height / 2 + 512);

        //粒子的位置
        if (average_x && average_y) {
            this.x = average_x + getRandom(-100, 100);
            this.y = average_y + getRandom(-100, 100);
        }
        else {
            this.x = tx + getRandom(-512, 0);
            this.y = ty + getRandom(-512, 0);
        }


        //粒子的目标位置
        this.tx = tx;
        this.ty = ty;

        //粒子的大小
        this.size = 1.5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        //越近越亮
        const r = Math.sqrt((this.x - this.tx) ** 2 + (this.y - this.ty) ** 2);
        const alpha = 0.8 - r / maxDis;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
    }

    //一帧动画
    move() {
        const startTime = Date.now();
        let lastTime = startTime;

        //比例因子
        const k = 0.15;
        const _move = () => {

            const nowTime = Date.now();
            const deltaTime = nowTime - lastTime;
            lastTime = nowTime;

            //速度
            let xSpeed = (this.tx - this.x) / duration;
            let ySpeed = (this.ty - this.y) / duration;

            if (mouseX && mouseY) {
                const r = Math.sqrt((this.x - mouseX) ** 2 + (this.y - mouseY) ** 2);
                // console.log(r);
                let a = 0;
                if (r < maxDis) {
                    a = Math.sqrt(maxDis / (r + 1)) - 1;
                }

                if (r != 0) {
                    xSpeed += (this.x - mouseX) / r * a * k;
                    ySpeed += (this.y - mouseY) / r * a * k;
                }
                else {
                    xSpeed += (Math.random() * 2 * Math.PI - Math.PI) * a * k;
                    ySpeed += (Math.random() * 2 * Math.PI - Math.PI) * a * k;
                }
            }

            this.x += (xSpeed) * deltaTime;
            this.y += (ySpeed) * deltaTime;
            requestAnimationFrame(_move);
        }
        _move();
    }

};


//粒子数组
let particles = [];
//目标点数组
let targets = [];
//鼠标周围圆的半径
const circleR = 20;
//总运动时间
const duration = 300;
//最大生效距离
const maxDis = 300;
//绘制
const draw = () => {
    clear();
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }
    requestAnimationFrame(draw);
}

//更新粒子位置
const update = () => {
    //加载图片
    const img = document.createElement("img");
    // const img = new Image();
    img.src = BASEURL + imgList[nowImg] + suffix;
    img.crossOrigin = "anonymous";
    nowImg = (nowImg + 1) % imgList.length;
    img.onload = function () {
        console.log(img.width, img.height);
        //画图像
        clear();
        ctx.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.height / 2, img.width, img.height);
        targets = getPoints();
        //清空画布
        clear();

        //更新粒子
        if (particles.length > targets.length) {
            particles.splice(targets.length, particles.length - targets.length);
        };

        //打乱数组
        particles.sort(() => Math.random() - 0.5);

        const average_x = targets.reduce((sum, cur) => sum + cur.x, 0) / targets.length;
        const average_y = targets.reduce((sum, cur) => sum + cur.y, 0) / targets.length;
        for (let i = 0; i < targets.length; i++) {
            const { x, y } = targets[i];
            let point = particles[i];
            if (!point) {
                point = new Particle(x, y, average_x, average_y);
                point.move();
                particles.push(point);
            }
            else {
                point.tx = x;
                point.ty = y;
            }
        }

    };
    return update;
}

//获取图片的像素信息
const getPoints = () => {
    const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const points = [];
    const gap = 6;
    for (let i = 0; i < width; i += gap) {
        for (let j = 0; j < height; j += gap) {
            const index = (j * width + i) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            if (r == 255 && g == 255 && b == 255 && a == 255) {
                points.push({
                    x: i,
                    y: j
                });
            };
        };
    };
    return points;
}

// 给鼠标周围加上圆圈
const circle = () => {
    // console.log(mouseX, mouseY);
    ctx.beginPath();
    ctx.arc(mouseX + 3, mouseY + 3, circleR, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgb(255,255,255)";
    ctx.stroke();
    ctx.closePath();
    requestAnimationFrame(circle);
}

const run = () => {
    initCanvasSize();
    timer = setInterval(update(), 5000);
    draw();
    circle();
}

run();

// //相对于本地的路径
// let url = new URL(BASEURL + imgList[nowImg] + suffix, window.location.href);
// console.log(url.href);