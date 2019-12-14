"use strict"

const canvas = document.getElementById("paint");
const ctx = canvas.getContext("2d");
const paintCont = document.getElementById('paint_cont');

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);


ctx.fillStyle = '#000';
ctx.strokeStyle = "#FF0000";


//----------


class Regime {

	constructor() {
		this.active = false;
		this.draw = false;
		this.x;
		this.y;
		this.img = new Image;

		regimes.push(this);

	}

	get currentX() {
		return event.clientX - Math.floor(this.rect.left) - 2;
	}

	get currentY() {
		return event.clientY - Math.floor(this.rect.top) - 2;
	}

	get rect() {
		return canvas.getBoundingClientRect();
	}
}

class Stroke {

	constructor() {
		this.type = this.active;
		this.color = ctx.strokeStyle;
		this.lineWidth = ctx.lineWidth;
		this.x = [];
		this.y = [];
		this.img;
	}

	get active() {
		for(let i = 0; i < regimes.length; i++) {
			if(regimes[i].active) return regimes[i];
		}

	}

	static strokesStorage = [];
	static strokesDeleted = [];

	static drawCanvas(arr) {

		let currentFillColor = ctx.fillStyle;
		let currentStrokeStyle = ctx.strokeStyle;
		let currentLineWidth = ctx.lineWidth;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		

		for (let i = 0; i < arr.length; ++i) {

			ctx.strokeStyle = arr[i].color;
			ctx.lineWidth = arr[i].lineWidth;

			arr[i].type.restore(arr, i);
		}

		ctx.fillStyle = currentFillColor;
		ctx.strokeStyle = currentStrokeStyle;
		ctx.lineWidth = currentLineWidth;
	};

};


class Line extends Regime {

	render({x = this.x, 
			y = this.y, 
			x1 = this.currentX, 
			y1 = this.currentY}) {

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x1, y1);
		ctx.stroke();
		ctx.closePath();

		let lineWidth = ctx.lineWidth;
		ctx.lineWidth = 1;
		ctx.fillStyle = ctx.strokeStyle;

		ctx.beginPath();
		ctx.arc(x, y, (lineWidth - 1)/2 , 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		ctx.lineWidth = lineWidth;
	}

	save() {
		stroke.x.push(this.x);
		stroke.y.push(this.y);
		stroke.x.push(this.currentX);
		stroke.y.push(this.currentY);
		this.x = this.currentX;
		this.y = this.currentY;
	}

	restore(arr, i) {

		for (let z = 0; z < arr[i].x.length - 1; ++z) {
			
			let options = {
				x: arr[i].x[z],
				y: arr[i].y[z],
				x1: arr[i].x[z + 1],
				y1: arr[i].y[z + 1],
			}

			line.render(options);
		}
	}
}

class Square extends Regime {

	render({x = this.x, 
			y = this.y, 
			x1 = this.currentX, 
			y1 = this.currentY,
			img = this.img}) {

		if(img) ctx.putImageData(img, 0, 0);

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y1);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x1, y);
		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.closePath();
	}

	save() {

		stroke.x.push(this.x);
		stroke.y.push(this.y);
		stroke.x.push(this.currentX);
		stroke.y.push(this.currentY);
	}

	restore(arr, i) {

		let options = {
			x: arr[i].x[0],
			y: arr[i].y[0],
			x1: arr[i].x[1],
			y1: arr[i].y[1],
			img: false,
		}

		this.render(options);
	}
}

class Sphere extends Regime {

	render({x = this.x, 
			y = this.y, 
			x1 = this.offsetX, 
			y1 = this.offsetY,
			img = this.img}) {

		if(img) ctx.putImageData(img, 0, 0);

		ctx.beginPath();
		ctx.arc(x, y, (x1>y1 ? x1:y1) , 0, 2 * Math.PI);
		ctx.stroke();
		ctx.closePath();
	}

	save() {

		stroke.x.push(this.x);
		stroke.y.push(this.y);
		stroke.x.push(this.offsetX);
		stroke.y.push(this.offsetY);
	}

