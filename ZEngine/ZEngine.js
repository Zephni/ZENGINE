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
			ZEngine.Canvas.tabIndex = 1;
			ZEngine.Canvas.width = ZEngine.Config.Width;
			ZEngine.Canvas.height = ZEngine.Config.Height;
			ZEngine.Canvas.style["border"] = "1px solid #AAAAAA";

			if(ZEngine.Config.Parent != null) document.querySelector(ZEngine.Config.Parent).appendChild(ZEngine.Canvas);

			// Global vars
			ZEngine.Ready = false;
			ZEngine.Paused = false;
			ZEngine.Scroll = [ZEngine.Canvas.width/2, ZEngine.Canvas.height/2];
			ZEngine.ScrollBuffer = [-1, -1];

			// Listeners
			document.addEventListener("keydown", function(e){
				ZEngine.Input.LastKeyDown = e.keyCode;
				if(ZEngine.Input.KeysDown !== undefined && ZEngine.Input.KeysDown != false)
					ZEngine.Input.KeysDown[e.keyCode] = true;
			}, false);

			document.addEventListener("keyup", function(e){
				ZEngine.Input.KeysDown[e.keyCode] = false;
			}, false);

			// Run
			setInterval(function(){
				ZEngine.Canvas.focus();

				if(ZEngine.Ready && !ZEngine.Paused){
					// Clearing and Rendering translated canvas
					ZEngine.Canvas2D.fillStyle = "#EEEEEE";
					ZEngine.Canvas2D.fillRect((ZEngine.Scroll[0] - ZEngine.Canvas.width/2), (ZEngine.Scroll[1] - ZEngine.Canvas.height/2), ZEngine.Canvas.offsetWidth, ZEngine.Canvas.offsetHeight);
					if(ZEngine.Scroll[0] - ZEngine.Canvas.width/2 != ZEngine.ScrollBuffer[0]) ZEngine.Canvas2D.translate(ZEngine.ScrollBuffer[0] - ZEngine.Scroll[0] + ZEngine.Canvas.width/2, 0);
					if(ZEngine.Scroll[1] - ZEngine.Canvas.height/2 != ZEngine.ScrollBuffer[1]) ZEngine.Canvas2D.translate(0, ZEngine.ScrollBuffer[1] - ZEngine.Scroll[1] + ZEngine.Canvas.height/2);
					ZEngine.ScrollBuffer = [ZEngine.Scroll[0] - ZEngine.Canvas.width/2, ZEngine.Scroll[1] - ZEngine.Canvas.height/2];

					// Objects
					for(var I in ZEngine.Objects)
					{
						for(var C in ZEngine.Objects[I].components)
							if(ZEngine.Objects[I].components[C].Update !== undefined)
								ZEngine.Objects[I].components[C].Update();

						if(ZEngine.Objects[I].Update != null)
							ZEngine.Objects[I].Update();
					}

					if(ZEngine.Input.LastKeyDown != null)
						ZEngine.Input.LastKeyDown = null;
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
					else
						NumReady++;

				if(NumReady >= CheckObjects.length)
				{
					ZEngine.Ready = true;
					LoadingSplash = null;
					clearInterval(LoadingInterval);
				}

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

ZEngine.Input = function(){}
ZEngine.Input.KeysDown = {};
ZEngine.Input.LastKeyDown = null;
ZEngine.Input.KeyDown = function(code){
	return (ZEngine.Input.KeysDown[code] !== undefined && ZEngine.Input.KeysDown[code] !== false);
}

ZEngine.ObjectsWithComponent = function(Str, IgnoreObject){
	ObjList = [];
	for(var I in ZEngine.Objects)
		if(ZEngine.Objects[I] != IgnoreObject && ZEngine.Objects[I].HasComponent(Str))
			ObjList.push(ZEngine.Objects[I]);

	return ObjList;
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

Object.defineProperty(ZEngineComponents.Transform.prototype, "BoundingBox", {
	get: function(){return [
		this.Position[0] - (this.Size[0] * this.Offset[0]),
		this.Position[1] - (this.Size[1] * this.Offset[1]),
		this.Position[0] + (this.Size[0] * this.Offset[0]),
		this.Position[1] + (this.Size[1] * this.Offset[1])
	];}
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
				Transform.BoundingBox[0],
				Transform.BoundingBox[1],
				Transform.Size[0],
				Transform.Size[1]
			);
		}
	}
}

// Collider
ZEngineComponents.Collider = function(Obj, Data){
	this.Obj = Obj;

	this.Config = {
		Offset: [0, 0, 0, 0],
		ShowOutline: false,
		OutlineColor: "#FF0000"
	};
	for(var I in Data) this.Config[I] = Data[I];

	var Transform = this.Obj.GetComponent("Transform");
	
	this.CollidingWith = function(Other, CheckAhead = [0, 0]){
		var ThisRect = [
			this.Rect[0] + 1 + CheckAhead[0],
			this.Rect[1] + 1 + CheckAhead[1],
			this.Rect[2] + 1 + CheckAhead[0],
			this.Rect[3] + 1 + CheckAhead[1]
		];
		var OtherRect = Other.GetComponent("Collider").Rect;
		return ThisRect[0] < OtherRect[2] && ThisRect[2] > OtherRect[0] && ThisRect[1] < OtherRect[3] && ThisRect[3] > OtherRect[1];
	}

	this.Update = function(){
		if(this.Config.ShowOutline){
			ZEngine.Canvas2D.beginPath();
			ZEngine.Canvas2D.rect(this.Rect[0], this.Rect[1], this.Rect[2] - this.Rect[0], this.Rect[3] - this.Rect[1]);
			ZEngine.Canvas2D.strokeStyle = this.Config.OutlineColor;
			ZEngine.Canvas2D.lineWidth = 1;
			ZEngine.Canvas2D.stroke();
		}
	}
}

Object.defineProperty(ZEngineComponents.Collider.prototype, "Rect", {
	get: function(){
		return [
			this.Obj.Transform.BoundingBox[0] + (this.Obj.Transform.Size[0] * this.Config.Offset[0]),
			this.Obj.Transform.BoundingBox[1] + (this.Obj.Transform.Size[1] * this.Config.Offset[1]),
			this.Obj.Transform.BoundingBox[2] - (this.Obj.Transform.Size[0] * this.Config.Offset[2]),
			this.Obj.Transform.BoundingBox[3] - (this.Obj.Transform.Size[1] * this.Config.Offset[3])
		];
	}
});

// Physics
ZEngineComponents.Physics = function(Obj, Data){
	// Setup
	this.Obj = Obj;

	this.Config = {
		Kinetic: false,
		Gravity: 0.3,
		MaxX: 3,
		MaxY: 7
	}; for(var I in Data) this.Config[I] = Data[I];

	var Transform = this.Obj.GetComponent("Transform");
	var Collider = this.Obj.AddComponent("Collider", {ShowOutline: true});

	// Properties
	this.MoveX = 0;
	this.MoveY = 0;
	this.IsGrounded = false;

	// Update
	this.Update = () => {
		if(!this.Config.Kinetic){
			// Apply gravity if not grounded
			if(!this.IsGrounded) this.MoveY += this.Config.Gravity;

			// Clamp MoveX/Y values to MaxX/Y
			this.MoveX = Math.min(Math.max(this.MoveX, -this.Config.MaxX), this.Config.MaxX);
			this.MoveY = Math.min(Math.max(this.MoveY, -this.Config.MaxY), this.Config.MaxY);

			// Get collider objects
			var ColliderObjects = ZEngine.ObjectsWithComponent("Collider", this.Obj);

			// X move
			for(var X = 0; X < Math.abs(this.MoveX); X++){
				for(var I in ColliderObjects) if(Collider.CollidingWith(ColliderObjects[I], [(this.MoveX > 0) ? 1 : -1, 0])) this.MoveX = 0;
				if(this.MoveX != 0) Transform.Position[0] += (this.MoveX > 0) ? 1 : -1;
			}

			// Y move
			for(var Y = 0; Y < Math.abs(this.MoveY); Y++){ 
				for(var I in ColliderObjects) if(Collider.CollidingWith(ColliderObjects[I], [0, (this.MoveY > 0) ? 1 : -1])) this.MoveY = 0;
				if(this.MoveY != 0) Transform.Position[1] += (this.MoveY > 0) ? 1 : -1;
			}

			// Check if grounded
			this.IsGrounded = false;
			for(var I in ColliderObjects) if(Collider.CollidingWith(ColliderObjects[I], [0, 1])) this.IsGrounded = true;
		}
	}
}

// Physics
ZEngineComponents.CharacterController = function(Obj, Data){
	// Setup
	this.Obj = Obj;

	this.Config = {
		Acceleration: 0.2,
		Deceleration: 0.2,
		JumpStrength: 50
	}; for(var I in Data) this.Config[I] = Data[I];

	var Physics = this.Obj.AddComponent("Physics");

	// Update
	this.Update = () => {
		//console.log(Physics.IsGrounded);
		if(ZEngine.Input.LastKeyDown == 90 && Physics.IsGrounded)
			Physics.MoveY = -this.Config.JumpStrength;

		if(ZEngine.Input.KeyDown(37)) Physics.MoveX -= this.Config.Acceleration;
		else if(Physics.MoveX < 0){
			Physics.MoveX += this.Config.Deceleration;
			if(Physics.MoveX >= -this.Config.Deceleration) Physics.MoveX = 0;
		}

		if(ZEngine.Input.KeyDown(39)) Physics.MoveX += this.Config.Acceleration;
		else if(Physics.MoveX > 0){
			Physics.MoveX -= this.Config.Deceleration;
			if(Physics.MoveX <= this.Config.Deceleration) Physics.MoveX = 0;
		}
	}
}