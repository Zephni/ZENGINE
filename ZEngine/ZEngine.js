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
	Parent: null,
	LoadScripts: [],
	Background: "#FFFFFF"
};

ZEngine.Canvas = null;
ZEngine.Global = {};
ZEngine.Prefabs = [];
ZEngine.Objects = [];
ZEngine.ScriptsLoaded = [];
ZEngine.UpdateLayers = false;
ZEngine.LayeredObjects = [];
ZEngine.Time = {
	Date: new Date(),
	DeltaTime: 0,
	ActualFPS: 0
}

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
			//ZEngine.Canvas.style.cssText = "border: 1px solid #AAAAAA;";

			if(ZEngine.Config.Parent != null) document.querySelector(ZEngine.Config.Parent).appendChild(ZEngine.Canvas);

			// Global vars
			ZEngine.Ready = false;
			ZEngine.Paused = false;
			ZEngine.Scroll = [ZEngine.Canvas.width/2, ZEngine.Canvas.height/2];
			ZEngine.ScrollBuffer = [-1, -1];

			// Listeners
			ZEngine.Canvas.addEventListener("keydown", function(e){
				ZEngine.Input.LastKeyDown = e.keyCode;
				ZEngine.Input.KeysDown[e.keyCode] = true;
				//e.preventDefault();
				return false;
			}, false);

			ZEngine.Canvas.addEventListener("keyup", function(e){
				ZEngine.Input.KeysDown[e.keyCode] = false;
				e.preventDefault();
				return false;
			}, false);

			ZEngine.Canvas.addEventListener("mousedown", function(e){
				var code = (e.keyCode || e.which);
				ZEngine.Input.LastClickDown = code;
				ZEngine.Input.LastClickLocation = [ZEngine.Scroll[0] + e.clientX, ZEngine.Scroll[1] + e.clientY];
				ZEngine.Input.ClicksDown[code] = true;
				//e.preventDefault();
				return false;
			}, false);

			ZEngine.Canvas.addEventListener("mouseup", function(e){
				var code = (e.keyCode || e.which);
				ZEngine.Input.ClicksDown[code] = false;
				//e.preventDefault();
				return false;
			}, false);

			ZEngine.Canvas.addEventListener("mousemove", function(e){
				ZEngine.Input.MousePosition = ZEngine.Input.GetMousePosition(e);
				return false;
			}, false);

			ZEngine.Canvas.addEventListener("contextmenu", function(e){
				//e.preventDefault();
				return false;
			}, false);

			var DeltaTimeBuffer = ZEngine.Time.Date.getTime();

			// Run
			setInterval(function(){
				ZEngine.Canvas.focus();
				
				if(ZEngine.Ready && !ZEngine.Paused){
					ZEngine.Canvas2D.save();
					// Set delta time / fps
					ZEngine.Time.Date = new Date();
					ZEngine.Time.DeltaTime = ZEngine.Time.Date.getTime() - DeltaTimeBuffer;
					DeltaTimeBuffer = ZEngine.Time.Date.getTime();
					ZEngine.Time.ActualFPS = parseInt(1000 / ZEngine.Time.DeltaTime);

					if(LoadingSplash != null) LoadingSplash = null;

					// Clearing and Rendering translated canvas
					ZEngine.Canvas2D.fillStyle = ZEngine.Config.Background;
					ZEngine.Canvas2D.fillRect((ZEngine.Scroll[0] - ZEngine.Canvas.width/2), (ZEngine.Scroll[1] - ZEngine.Canvas.height/2), ZEngine.Canvas.offsetWidth, ZEngine.Canvas.offsetHeight);
					if(ZEngine.Scroll[0] - ZEngine.Canvas.width/2 != ZEngine.ScrollBuffer[0]) ZEngine.Canvas2D.translate(ZEngine.ScrollBuffer[0] - ZEngine.Scroll[0] + ZEngine.Canvas.width/2, 0);
					if(ZEngine.Scroll[1] - ZEngine.Canvas.height/2 != ZEngine.ScrollBuffer[1]) ZEngine.Canvas2D.translate(0, ZEngine.ScrollBuffer[1] - ZEngine.Scroll[1] + ZEngine.Canvas.height/2);
					ZEngine.ScrollBuffer = [ZEngine.Scroll[0] - ZEngine.Canvas.width/2, ZEngine.Scroll[1] - ZEngine.Canvas.height/2];

					// Objects
					if(ZEngine.UpdateLayers){
						ZEngine.LayeredObjects = ZEngine.OrderByLayer(ZEngine.Objects);
						ZEngine.UpdateLayers = false;
					}

					for(var I in ZEngine.LayeredObjects){
						if(ZEngine.LayeredObjects[I] == undefined)
							continue;
						
						for(var C in ZEngine.LayeredObjects[I].components){
							if(ZEngine.LayeredObjects[I].components[C].Update !== undefined) ZEngine.LayeredObjects[I].components[C].Update();
							if(ZEngine.LayeredObjects[I].components[C].Draw !== undefined) ZEngine.LayeredObjects[I].components[C].Draw();
						}

						if(ZEngine.LayeredObjects[I].Update != null) ZEngine.LayeredObjects[I].Update();
						if(ZEngine.LayeredObjects[I] != undefined && ZEngine.LayeredObjects[I].Draw != null) ZEngine.LayeredObjects[I].Draw();
					}

					// Resets
					ZEngine.Input.LastKeyDown = null;
					ZEngine.Input.LastClickDown = null;
					ZEngine.Input.LastClickLocation = null;

					ZEngine.Canvas2D.restore();
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

			if(ZEngine.Config.LoadScripts.length > 0){
				ZEngine.LoadScripts(ZEngine.Config.LoadScripts);
			}

			var LoadingInterval = setInterval(function(){
				var NumReady = 0;
				var CheckObjects = [].concat(ZEngine.Objects, ZEngine.Prefabs);

				for(var I in CheckObjects){
					if(!CheckObjects[I].HasComponent("Sprite")) NumReady++;
					else if(CheckObjects[I].HasComponent("Sprite") && CheckObjects[I].GetComponent("Sprite").Ready) NumReady++;
				}

				if(NumReady >= CheckObjects.length && ZEngine.ScriptsLoaded.length >= ZEngine.Config.LoadScripts.length){
					ZEngine.Ready = true;
					if(Init != null) Init();
					if(ZEngine.Debug != undefined) ZEngine.Debug();
					clearInterval(LoadingInterval);
				}
				
				// Loading update
				ZEngine.Canvas2D.fillStyle = "#FFFFFF";
				ZEngine.Canvas2D.fillRect(0, 0, ZEngine.Canvas.width, ZEngine.Canvas.height);
				if(LSwidth !== null && LoadingSplash != null){
					ZEngine.Canvas2D.drawImage(LoadingSplash, 0, 0, LoadingSplash.width, LoadingSplash.height, ZEngine.Canvas.width/2 - LSwidth/2, ZEngine.Canvas.height/2 - LSheight/2 - 20, LSwidth, LSheight);
					var PercentLoaded = parseInt((NumReady + ZEngine.ScriptsLoaded.length) / (CheckObjects.length + ZEngine.Config.LoadScripts.length) * 100);
					ZEngine.Canvas2D.font = "20px Arial"; ZEngine.Canvas2D.fillStyle = "#222222"; ZEngine.Canvas2D.textAlign = "center";
					ZEngine.Canvas2D.fillText("loading assets: "+PercentLoaded +"%",  ZEngine.Canvas.width/2,  ZEngine.Canvas.height/2 + LSheight/4);
				}
				// /Loading update
				
			}, 1);
		};
	}, 0); 
}