	restore(arr, i) {

		let options = {
			x: arr[i].x[0],
			y: arr[i].y[0],
			x1: arr[i].x[1],
			y1: arr[i].y[1],
			img: false,
		}

		this.render(options);
	}

	get offsetX() {
		return Math.abs(this.x - this.currentX);
	}

	get offsetY() {
		return Math.abs(this.y - this.currentY);
	}
}

class Bucket extends Regime {

	constructor() {
		super();
		
		this.width = canvas.width;
		this.height = canvas.height;
		this.newPos;
		this.reachLeft;
		this.reachRight;

	}

	render() {

		this.pixelStack = [[this.x, this.y]];
		
		this.map = ctx.getImageData(0, 0, canvas.width, canvas.height);
		this.img = ctx.getImageData(0, 0, canvas.width, canvas.height);

		this.colorDetermine(this.pixelPos);

		if(this.fillColorR == this.startR &&
			this.fillColorG == this.startG &&
			this.fillColorB == this.startB) {
			return;
		};

		while(this.pixelStack.length) {

			this.newPos = this.pixelStack.pop();
			this.x = this.newPos[0];
			this.y = this.newPos[1];


			this.pixelPos = (this.y*this.width + this.x) * 4;

			while (this.y-- >= 0 && this.matchStartColor(this.pixelPos)) {
				this.pixelPos -= this.width * 4;

			};

			this.pixelPos += this.width * 4;
			this.y++;

			this.reachLeft = false;
			this.reachRight = false;

			while (this.y++ < this.height - 1 && 
				this.matchStartColor(this.pixelPos)) {

				this.colorPixelMap(this.pixelPos);
				this.colorPixelImg(this.pixelPos);

				if(this.x > 0) {
					if (this.matchStartColor(this.pixelPos - 4)) {
						if(!this.reachLeft) {

							this.pixelStack.push([this.x - 1, this.y]);
							this.reachLeft = true;
						}

					} else if(this.reachLeft) {

						this.reachLeft = false;
					}
				}

				if(this.x < this.width - 1) {
					if(this.matchStartColor(this.pixelPos + 4)) {
						if(!this.reachRight) {

							this.pixelStack.push([this.x + 1, this.y]);
							this.reachRight = true;
						}

					} else if (this.reachRight) {

						this.reachRight = false;
					}
				}

				this.pixelPos += this.width * 4;
			}
		}

		ctx.putImageData(this.img, 0, 0);
	}

	colorDetermine() {

		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(ctx.strokeStyle);

		this.pixelPos = (this.y*this.width + this.x) * 4;

		this.startR = this.map.data[this.pixelPos];;
		this.startG = this.map.data[this.pixelPos + 1];
		this.startB = this.map.data[this.pixelPos + 2];
		this.fillColorR = parseInt(result[1], 16);
		this.fillColorG = parseInt(result[2], 16);
		this.fillColorB = parseInt(result[3], 16);
	}

	matchStartColor(pixelPos) {

		let r = this.map.data[pixelPos];
		let g = this.map.data[pixelPos + 1];
		let b = this.map.data[pixelPos + 2];

		return (r == this.startR && g == this.startG && b == this.startB);
	}

	colorPixelMap(pixelPos) {

		this.map.data[pixelPos] = this.fillColorR;
  		this.map.data[pixelPos+1] = this.fillColorG;
  		this.map.data[pixelPos+2] = this.fillColorB;
  		this.map.data[pixelPos+3] = 255;
	}

	colorPixelImg(pixelPos) {

		let y = this.width * 4;
		let x = 4;
		let pos = pixelPos - 2*(x + y);

		for(let i = 0; i < 3; i++) {
			pos += y;
			for(let z = 0; z < 3; z++) {
				pos += x;
				this.img.data[pos] = this.fillColorR;
		  		this.img.data[pos+1] = this.fillColorG;
		  		this.img.data[pos+2] = this.fillColorB;
		  		this.img.data[pos+3] = 255;
			}
			pos -= 3*x;
		}
	}

