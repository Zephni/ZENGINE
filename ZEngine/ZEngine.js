/*
	ZEngine
*/

// ZEngine Object
ZEngine = function(){}

// Properties
ZEngine.Config = {
	Width: 580,
	Height: 300,
	FPS: 60,
	Path: "ZEngine",
	Canvas: null,
	Parent: null
};

ZEngine.Prefabs = [];
ZEngine.Objects = [];

ZEngine.Canvas = null;

// Methods
ZEngine.Initialise = function(Config = null, Init = null)
{
	var DomReadyInterval = setInterval(function(){
		if(document.readyState === "complete" || document.readyState === "loaded"){
			clearInterval(DomReadyInterval);

			for(var I in Config)
				ZEngine.Config[I] = Config[I];

			// Build canvas
			if(ZEngine.Config.Canvas == null) ZEngine.Canvas = document.createElement("canvas");
			else ZEngine.Canvas = document.querySelector(ZEngine.Config.Canvas);
			
			ZEngine.Canvas2D = ZEngine.Canvas.getContext("2d");
			ZEngine.Canvas.width = ZEngine.Config.Width;
			ZEngine.Canvas.height = ZEngine.Config.Height;
			ZEngine.Canvas.style["border"] = "1px solid #AAAAAA";

			if(ZEngine.Config.Parent != null)
				document.querySelector(ZEngine.Config.Parent).appendChild(ZEngine.Canvas);

			// Global vars
			ZEngine.Ready = false;
			ZEngine.Paused = false;

			// Run
			setInterval(function(){
				if(ZEngine.Ready && !ZEngine.Paused){
					ZEngine.Canvas2D.fillStyle = "#EEEEEE";
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

			// Loading splash
			var LoadingSplash = document.createElement("img");
			LoadingSplash.src = ZEngine.Config.Path+"/ZEngineLoading.png";
			var LSwidth, LSheight = null;
			LoadingSplash.onload = function(){
				if(LoadingSplash != null){
					LSwidth = ZEngine.Canvas.width/2;
					LSheight = (LoadingSplash.height * LSwidth / LoadingSplash.width);
				}
			}
			// /Loading splash

			var LoadingInterval = setInterval(function(){
				var NumReady = 0;
				var CheckObjects = [].concat(ZEngine.Objects, ZEngine.Prefabs);

				for(var I in CheckObjects)
					if(CheckObjects[I].HasComponent("Sprite") && CheckObjects[I].GetComponent("Sprite").Ready)
						NumReady++;

				if(NumReady >= CheckObjects.length)
				{
					ZEngine.Ready = true;
					LoadingSplash = null;
					clearInterval(LoadingInterval);
				}

				//console.log(NumReady + "/" + CheckObjects.length);

				// Loading update
				ZEngine.Canvas2D.fillStyle = "#FFFFFF";
				ZEngine.Canvas2D.fillRect(0, 0, ZEngine.Canvas.offsetWidth, ZEngine.Canvas.offsetHeight);
				if(LSwidth !== null && LoadingSplash != null){
					ZEngine.Canvas2D.drawImage(LoadingSplash, 0, 0, LoadingSplash.width, LoadingSplash.height, ZEngine.Canvas.width/2 - LSwidth/2, ZEngine.Canvas.height/2 - LSheight/2 - 20, LSwidth, LSheight);
					var PercentLoaded = parseInt(NumReady / CheckObjects.length * 100);
					ZEngine.Canvas2D.font = "20px Arial"; ZEngine.Canvas2D.fillStyle = "#222222"; ZEngine.Canvas2D.textAlign = "center";
					ZEngine.Canvas2D.fillText("loading assets: "+PercentLoaded +"%",  ZEngine.Canvas.width/2,  ZEngine.Canvas.height/2 + LSheight/4);
				}
				// /Loading update

			}, 1);

			if(Init != null)
				Init();
		};
	}, 0); 
}

/*
	ZEngineObject
*/
ZEngineObject = function(Init = null)
{
	if(Init != false) this.init1 = Init;
	this.components = {};

	// User properties
	this.Prefab = false;
	this.Data = {};

	// Standard components
	this.components["Transform"] = new ZEngineComponents["Transform"]();
	this.Transform = this.components["Transform"];
	
	// Custom methods
	this.Update = null;

	// Initiation function (Ready by default, components will set to non ready if needed)
	this.Ready = true;
	if(this.init1 != null) this.init1();

	if(Init != false){
		if(this.Prefab) ZEngine.Prefabs.push(this);
		else ZEngine.Objects.push(this);
	}
	
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

ZEngineObject.prototype.Create = function(Init = null)
{
	var NewObject = new ZEngineObject(this.init1);

	if(Init != null){
		var I = 1; while(NewObject["init"+I] !== undefined){
			if(NewObject["init"+(I+1)] === undefined){
				NewObject["init"+(I+1)] = Init;
				NewObject["init"+(I+1)]();
				break;
			}
		I++;}
	}

	ZEngine.Objects.push(NewObject);
	return NewObject;
}

/*
	ZEngineComponents
*/
ZEngineComponents = function(){}

// Transform
ZEngineComponents.Transform = function Transform(Obj){
	this.Position = [ZEngine.Canvas.width/2, ZEngine.Canvas.height/2];
	this.Offset = [0.5, 0.5];
	this.Size = [0, 0];
}

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
		if(this.Animation != null){
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
				Transform.Position[0] - (Transform.Size[0] * Transform.Offset[0]),
				Transform.Position[1] - (Transform.Size[1] * Transform.Offset[1]),
				Transform.Size[0],
				Transform.Size[1]
			);
		}
	}
}