ZEngine.GetCanvasCenter = function(Axis = null){
	return (Axis == 0) ? ZEngine.Canvas.width/2 + ZEngine.Scroll[0] : (Axis == 1) ? ZEngine.Canvas.height/2 + ZEngine.Scroll[1] : [ZEngine.Canvas.width/2 + ZEngine.Scroll[0], ZEngine.Canvas.height/2 + ZEngine.Scroll[1]];
}

ZEngine.Input = function(){}
ZEngine.Input.KeysDown = {};
ZEngine.Input.LastKeyDown = null;
ZEngine.Input.KeyDown = function(code){
	return (ZEngine.Input.KeysDown[code] !== undefined && ZEngine.Input.KeysDown[code] !== false);
}

ZEngine.Input.MousePosition = [0, 0];
ZEngine.Input.ClicksDown = {};
ZEngine.Input.LastClickDown = null;
ZEngine.Input.ClickDownLocation = null;
ZEngine.Input.ClickUpLocation = null;
ZEngine.Input.MouseUpLocation = null;
ZEngine.Input.ClickDown = function(code){
	return (ZEngine.Input.ClicksDown[code] !== undefined && ZEngine.Input.ClicksDown[code] !== false);
}

ZEngine.Input.CursorType = function(type)
{
	document.body.style.cursor = type;
}