	save() {
		stroke.map = ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	restore(arr, i) {
		ctx.putImageData(arr[i].map, 0, 0);
	}
}

let regimes = [];
let stroke;
let active;

let line = new Line();
let square = new Square();
let sphere = new Sphere();

let bucket = new Bucket();

//---------------




canvas.addEventListener("mousedown", event => {

	stroke = new Stroke();
	Stroke.strokesDeleted = [];

	active = stroke.active;


	if (active) {active.draw = true;
		active.x = active.currentX;
		active.y = active.currentY;
		active.img = ctx.getImageData(0, 0, canvas.width, canvas.height);
	};
});


paintCont.addEventListener("mouseup", event => {

	if (square.active && square.draw) {
		square.render({});
		square.save();
	} else if (sphere.active && sphere.draw) {
		sphere.render({});
		sphere.save();
	} else if (bucket.active && bucket.draw) {
		bucket.render();
		bucket.save();
	};

	if(active) active.draw = false;
	


	if(stroke) {
		Stroke.strokesStorage.push(stroke);
		stroke = false;
	}
	


	tugScroll = false;
	tugBlock = false;
	tugStrip = false;
	/*rectScroll = scrollBar.getBoundingClientRect();
	xScroll = event.clientX - rectScroll.left;*/
});


canvas.addEventListener("mousemove", event => {

	if(square.active && square.draw) {
		square.render({});
	} else if (line.active && line.draw) {
		line.render({});
		line.save();
	} else if (sphere.active && sphere.draw) {
		sphere.render({});
	}

});

//---------------

let colors = [];
let colorID = 1;

function addColor(color) {

	for (let i = 0; i < colors.length; i++) {
		if(colors[i] === color) return;
	};

	colors.push(color);

	let el;
	let click = false;
	let currentColorID = colorID;
	colorID += 1;
	el = document.createElement('div');
	el.setAttribute("class", "button_color_cont");
	let domString = `<div id="delete_${currentColorID}" class="delete_color"><img id="delete_png" src="img/delete.png"></div>
					<a class="button_color" id="color_${currentColorID}" style="background-color: ${color}";></a>`;
	el.innerHTML = domString; 
	document.getElementById('color_cont').appendChild(el);

	let currentColor = document.getElementById(`color_${currentColorID}`);

	currentColor.addEventListener("mousedown", event => {
		if(click) {
			changeStyle({colorID: currentColorID, colorDisplay: 'inline-block'});
		} else {
			ctx.strokeStyle = color;
			changeStyle({});
		};

		click = true;

		setTimeout(() => {
			click = false;
		}, 600);
	});

	let curColorDelete = document.getElementById(`delete_${currentColorID}`);

	curColorDelete.addEventListener("mousedown", event => {

		document.getElementById(`delete_${currentColorID}`).parentElement.remove();

		for (let i = 0; i < colors.length; i++) {
			if(colors[i] === color) {
				colors.splice(i, 1);
			};
		};

	});

	
};

let addColors = ['red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 'purple']
for (let i = 0; i < addColors.length; i++) {
	addColor(addColors[i])
};


const gridAddColor = document.getElementById("grid_add_color");

let colorPickerStyle = [

		`.color_picker {
			max-height: 0px;
			margin-bottom: 0px;
			padding: 0;
			pointer-events: none;
		}`,

		`.color_picker_elwraper {
			opacity: 0;
		}`,

		`.grid_add_color_activator {
			pointer-events: all;
		}`
];

gridAddColor.addEventListener("mousedown", event => {
	colorPickerStyle = [
		`.color_picker {
			max-height: 300px;
			margin-bottom: 10px;
			padding: 15px 10px 15px 15px;
			pointer-events: all;

			transition: max-height 2s ease, 
			margin-bottom 0.5s ease, 
			padding 0.5s ease;
		}`,

		`.color_picker_elwraper {
			opacity: 1;

			transition: opacity 0.5s ease;
			transition-delay: 1s;
		}`,

		`.grid_add_color_activator {
			pointer-events: none;
		}`
	];
	changeStyle({});

});


//---------------

const clearLatest = document.getElementById('clearLatest');
const returnLatest = document.getElementById('returnLatest');
const clearAll = document.getElementById('clearAll');


clearLatest.addEventListener("mousedown", event => {
	Stroke.strokesDeleted.push(Stroke.strokesStorage.pop());
	Stroke.drawCanvas(Stroke.strokesStorage);
});

returnLatest.addEventListener("mousedown", event => {
	let stroke = Stroke.strokesDeleted.pop()
	if (stroke) Stroke.strokesStorage.push(stroke);
	Stroke.drawCanvas(Stroke.strokesStorage);
});

clearAll.addEventListener("mousedown", event => {
	Stroke.strokesStorage = [];
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
});

//---------------

const scroll = document.getElementById('scroll');
const scrollBar = document.getElementById('bar');
const thickCont = document.getElementById('thickness_cont');


let tugScroll = false, xScroll = false;
let rectScroll;
let scrollPos = -6.5;


scroll.addEventListener("mousedown", event => {
	tugScroll = true;
	rectScroll = scrollBar.getBoundingClientRect();
	xScroll = event.clientX - rectScroll.left;
	}
);

thickCont.addEventListener("mousemove", event => {
	let offSet;
	rectScroll = scrollBar.getBoundingClientRect();
	if(tugScroll) {
		offSet = (event.clientX - rectScroll.left)- xScroll;
		xScroll = event.clientX - rectScroll.left;
		if (scrollPos + offSet > -6.5 && scrollPos + offSet < 142.5) {

			scroll.style = `left: ${scrollPos += offSet}px;`;
		};
	}

	ctx.lineWidth = scrollPos * 0.1;
	if (ctx.lineWidth < 0.75 ) ctx.lineWidth = 0.75;
});

//---------------

const regimeLine = document.getElementById('line');
const regimeSquare = document.getElementById('square');
const regimeSphere = document.getElementById('sphere');

function deactivateRegimes(arr) {
	for (let i = 0; i < arr.length; i++) {
		arr[i].active = false;
	}
};

regimeLine.addEventListener("mousedown", event => {
	deactivateRegimes(regimes);
	line.active = true;
	changeStyle({});
});



regimeSquare.addEventListener("mousedown", event => {
	deactivateRegimes(regimes);
	square.active = true;
	changeStyle({});
});	

regimeSphere.addEventListener("mousedown", event => {
	deactivateRegimes(regimes);
	sphere.active = true;
	changeStyle({});
});	

//---------------

const fill = document.getElementById('bucket');

fill.addEventListener("mousedown", event => {
	deactivateRegimes(regimes);
	bucket.active = true;
	changeStyle({});
})

//-------------

function changeStyle({xBlock = xBlockPos, 
						yBlock = yBlockPos, 
						yStrip = yStripPos,
						colorID = false, 
						colorDisplay = 'none'}) {
	let style = document.getElementById('dynamic_style');

	if (!style) {
		style = document.createElement('style');
		style.setAttribute('id','dynamic_style');
		document.head.appendChild(style);
	}
	// filter: invert();
	document.getElementById('dynamic_style').innerHTML =  `
		#line {
			background-color: ${line.active ? ctx.strokeStyle : '#4f5959'};
		}

		#line_img {
			${line.active && getContrastYIQ(ctx.strokeStyle) ? 'filter: invert();' : ''};
		}

		#square {
			background-color: ${square.active ? ctx.strokeStyle : '#4f5959'};
		}

		#square_img {
			${square.active && getContrastYIQ(ctx.strokeStyle) ? 'filter: invert();' : ''};
		}

		#sphere {
			background-color: ${sphere.active ? ctx.strokeStyle : '#4f5959'};
		}

		#sphere_img {
			${sphere.active && getContrastYIQ(ctx.strokeStyle) ? 'filter: invert();' : ''};
		}

		#bucket {
			background-color: ${bucket.active ? ctx.strokeStyle : '#4f5959'};
		}

		#bucket_img {
			${bucket.active && getContrastYIQ(ctx.strokeStyle) ? 'filter: invert();' : ''}; 
		}

		.reg_buttons:hover {
			border-radius: 5px;
			border: solid 2px ${ctx.strokeStyle};
		}

		.clear_buttons:hover {
			border-radius: 5px;
			border: solid 2px ${ctx.strokeStyle};
		}

		.scroll {
			background-color: ${ctx.strokeStyle};
		}

		#block_scroll {
			background-color: ${blockColor}; 
			position: absolute;
			top: ${yBlock}px;
			left: ${xBlock}px;
		}

		#strip_scroll {
			background-color: ${stripColor}; 
			position: absolute;
			top: ${yStrip}px;
			left: -3px;
		}

		#picker_add_color {
			background-color: ${blockColor};
		}

		#picker_add_png {
			${getContrastYIQ(blockColor) ? 'filter: invert();' : ''};
		}

		#delete_${colorID} {
			display: ${colorDisplay};
		}

		${colorPickerStyle[0]}

		${colorPickerStyle[1]}

		${colorPickerStyle[2]}

	`
};

function getContrastYIQ(color){

	let r, g, b;
	if(color.substr(0,3) === 'rgb') {
		r = color.substr(5, 3);
		g = color.substr(10, 3);
		b = color.substr(15, 3);
	} else {
		color = color.replace("#", "");
		r = parseInt(color.substr(0,2),16);
		g = parseInt(color.substr(2,2),16);
		b = parseInt(color.substr(4,2),16);
	};

	let yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq <= 128) ? true : false;
};

//-----------------------------

const colorBlock = document.getElementById('color_block');
let ctx1 = colorBlock.getContext("2d");
let width1 = colorBlock.width;
let height1 = colorBlock.height;

const colorStrip = document.getElementById('color_strip');
let ctx2 = colorStrip.getContext("2d");
let width2 = colorStrip.width;
let height2 = colorStrip.height;

const pickerClose = document.getElementById('picker_close');

let rgbaColor = 'rgba(255, 0, 0, 1)';
//------

function changeBlockColor(rgbaColor) {

	ctx1.fillStyle = rgbaColor;
	ctx1.fillRect(0, 0, width1, height1);


	let grdWhite = ctx1.createLinearGradient(0, 0, width1, 0);
	grdWhite.addColorStop(0, 'rgba(255,255,255,1)');
	grdWhite.addColorStop(1, 'rgba(255,255,255,0)');
	ctx1.fillStyle = grdWhite;
	ctx1.fillRect(0, 0, width1, height1);

	let grdBlack = ctx1.createLinearGradient(0, 0, 0, height1);
	grdBlack.addColorStop(0, 'rgba(0,0,0,0)');
	grdBlack.addColorStop(1, 'rgba(0,0,0,1)');
	ctx1.fillStyle = grdBlack;
	ctx1.fillRect(0, 0, width1, height1);
};

changeBlockColor(rgbaColor);


//---------


ctx2.rect(0, 0, width2, height2);
let grd1 = ctx2.createLinearGradient(0, 0, 0, height1);
grd1.addColorStop(0, 'rgba(255, 0, 0, 1)');
grd1.addColorStop(0.17, 'rgba(255, 255, 0, 1)');
grd1.addColorStop(0.34, 'rgba(0, 255, 0, 1)');
grd1.addColorStop(0.51, 'rgba(0, 255, 255, 1)');
grd1.addColorStop(0.68, 'rgba(0, 0, 255, 1)');
grd1.addColorStop(0.85, 'rgba(255, 0, 255, 1)');
grd1.addColorStop(1, 'rgba(255, 0, 0, 1)');
ctx2.fillStyle = grd1;
ctx2.fill();

//---------

const colorPicker = document.getElementById('color_picker');


const blockScroll = document.getElementById('block_scroll');
const stripScroll = document.getElementById('strip_scroll');

const addColorPicker = document.getElementById('picker_add_color');

let tugStrip = false, tugBlock = false;
let yStripLastPos, xBlockLastPos, yBlockLastPos; 
let rectBlock, rectStrip;
let xBlockPos = -7.5, yBlockPos = -7.5, yStripPos = -7.5;
const minPos = -8.5, maxPos = 142.5;
let blockColor = determineColor({ctx: ctx1, canvas: colorBlock, x: xBlockPos,y: yBlockPos});;
let stripColor = determineColor({ctx: ctx2, canvas: colorStrip, y: yStripPos});


blockScroll.addEventListener("mousedown", event => {
	tugBlock = true;
	rectBlock = colorBlock.getBoundingClientRect();
	xBlockLastPos = event.clientX - rectBlock.left;
	yBlockLastPos = event.clientY - rectBlock.top;
});

stripScroll.addEventListener("mousedown", event => {
	tugStrip = true;
	rectStrip = colorStrip.getBoundingClientRect();
	yStripLastPos = event.clientY - rectStrip.top;
});

colorPicker.addEventListener("mousemove", event => {
	let xBlockOffset, yBlockOffset, yStripOffset;
	

	rectBlock = colorBlock.getBoundingClientRect();
	rectStrip = colorBlock.getBoundingClientRect();
	if(tugBlock) {
		xBlockOffset = (event.clientX - rectBlock.left) - xBlockLastPos;
		yBlockOffset = (event.clientY - rectBlock.top) - yBlockLastPos;
		xBlockLastPos= event.clientX - rectBlock.left;
		yBlockLastPos = event.clientY - rectBlock.top;

		if(xBlockPos + xBlockOffset > minPos && xBlockPos + xBlockOffset < maxPos &&
			yBlockPos + yBlockOffset > minPos && yBlockPos + yBlockOffset < maxPos) {

			xBlockPos += xBlockOffset;
			yBlockPos += yBlockOffset;

			
			blockColor = determineColor({ctx: ctx1, 
							canvas: colorBlock, 
							x: xBlockPos,
							y: yBlockPos});
			changeStyle({xBlock: xBlockPos, 
						yBlock: yBlockPos,
						yStrip: yStripPos});
		}
	};

	if(tugStrip) {
		yStripOffset = (event.clientY - rectStrip.top) - yStripLastPos;
		yStripLastPos = event.clientY - rectStrip.top;

		if(yStripPos + yStripOffset > minPos && yStripPos + yStripOffset < maxPos) {

			yStripPos += yStripOffset;

			
			rgbaColor = determineColor({ctx: ctx2, 
										canvas: colorStrip, 
										y: yStripPos});
			stripColor = rgbaColor;
			blockColor = determineColor({ctx: ctx1, 
							canvas: colorBlock, 
							x: xBlockPos,
							y: yBlockPos});
			
			changeStyle({xBlock: xBlockPos, 
						yBlock: yBlockPos,
						yStrip: yStripPos});

			changeBlockColor(rgbaColor);
		}
	};
});

function determineColor({ctx, canvas, x = minPos + 1, y}) {
	let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
	x = x - minPos - 1;
	y = y - minPos - 1;
	let pixelPos = (x + y * canvas.width) * 4;

	let arr = []

	arr.push(`${img.data[pixelPos]}`);
	arr.push(`${img.data[pixelPos + 1]}`);
	arr.push(`${img.data[pixelPos + 2]}`);
	arr.push(`${img.data[pixelPos + 3]}`);


	for (let i = 0; i < arr.length; i++) {
		if(arr[i].length == 1) arr[i] = '00'+arr[i];
		if(arr[i].length == 2) arr[i] = '0'+arr[i];
	};

	let r = arr[0];
	let g = arr[1];
	let b = arr[2];
	let a = arr[3];

	return `rgba(${r}, ${g}, ${b}, ${a})`
};



changeStyle({});

addColorPicker.addEventListener("mousedown", event => {
	addColor(blockColor);
});

pickerClose.addEventListener("mousedown", event => {
	colorPickerStyle = [

		`.color_picker {
			max-height: 0px;
			margin-bottom: 0px;
			padding: 0;
			pointer-events: none;

			transition: max-height 2s ease, 
			margin-bottom 3s ease, 
			padding 2s ease;

			transition-delay: 0.2s;

			
		}`,

		`.color_picker_elwraper {
			opacity: 0;

			transition: opacity 0.5s ease;
		}`,

		`.grid_add_color_activator {
			pointer-events: all;
		}`
	];
	changeStyle({});
});