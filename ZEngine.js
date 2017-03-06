/*
	ZEngine
*/

// ZEngine Object
ZEngine = function(){}

// Properties
ZEngine.Config = {
	Width: 500,
	Height: 500,
	FPS: 60,
	Path: "ZEngine"
};

ZEngine.Objects = [];

ZEngine.Canvas = null;

// Methods
ZEngine.Initialise = function(Config = null)
{
	for(var I in Config)
		ZEngine.Config[I] = Config[I];

	// Build canvas
	ZEngine.Canvas = document.createElement("canvas");
	ZEngine.Canvas2D = ZEngine.Canvas.getContext("2d");
	ZEngine.Canvas.width = ZEngine.Config.Width;
	ZEngine.Canvas.height = ZEngine.Config.Height;
	ZEngine.Canvas.style["border"] = "1px solid black";
	document.querySelector("body").appendChild(ZEngine.Canvas);

	// Global vars
	ZEngine.Paused = false;

	// Run
	setInterval(function(){
		if(ZEngine.Ready){
			ZEngine.Canvas2D.fillStyle = "#FFFFFF";
			ZEngine.Canvas2D.fillRect(0, 0, ZEngine.Canvas.offsetWidth, ZEngine.Canvas.offsetHeight);

			for(var I in ZEngine.Objects)
			{
				for(var C in ZEngine.Objects[I].components)
					if(ZEngine.Objects[I].components[C].Update !== undefined)
						ZEngine.Objects[I].components[C].Update();

				if(ZEngine.Objects[I].Update != null)
					ZEngine.Objects[I].Update();
			}
		}
	}, 1000 / ZEngine.Config.FPS);

	var LoadingSplash = document.createElement("img");
	LoadingSplash.src = ZEngine.Config.Path+"/ZEngineLoading.png";
	LoadingSplash.onload = function(){
		var width = ZEngine.Canvas.width/2;
		var ratio = width / LoadingSplash.width;
		var height = LoadingSplash.height * ratio;
		ZEngine.Canvas2D.drawImage(LoadingSplash, 0, 0, LoadingSplash.width, LoadingSplash.height, ZEngine.Canvas.width/2 - width/2, ZEngine.Canvas.height/2 - height/2, width, height);
	}

	var LoadingInterval = setInterval(function(){
		// Loading update
		// -> TODO
		// Loading update

		for(var I in ZEngine.Objects)
		{
			if(ZEngine.Objects[I].HasComponent("Sprite") && ZEngine.Objects[I].GetComponent("Sprite").Ready)
			{
				ZEngine.Ready = true;
				clearInterval(LoadingInterval);
			}
		}

	}, 1);
}

/*
	ZEngineObject
*/
ZEngineObject = function(Init = null)
{
	this.init = Init;
	this.components = {};

	// Standard components
	this.components["Transform"] = new ZEngineComponents["Transform"]();
	this.Transform = this.components["Transform"];
	
	// Custom methods
	this.Update = null;

	// Initiation function
	if(this.init != null) this.init();
	ZEngine.Objects.push(this);
	return this;
}

ZEngineObject.prototype.AddComponent = function(Alias, Data = {})
{
	this.components[Alias] = new ZEngineComponents[Alias](this, Data);
	return this.components[Alias];
}

ZEngineObject.prototype.HasComponent = function(Alias)
{
	return (this.components[Alias]) ? true : false;
}

ZEngineObject.prototype.GetComponent = function(Alias)
{
	return this.components[Alias];
}

/*
	ZEngineComponents
*/
ZEngineComponents = function(){}

// Transform
ZEngineComponents.Transform = function Transform(Obj){
	this.position = [0, 0]; // Use .Position (get/set) for position with offset
	this.Offset = [0, 0];
	this.Size = [0, 0];
}

Object.defineProperty(ZEngineComponents.Transform.prototype, "Position", {
	get: function() {return [this.position[0] + (this.Size[0] * this.Offset[0]), this.position[1] + (this.Size[1] * this.Offset[1])]},
	set: function(value) {this.position = value;}
});

// Sprite
ZEngineComponents.Sprite = function(Obj, Data){
	// Setup
	this.Ready = false;
	
	this.Img = document.createElement("img");
	this.Img.src = Data.Src;
	this.Img.onload = () => {
		this.Ready = true;
		var Transform = Obj.GetComponent("Transform");
		if(Transform.Size[0] == 0) Transform.Size[0] = (Data.RectWidth) ? Data.RectWidth : this.Img.width;
		if(Transform.Size[1] == 0) Transform.Size[1] = (Data.RectHeight) ? Data.RectHeight : this.Img.height;
	}
	
	this.Rect = [(Data.RectX) ? Data.RectX : 0,(Data.RectY) ? Data.RectY : 0,(Data.RectWidth) ? Data.RectWidth : 0,(Data.RectHeight) ? Data.RectHeight : 0];

	// Animation
	this.Animation = null;
	this.Animate = (animation) => {
		this.Animation = {Frames: [], Speed: 10, CurrentFrame: 0, Iterator: 0};
		for(var I in animation) this.Animation[I] = animation[I];
	}

	// Update
	this.Update = () => {
		if(this.Animation != null)
		{
			this.Animation.Iterator++
			if(this.Animation.Iterator >= ZEngine.Config.FPS / this.Animation.Speed) {this.Animation.CurrentFrame++; this.Animation.Iterator = 0;}
			if(this.Animation.CurrentFrame >= this.Animation.Frames.length) {this.Animation.CurrentFrame = 0;}
			this.Rect = [this.Animation.Frames[this.Animation.CurrentFrame][0] * this.Rect[2], this.Animation.Frames[this.Animation.CurrentFrame][1] * this.Rect[3], this.Rect[2], this.Rect[3]];
		}

		var Transform = Obj.GetComponent("Transform");
		if(this.Ready && Transform != null)
		{
			ZEngine.Canvas2D.drawImage(
				this.Img,
				this.Rect[0],
				this.Rect[1],
				(this.Rect[2] > 0) ? this.Rect[2] : this.Img.width,
				(this.Rect[3] > 0) ? this.Rect[3] : this.Img.height,
				Transform.Position[0],
				Transform.Position[1],
				Transform.Size[0],
				Transform.Size[1]
			);
		}
	}
}

// Debug
ZEngineComponents.Debug = function(Obj){
	this.Update = function()
	{
		var Transform = Obj.GetComponent("Transform");
		ZEngine.Canvas2D.beginPath();
		ZEngine.Canvas2D.rect(Transform.Position[0], Transform.Position[1], Transform.Size[0], Transform.Size[1]);
		ZEngine.Canvas2D.stroke();
		ZEngine.Canvas2D.closePath();
	}

	return this;
}