ZEngine.Input.MouseOver = function(Other)
{
	return ZEngine.RectOverlapping([ZEngine.Input.MousePosition[0]-1, ZEngine.Input.MousePosition[1]-1, ZEngine.Input.MousePosition[0]+1, ZEngine.Input.MousePosition[1]+1], Other);
}

ZEngine.Input.GetMousePosition = function(evt){
    var rect = ZEngine.Canvas.getBoundingClientRect();
    return [
      evt.clientX - rect.left,
      evt.clientY - rect.top
	]
}

ZEngine.ObjectsWithComponent = function(Str, IgnoreObject){
	ObjList = [];
	for(var I in ZEngine.Objects)
		if(ZEngine.Objects[I] != IgnoreObject && ZEngine.Objects[I].HasComponent(Str))
			ObjList.push(ZEngine.Objects[I]);

	return ObjList;
}

ZEngine.ObjectsOfType = function(Str, IgnoreObject){
	ObjList = [];
	for(var I in ZEngine.Objects)
		if(ZEngine.Objects[I] != IgnoreObject && ZEngine.Objects[I].Types.indexOf(Str) > -1)
			ObjList.push(ZEngine.Objects[I]);

	return ObjList;
}

ZEngine.GetObject = function(Str){
	for(var I in ZEngine.Objects)
		if(ZEngine.Objects[I].Alias == Str)
			return ZEngine.Objects[I];

	return null;
}

ZEngine.OrderByLayer = function(Objects){
	var SortedObjects = Objects;
	SortedObjects.sort(function(a,b) {return (a.Transform.Layer > b.Transform.Layer) ? 1 : ((b.Transform.Layer > a.Transform.Layer) ? -1 : 0);});
	return SortedObjects;
}

// Special
ZEngine.Sin = function(Amount, Variance, Progress)
{
	if(Progress > Math.PI)
		Progress = Progress - Math.PI;
	return Amount + (Variance * Math.sin(Progress));
}

ZEngine.Wait = function(WaitTime, Callback){
	setTimeout(Callback, WaitTime);
}

ZEngine.WaitDo = function(WaitTime, Do = null, Callback = null){
	var T = 0;
	ZEngine.WhileDo(() => {return T < WaitTime;}, () => {
		T++;
		if(Do != null) Do(T);
	}, () => {
		if(Callback !== null) Callback();
	});
}

ZEngine.Every = function(WaitTime, Callback){
	var I = 0;
	var Interval = setInterval(() => {
		I++;
		var Clear = Callback(I);
		if(Clear) clearInterval(Interval);
	}, WaitTime);
}

ZEngine.WhileDo = function(While, Do, Callback = null){
	var Interval = setInterval(function(){
		if(While()) if(Do != null) Do();
		else{
			clearInterval(Interval);
			if(Callback !== null) Callback();
		}
	}, 0);
}

ZEngine.LoadScript = function(File, Callback){
	var ScriptElement = document.createElement("script");
	ScriptElement.src = File;
	ScriptElement.type = "text/javascript";
	ScriptElement.onload = Callback;
	document.querySelector("head").appendChild(ScriptElement);
}

ZEngine.LoadScripts = function(Files, Callback = null){
	ZEngine.ScriptsLoaded = [];
	
	for(var I in Files){
		ZEngine.LoadScript(Files[I], function(){
			ZEngine.ScriptsLoaded.push(Files[I]);
		});
	}

	var ScriptsLoadedInterval = setInterval(function(){
		if(ZEngine.ScriptsLoaded.length >= Files.length){
			clearInterval(ScriptsLoadedInterval);
			if(Callback != null) Callback();
		}
	}, 0);
}

ZEngine.DrawRect = function(area, color = "red"){
	ZEngine.Canvas2D.beginPath();
	ZEngine.Canvas2D.rect(area[0], area[1], area[2] - area[0], area[3] - area[1]);
	ZEngine.Canvas2D.strokeStyle = color;
	ZEngine.Canvas2D.lineWidth = 1;
	ZEngine.Canvas2D.stroke();
}

ZEngine.RectOverlapping = function(Rect, OtherRect){
	return (Rect[0] < OtherRect[2] && Rect[2] > OtherRect[0] && Rect[1] < OtherRect[3] && Rect[3] > OtherRect[1]);
}
// /Special

/*
	ZEngineObject
*/
ZEngineObject = function(Init = null)
{
	if(Init != false) this.init1 = Init;
	this.components = {};

	// User properties
	this.Prefab = false;
	this.Types = [];
	this.Data = {};

	// Standard components
	this.components["Transform"] = new ZEngineComponents["Transform"]();
	this.Transform = this.components["Transform"];
	
	// Custom methods
	this.Update = null;
	this.Draw = null;

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

ZEngineObject.prototype.HasType = function(Str){
	return (this.Types.indexOf(Str) > -1);
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

ZEngineObject.prototype.Destroy = function(){
	ZEngine.Objects.splice(ZEngine.Objects.indexOf(this), 1);
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
	this.Rotation = 0;
	this.layer = 0;
	this.Layer = 0;

	this.aspectSizeBuffer = null;
	this.AspectSize = function(index, value){
		var fromto = [];
		if(index == 0) fromto = [0, 1];
		if(index == 1) fromto = [1, 0];

		if(this.Size[0] > 0 && this.Size[1] > 0){
			var other = (this.Size[fromto[1]] * value / this.Size[fromto[0]]);
			this.Size[fromto[0]] = value;
			this.Size[fromto[1]] = other;
		}else{
			this.aspectSizeBuffer = [index, value];
		}
	}

	return this;
}

Object.defineProperty(ZEngineComponents.Transform.prototype, "Layer", {
	get: function(){return this.layer;},
	set: function(value){
		this.layer = value;
		ZEngine.UpdateLayers = true;
	}
});

Object.defineProperty(ZEngineComponents.Transform.prototype, "BoundingBox", {
	get: function(){return [
		this.Position[0] - (this.Size[0] * this.Offset[0]),
		this.Position[1] - (this.Size[1] * this.Offset[1]),
		this.Position[0] + (this.Size[0] * this.Offset[0]),
		this.Position[1] + (this.Size[1] * this.Offset[1])
	];}
});

// Text
ZEngineComponents.Text = function(Obj, Data){
	this.Obj = Obj;

	this.Config = {
		Font: "sans-serif",
		Color: "#111111",
		FontSize: "18px",
		TextAlign: "center"
	}; for(var I in Data) this.Config[I] = Data[I];

	this.Content = "";
	var Transform = this.Obj.GetComponent("Transform");

	this.Draw = () => {
		ZEngine.Canvas2D.font = this.Config.FontSize + " " + this.Config.Font;
		ZEngine.Canvas2D.fillStyle = this.Config.Color;
		ZEngine.Canvas2D.textAlign = this.Config.TextAlign;
		ZEngine.Canvas2D.fillText(this.Content, Transform.Position[0], Transform.Position[1]);
	}

	return this;
}

// Sprite
ZEngineComponents.Sprite = function(Obj, Data){
	// Setup
	this.Ready = false;
	
	this.Opacity = 1;

	this.Img = document.createElement("img");
	this.Img.src = Data.Src;
	this.Img.onload = () => {
		var Transform = Obj.GetComponent("Transform");
		if(Transform.Size[0] == 0) Transform.Size[0] = (Data.RectWidth) ? Data.RectWidth : this.Img.width;
		if(Transform.Size[1] == 0) Transform.Size[1] = (Data.RectHeight) ? Data.RectHeight : this.Img.height;

		if(Transform.aspectSizeBuffer != null) Transform.AspectSize(Transform.aspectSizeBuffer[0], Transform.aspectSizeBuffer[1]);

		this.Ready = true;
		if(Data.OnLoad != undefined) Data.OnLoad();
	}
	
	this.Rect = [(Data.RectX) ? Data.RectX : 0,(Data.RectY) ? Data.RectY : 0,(Data.RectWidth) ? Data.RectWidth : 0,(Data.RectHeight) ? Data.RectHeight : 0];

	// Animation
	this.Animation = null;
	this.Animate = (animation) => {
		if(this.Animation == null || (this.Animation.Frames != animation.Frames && this.Animation.Speed != animation.Speed))
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
	}

	this.Draw = () => {
		var Transform = Obj.GetComponent("Transform");
		if(this.Ready && Transform != null)
		{
			ZEngine.Canvas2D.save();
			ZEngine.Canvas2D.globalAlpha = this.Opacity;

			if(Transform.Rotation != 0)
			{
				ZEngine.Canvas2D.translate((Transform.BoundingBox[0] + (Transform.Size[0]/2)), (Transform.BoundingBox[1] + (Transform.Size[1]/2)));
				ZEngine.Canvas2D.rotate(Transform.Rotation * (Math.PI / 180));
				ZEngine.Canvas2D.translate(-(Transform.BoundingBox[0] + (Transform.Size[0]/2)), -(Transform.BoundingBox[1] + (Transform.Size[1]/2)));
			}

			
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
			
			ZEngine.Canvas2D.restore();
		}
	}

	return this;
}

// Collider
ZEngineComponents.Collider = function(Obj, Data){
	this.Obj = Obj;

	this.Config = {
		Offset: [0, 0, 0, 0],
		ShowOutline: false,
		OutlineColor: "#FF0000",
		ShowAreaOutline: false,
		AreaOutlineColor: "#00FF00"
	}; for(var I in Data) this.Config[I] = Data[I];

	var Transform = this.Obj.GetComponent("Transform");

	if(this.Obj.Types.length == 0)
		this.Obj.Types = ["Obstical"];

	this.CollidingWith = function(Other, CheckAhead = [0, 0]){
		var Others = [];
		if(Other.Prefab !== undefined) Others.push(Other);
		else Others = Other;

		for(var I in Others){
			if(this.AreaCollidingWith(
				this.Rect[0] + CheckAhead[0],
				this.Rect[1] + CheckAhead[1],
				this.Rect[2] + CheckAhead[0],
				this.Rect[3] + CheckAhead[1]
			, Others[I])) return true;
		}

		return false;
	}

	this.AreaCollidingWith = function(X, Y, X2, Y2, Other){
		if(this.Config.ShowAreaOutline) ZEngine.DrawRect(Rect, this.Config.AreaOutlineColor);
		return ZEngine.RectOverlapping([X, Y, X2, Y2], Other.GetComponent("Collider").Rect);
	}

	this.ObjectColliding = function(Other, Rect = null){
		if(Rect == null) Rect = this.Rect;
		if(this.AreaCollidingWith(Rect[0], Rect[1], Rect[2], Rect[3], Other)) return Other;
		else return false;
	}

	this.ObjectsColliding = function(Others, Callback = null, Rect = null){
		if(Rect == null) Rect = this.Rect;

		var ObjectsArr = [];
		for(var I in Others){
			if(this.ObjectColliding(Others[I])){
				ObjectsArr.push(Others[I]);
				if(Callback != null) Callback(Others[I]);
			}
		}

		return ObjectsArr;
	}

	this.Draw = () => {
		if(this.Config.ShowOutline) ZEngine.DrawRect(this.Rect, this.Config.OutlineColor);
	}

	return this;
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
		MaxY: 7,
		ObsticalType: "Obstical",
		ShowOutline: false
	}; for(var I in Data) this.Config[I] = Data[I];

	var Transform = this.Obj.GetComponent("Transform");
	var Collider = this.Obj.AddComponent("Collider", {ShowOutline: this.Config.ShowOutline});

	// Properties
	this.MoveX = 0;
	this.MoveY = 0;
	this.IsGrounded = false;

	// Update
	this.Update = () => {
		if(!this.Config.Kinetic){
			// Apply gravity if not grounded
			if(!this.IsGrounded) this.MoveY += this.Config.Gravity;
			//console.log(this.MoveY);

			// Clamp MoveX/Y values to MaxX/Y
			this.MoveX = Math.min(Math.max(this.MoveX, -this.Config.MaxX), this.Config.MaxX);
			this.MoveY = Math.min(Math.max(this.MoveY, -this.Config.MaxY), this.Config.MaxY);

			// Get collider objects
			var ColliderObjects = ZEngine.ObjectsOfType(this.Config.ObsticalType, this.Obj);

			// X move
			for(var X = 0; X < Math.abs(this.MoveX); X++){
				if(Collider.CollidingWith(ColliderObjects, [(this.MoveX > 0) ? 1 : -1, 0])) this.MoveX = 0;
				if(this.MoveX != 0) Transform.Position[0] += (this.MoveX > 0) ? 1 : -1;
			}

			// Y move
			for(var Y = 0; Y < Math.abs(this.MoveY); Y++){ 
				if(Collider.CollidingWith(ColliderObjects, [0, (this.MoveY > 0) ? 1 : -1])) this.MoveY = 0;
				if(this.MoveY != 0) Transform.Position[1] += (this.MoveY > 0) ? 1 : -1;
			}

			// Check if grounded, or too deep in ground
			this.IsGrounded = false;
			for(var I in ColliderObjects)
				if(Collider.CollidingWith(ColliderObjects[I], [0, 1])) this.IsGrounded = true;
		}
	}

	return this;
}

// PlatformerController
ZEngineComponents.PlatformerController = function(Obj, Data){
	// Setup
	this.Obj = Obj;

	this.Config = {
		Acceleration: 0.2,
		Deceleration: 0.2,
		JumpStrength: 50,
		ShowOutline: false
	}; for(var I in Data) this.Config[I] = Data[I];

	var Physics = this.Obj.AddComponent("Physics", {ShowOutline: this.Config.ShowOutline});

	// Update
	this.Update = () => {
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

	return this;
}

// TopDownRPGController
ZEngineComponents.TiledRPGController = function(Obj, Data){
	// Setup
	this.Obj = Obj;

	this.Config = {
		Speed: 1,
		ObsticalType: "Obstical",
		ShowOutline: false
	}; for(var I in Data) this.Config[I] = Data[I];

	var Transform = this.Obj.Transform;
	var Collider = this.Obj.AddComponent("Collider", {ShowOutline: this.Config.ShowOutline});

	this.OrigX = 0;
	this.OrigY = 0;
	this.MoveX = 0;
	this.MoveY = 0;
	this.StepComplete = false;
	this.Moving = false;

	// Update
	this.Update = () => {
		this.StepComplete = false;
		if(this.MoveX == 0 && this.MoveY == 0){
			if(this.OrigX != Transform.Position[0] || this.OrigY != Transform.Position[1]){
				this.StepComplete = true;
				this.Moving = false;
			}
			this.OrigX = Transform.Position[0];
			this.OrigY = Transform.Position[1];
		}

		if((this.MoveX == 0 && this.MoveY == 0) && ZEngine.Input.KeyDown(39) && !Collider.CollidingWith(ZEngine.ObjectsOfType(this.Config.ObsticalType, this.Obj), [Transform.Size[0], 0])) this.MoveX = Transform.Size[0];
		if((this.MoveX == 0 && this.MoveY == 0) && ZEngine.Input.KeyDown(37) && !Collider.CollidingWith(ZEngine.ObjectsOfType(this.Config.ObsticalType, this.Obj), [-Transform.Size[0], 0])) this.MoveX = -Transform.Size[0];
		if((this.MoveX == 0 && this.MoveY == 0) && ZEngine.Input.KeyDown(38) && !Collider.CollidingWith(ZEngine.ObjectsOfType(this.Config.ObsticalType, this.Obj), [0, -Transform.Size[1]])) this.MoveY = -Transform.Size[1];
		if((this.MoveX == 0 && this.MoveY == 0) && ZEngine.Input.KeyDown(40) && !Collider.CollidingWith(ZEngine.ObjectsOfType(this.Config.ObsticalType, this.Obj), [0, Transform.Size[1]])) this.MoveY = Transform.Size[1];
		
		if(Transform.Position[0] < this.OrigX + this.MoveX){this.Moving = true; Transform.Position[0] += this.Config.Speed;}
		if(Transform.Position[0] > this.OrigX + this.MoveX){this.Moving = true; Transform.Position[0] -= this.Config.Speed;}
		if(Transform.Position[1] < this.OrigY + this.MoveY){this.Moving = true; Transform.Position[1] += this.Config.Speed;}
		if(Transform.Position[1] > this.OrigY + this.MoveY){this.Moving = true; Transform.Position[1] -= this.Config.Speed;}

		if(Transform.Position[0] == this.OrigX + this.MoveX) this.MoveX = 0;
		if(Transform.Position[1] == this.OrigY + this.MoveY) this.MoveY = 0;
	}
	
	return this;
}

// BirdsEyeController
ZEngineComponents.BirdsEyeController = function(Obj, Data){
	// Setup
	this.Obj = Obj;

	this.Config = {
		Speed: 1,
		ObsticalType: "Obstical",
		ShowOutline: false
	}; for(var I in Data) this.Config[I] = Data[I];

	var Transform = this.Obj.Transform;
	var Collider = this.Obj.AddComponent("Collider", {ShowOutline: this.Config.ShowOutline});

	this.MoveX = 0;
	this.MoveY = 0;

	// Update
	this.Update = () => {
		if(ZEngine.Input.KeyDown(39)) this.MoveX = this.Config.Speed;
		if(ZEngine.Input.KeyDown(37)) this.MoveX = -this.Config.Speed;
		if(ZEngine.Input.KeyDown(38)) this.MoveY = -this.Config.Speed;
		if(ZEngine.Input.KeyDown(40)) this.MoveY = this.Config.Speed;

		// Get collider objects
		var ColliderObjects = ZEngine.ObjectsOfType(this.Config.ObsticalType, this.Obj);

		// X move
		for(var X = 0; X < Math.abs(this.MoveX); X++){
			if(Collider.CollidingWith(ColliderObjects, [(this.MoveX > 0) ? 1 : -1, 0])) this.MoveX = 0;
			if(this.MoveX != 0) Transform.Position[0] += (this.MoveX > 0) ? 1 : -1;
		}

		// Y move
		for(var Y = 0; Y < Math.abs(this.MoveY); Y++){ 
			if(Collider.CollidingWith(ColliderObjects, [0, (this.MoveY > 0) ? 1 : -1])) this.MoveY = 0;
			if(this.MoveY != 0) Transform.Position[1] += (this.MoveY > 0) ? 1 : -1;
		}

		this.MoveX = 0;
		this.MoveY = 0;
	}
	
	return this;
}

// ZEngineScene
class ZEngineScene
{
	constructor(Alias, Init)
	{
		this.Alias = Alias;
		this.Init = Init;
		ZEngineScene.Scenes[this.Alias] = this;
	}

	Run()
	{
		ZEngine.Input.CursorType("default");

		if(ZEngineScene.Get(ZEngineScene.CurrentScene) != null)
			ZEngineScene.Get(ZEngineScene.CurrentScene).Destruct();

		ZEngineScene.CurrentScene = this.Alias;
		this.Init();
	}

	Destruct()
	{
		//ZEngine.Prefabs = [];
		ZEngine.Objects = [];
		ZEngine.LayeredObjects = [];
	}
}

ZEngineScene.CurrentScene = "";
ZEngineScene.Scenes = {};

ZEngineScene.Get = function(Alias)
{
	if(ZEngineScene.Scenes[Alias] != undefined)
		return ZEngineScene.Scenes[Alias];
	else
		return null;
}