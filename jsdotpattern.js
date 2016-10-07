
if (typeof GridSize == 'undefined')
	var GridSize = 256;
if (typeof GridSizeS == 'undefined')
	var GridSizeS = 0;

var s;
var st;

var worker;

var code_multi_cnt = 0;
var sym_id = 0;

var cmd_sequence = "";
var cmd_sequence_run = [];

var PatternData = 
{
	GridSize: GridSize,
	GridSizeS: GridSizeS,
	DotDist: 20,
	DotRadius: 32,
	DotRadiusY: 32,
	GridCnt: 0,
	GridCntS: 0,
	RelaxState: -1,
	DotGrid: [],
	DotGridS: [],
	DotCoordinates: []
}

// --------------------------------------------------
// reset pattern data with a certain pattern size
// --------------------------------------------------
function reset(size)
{
	PatternData.GridCnt = 0;
	PatternData.GridCntS = 0;
	PatternData.RelaxState = -1;
	PatternData.DotGrid = [];
	PatternData.DotGridS = [];
	PatternData.DotCoordinates = [];

	PatternData.GridSize = size;
	GridSize = size;

	var c = document.getElementById("Canvas");
	c.width = size;
	c.height = size;

	s = Snap("#Svg");
	s.attr({width: size, height: size});

	s.select('defs').selectAll('g').remove();
	s.select("#Pattern").selectAll('*').remove();

	var rect = Snap().rect(0, 0, size, size);

	if (s.select('defs').select('clipPath'))
	{
		s.select('defs').select('clipPath').select('*').remove();
		s.select('defs').select('clipPath').append(rect);
	}
	else
	{
		s.select('defs').select('*').remove();
		s.select('defs').append(Snap.parse("<clipPath id=\"clipPath\"><rect x=\"0\" y=\"0\" width=\""+size+"\" height=\""+size+"\" /></clipPath>"));
	}
	
	if (size <= 256)
		$("#code_multi").css("height", "122px");
	else
		$("#code_multi").css("height", "320px");
}

// --------------------------------------------------
// update the pattern radius without resetting the data
// --------------------------------------------------
function updateRadius(radius, radiusY)
{
	if (radius != PatternData.DotRadius)
	{
		PatternData.DotRadius = radius;
		PatternData.DotRadiusY = radiusY;
		PatternData.GridCnt = PatternData.GridSize/PatternData.DotRadius;
		PatternData.GridCntS = PatternData.GridSizeS/PatternData.DotRadius;

		PatternData.DotGrid = new Array(PatternData.GridCnt*PatternData.GridCnt);
		PatternData.DotGridS = new Array(PatternData.GridCntS*PatternData.GridCntS);

		for (var i=0; i < PatternData.GridCnt*PatternData.GridCnt; i++)
			PatternData.DotGrid[i] = new Array();

		for (var i=0; i < PatternData.GridCntS*PatternData.GridCntS; i++)
			PatternData.DotGridS[i] = new Array();

		for (var i=0; i < PatternData.DotCoordinates.length; i++)
		{
			var ix = Math.floor(PatternData.DotCoordinates[i].x/PatternData.DotRadius);
			var iy = Math.floor(PatternData.DotCoordinates[i].y/PatternData.DotRadius);
			PatternData.DotGrid[iy*PatternData.GridCnt+ix].push(i);
		}
	}
}

// --------------------------------------------------
// add a point to the pattern
// --------------------------------------------------
function addPatternDot(cx, cy)
{
	var DC = new Object();
	DC.x = cx;
	DC.y = cy;
	DC.type = 2;
	PatternData.DotCoordinates.push(DC);
}

// --------------------------------------------------
// generate randomized grid dot pattern
// --------------------------------------------------
function generatePattern(dist, radius, radiusY, grid)
{
	PatternData.DotRadius = 0;
	PatternData.DotDist = dist;
	PatternData.DotCoordinates = new Array();

	var DotCntL = Math.floor(PatternData.GridSize/PatternData.DotDist);
	var DotCntL2;
	if ((grid == 3) || (grid == 4))
		DotCntL2 = Math.floor(PatternData.GridSize/(PatternData.DotDist*0.5*Math.sqrt(2.0)));
	else
		DotCntL2 = DotCntL;

	var DotDistComp = PatternData.GridSize/DotCntL;
	var DotDistComp2 = PatternData.GridSize/DotCntL2;

	var cx;
	var cy;

	for (var py=0; py < DotCntL; py++)
		for (var px=0; px < DotCntL2; px++)
		{
			//var cx = Math.random()*PatternData.GridSize;
			//var cy = Math.random()*PatternData.GridSize;

			if (grid == 3)
			{
				cx = (px+0.5)*DotDistComp2;
				if (px%2 == 0)
					cy = (py+0.25)*DotDistComp;
				else
					cy = (py+0.75)*DotDistComp;
				addPatternDot(cx, cy);
			}
			else if (grid == 4)
			{
				cy = (px+0.5)*DotDistComp2;
				if (px%2 == 0)
					cx = (py+0.25)*DotDistComp;
				else
					cx = (py+0.75)*DotDistComp;
				addPatternDot(cx, cy);
			}
			else if (grid == 2)
			{
				cx = (px+0.5)*DotDistComp2;
				cy = (py+0.5)*DotDistComp;
				addPatternDot(cx, cy);
			}
			else if (grid == 5)
			{
				var offset = 1.0-0.5*0.258819045103;
				cx = (px+offset)*DotDistComp2;
				cy = (py+offset)*DotDistComp;
				addPatternDot(cx, cy);
				cx = (px+offset-0.5)*DotDistComp2;
				cy = (py+offset-0.5*0.258819045103)*DotDistComp;
				addPatternDot(cx, cy);
				cx = (px+offset-0.5*0.258819045103)*DotDistComp2;
				cy = (py+offset-0.5)*DotDistComp;
				addPatternDot(cx, cy);
				cx = (px+offset-1+0.36520324788187813)*DotDistComp2;
				cy = (py+offset-1+0.36520324788187813)*DotDistComp;
				addPatternDot(cx, cy);
			}
			else
			{
				cx = (px+0.05+Math.random()*0.9)*DotDistComp;
				cy = (py+0.05+Math.random()*0.9)*DotDistComp;
				addPatternDot(cx, cy);
			}
		}

	updateRadius(radius, radiusY);

	PatternData.RelaxState = 0;
}

// --------------------------------------------------
// 'shake' pattern by randomly varying the dot positions
// --------------------------------------------------
function shakePattern(strength)
{
	for (var i=0; i < PatternData.GridCnt*PatternData.GridCnt; i++)
		PatternData.DotGrid[i] = new Array();

	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		var dx = (Math.random()-0.5)*strength*PatternData.DotDist;
		var dy = (Math.random()-0.5)*strength*PatternData.DotDist;

		PatternData.DotCoordinates[i].x += dx;
		PatternData.DotCoordinates[i].y += dy;
		if (PatternData.DotCoordinates[i].x < 0) PatternData.DotCoordinates[i].x += PatternData.GridSize;
		if (PatternData.DotCoordinates[i].y < 0) PatternData.DotCoordinates[i].y += PatternData.GridSize;
		if (PatternData.DotCoordinates[i].x >= PatternData.GridSize) PatternData.DotCoordinates[i].x -= PatternData.GridSize;
		if (PatternData.DotCoordinates[i].y >= PatternData.GridSize) PatternData.DotCoordinates[i].y -= PatternData.GridSize;

		var ix = Math.floor(PatternData.DotCoordinates[i].x/PatternData.DotRadius);
		var iy = Math.floor(PatternData.DotCoordinates[i].y/PatternData.DotRadius);
		PatternData.DotGrid[iy*PatternData.GridCnt+ix].push(i);
	}
}

// --------------------------------------------------
// swap pattern x and y coordinates
// --------------------------------------------------
function swapPattern()
{
	for (var i=0; i < PatternData.GridCnt*PatternData.GridCnt; i++)
		PatternData.DotGrid[i] = new Array();

	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		var buf = PatternData.DotCoordinates[i].x;
		PatternData.DotCoordinates[i].x = PatternData.DotCoordinates[i].y;
		PatternData.DotCoordinates[i].y = buf;

		var ix = Math.floor(PatternData.DotCoordinates[i].x/PatternData.DotRadius);
		var iy = Math.floor(PatternData.DotCoordinates[i].y/PatternData.DotRadius);
		PatternData.DotGrid[iy*PatternData.GridCnt+ix].push(i);
	}
}

// --------------------------------------------------
// rotate the current pattern by 45 degrees and scale to fit
// --------------------------------------------------
function rotate45Pattern()
{
	for (var i=0; i < PatternData.GridCnt*PatternData.GridCnt; i++)
		PatternData.DotGrid[i] = new Array();
	
	var coords_old = PatternData.DotCoordinates;
	PatternData.DotCoordinates = new Array();

	var n = 0;

	for (var i=0; i < coords_old.length; i++)
	{
		for (var dy=-1.0; dy <= 1.0; dy++)
			for (var dx=-1.0; dx <= 1.0; dx++)
			{
				var ox = (coords_old[i].x + PatternData.GridSize*(dx-0.5))/Math.sqrt(2.0);
				var oy = (coords_old[i].y + PatternData.GridSize*(dy-0.5))/Math.sqrt(2.0);

				// tiny tolerance added to handle rounding errors
				var cx = (ox/Math.sqrt(2.0) + oy/Math.sqrt(2.0)) + PatternData.GridSize*0.5001;
				var cy = (-ox/Math.sqrt(2.0) + oy/Math.sqrt(2.0)) + PatternData.GridSize*0.5001;
		
				if (cx < 0) continue;
				if (cy < 0) continue;
				if (cx >= PatternData.GridSize) continue;
				if (cy >= PatternData.GridSize) continue;

				addPatternDot(cx, cy);

				var ix = Math.floor(cx/PatternData.DotRadius);
				var iy = Math.floor(cy/PatternData.DotRadius);
				PatternData.DotGrid[iy*PatternData.GridCnt+ix].push(n);
				n += 1;
			}
	}
}

// --------------------------------------------------
// relax dot pattern with periodic bounds
// --------------------------------------------------
function relaxStep(step, metric)
{
	var DotCoordinatesNew = PatternData.DotCoordinates;

	if (PatternData.RelaxState == 0)
	{
		// change all dots to type 2 (large area)
		for (var i=0; i < PatternData.DotCoordinates.length; i++)
			PatternData.DotCoordinates[i].type = 2;
	}

	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		if (PatternData.DotCoordinates[i].type != 2) continue;

		var ptx = PatternData.DotCoordinates[i].x;
		var pty = PatternData.DotCoordinates[i].y;
		var ix = Math.floor(ptx/PatternData.DotRadius);
		var iy = Math.floor(pty/PatternData.DotRadius);
		var ax = 0.0;
		var ay = 0.0;
		var wsum = 0.0;

		for (var diy=iy-1; diy <= iy+1; diy++)
			for (var dix=ix-1; dix <= ix+1; dix++)
			{
				var dix2 = dix;
				var diy2 = diy;
				if (dix2 < 0) dix2 += PatternData.GridCnt;
				if (diy2 < 0) diy2 += PatternData.GridCnt;
				if (dix2 >= PatternData.GridCnt) dix2 -= PatternData.GridCnt;
				if (diy2 >= PatternData.GridCnt) diy2 -= PatternData.GridCnt;

				for (var j=0; j < PatternData.DotGrid[diy2*PatternData.GridCnt+dix2].length; j++)
				if (PatternData.DotGrid[diy2*PatternData.GridCnt+dix2][j] != i)
				{
					var ptx2 = PatternData.DotCoordinates[PatternData.DotGrid[diy2*PatternData.GridCnt+dix2][j]].x;
					var pty2 = PatternData.DotCoordinates[PatternData.DotGrid[diy2*PatternData.GridCnt+dix2][j]].y;
					var dx = ptx-ptx2;
					var dy = pty-pty2;
					if (Math.abs(dx) > PatternData.GridSize/2)
					{
						if (ptx2 > ptx) ptx2 -= PatternData.GridSize;
						else ptx2 += PatternData.GridSize;
						dx = ptx-ptx2;
					}
					if (Math.abs(dy) > PatternData.GridSize/2)
					{
						if (pty2 > pty) pty2 -= PatternData.GridSize;
						else pty2 += PatternData.GridSize;
						dy = pty-pty2;
					}
					if (metric == 2)
					{
						var d = dx*dx + dy*dy*(PatternData.DotRadius/PatternData.DotRadiusY)*(PatternData.DotRadius/PatternData.DotRadiusY);
					}
					else if (metric > 100)
					{
						var d = Math.max(Math.abs(dx) + Math.abs(dy)*(PatternData.DotRadius/PatternData.DotRadiusY));
						d = d*d;
					}
					else
					{
						var d = Math.pow(Math.pow(Math.abs(dx), metric) + Math.pow(Math.abs(dy)*(PatternData.DotRadius/PatternData.DotRadiusY), metric), 2.0/metric);
					}
					if ((d > 0.0) && (d < PatternData.DotRadius*PatternData.DotRadius))
					{
						ax += dx/d;
						ay += dy/d;
						wsum += 1.0/d;
					}
				}
			}

		if (wsum > 0)
		{
			DotCoordinatesNew[i].x = PatternData.DotCoordinates[i].x + step*ax/wsum;
			DotCoordinatesNew[i].y = PatternData.DotCoordinates[i].y + step*ay/wsum;
			if (DotCoordinatesNew[i].x < 0) DotCoordinatesNew[i].x += PatternData.GridSize;
			if (DotCoordinatesNew[i].y < 0) DotCoordinatesNew[i].y += PatternData.GridSize;
			if (DotCoordinatesNew[i].x >= PatternData.GridSize) DotCoordinatesNew[i].x -= PatternData.GridSize;
			if (DotCoordinatesNew[i].y >= PatternData.GridSize) DotCoordinatesNew[i].y -= PatternData.GridSize;
		}
	}

	for (var i=0; i < PatternData.GridCnt*PatternData.GridCnt; i++)
		PatternData.DotGrid[i] = new Array();

	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		var ix = Math.floor(DotCoordinatesNew[i].x/PatternData.DotRadius);
		var iy = Math.floor(DotCoordinatesNew[i].y/PatternData.DotRadius);
		PatternData.DotCoordinates[i].x = DotCoordinatesNew[i].x;
		PatternData.DotCoordinates[i].y = DotCoordinatesNew[i].y;
		PatternData.DotGrid[iy*PatternData.GridCnt+ix].push(i);
	}

	PatternData.RelaxState = 2;
}

// --------------------------------------------------
// relax dot pattern with periodic bounds - small subset
// --------------------------------------------------
function relaxStepS(step)
{
	PatternData.RelaxState = 1;
}

// --------------------------------------------------
// render point display
// --------------------------------------------------
function updateDisplay()
{
	var c = document.getElementById("Canvas");
	var ctx = c.getContext("2d");
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,PatternData.GridSize,PatternData.GridSize);
	if (PatternData.GridSizeS > 0)
	{
		ctx.strokeStyle="#808080";
		ctx.strokeRect(-1,-1,PatternData.GridSizeS+1,PatternData.GridSizeS+1); 
	}
	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		if (PatternData.DotCoordinates[i].type <= 1)
			ctx.fillStyle = "#000000";
		else if (PatternData.DotCoordinates[i].type == 2)
			ctx.fillStyle = "#0000FF";
		else
			ctx.fillStyle = "#FF0000";
		//ctx.fillRect(Math.floor(DotCoordinates[i].x)-1,Math.floor(DotCoordinates[i].y)-1,3,3);
		ctx.beginPath();
		ctx.arc(Math.floor(PatternData.DotCoordinates[i].x),Math.floor(PatternData.DotCoordinates[i].y),0.9,0,2*Math.PI);
		ctx.fill()
	}
}

// --------------------------------------------------
// append symbol instance to pattern svg
// --------------------------------------------------
function pattern_insert_symbol(sym, cx, cy, sym_inl)
{
	if (sym_inl) s.select("#Pattern").append(sym.clone().transform("translate("+cx+", "+cy+")"));
	else s.select("#Pattern").append(sym.use().attr({x: cx, y: cy}));
}


// --------------------------------------------------
// determine symbold types - randomly and possibly relaxed
// --------------------------------------------------
function set_symbol_types(symbol_types, sym_cnt, relax_step_count)
{
	var symbol_nsame = new Array(symbol_types.length);

	for (var i = 0; i < symbol_types.length; ++i)
	{
		symbol_types[i] = Math.floor(Math.random()*sym_cnt);
	}

	if (sym_cnt > 1)
	for (var s=0; s < relax_step_count; s++)
	{
		// compute neighbor statistics
		for (var i=0; i < symbol_types.length; i++)
		{
			var ptx = PatternData.DotCoordinates[i].x;
			var pty = PatternData.DotCoordinates[i].y;
			var ix = Math.floor(ptx/PatternData.DotRadius);
			var iy = Math.floor(pty/PatternData.DotRadius);
			var n = 0;
			var n_same = 0;

			for (var diy=iy-1; diy <= iy+1; diy++)
				for (var dix=ix-1; dix <= ix+1; dix++)
				{
					var dix2 = dix;
					var diy2 = diy;
					if (dix2 < 0) dix2 += PatternData.GridCnt;
					if (diy2 < 0) diy2 += PatternData.GridCnt;
					if (dix2 >= PatternData.GridCnt) dix2 -= PatternData.GridCnt;
					if (diy2 >= PatternData.GridCnt) diy2 -= PatternData.GridCnt;

					for (var j=0; j < PatternData.DotGrid[diy2*PatternData.GridCnt+dix2].length; j++)
						if (PatternData.DotGrid[diy2*PatternData.GridCnt+dix2][j] != i)
						{
							var ptx2 = PatternData.DotCoordinates[PatternData.DotGrid[diy2*PatternData.GridCnt+dix2][j]].x;
							var pty2 = PatternData.DotCoordinates[PatternData.DotGrid[diy2*PatternData.GridCnt+dix2][j]].y;
							var dx = ptx-ptx2;
							var dy = pty-pty2;
							if (Math.abs(dx) > PatternData.GridSize/2)
							{
								if (ptx2 > ptx) ptx2 -= PatternData.GridSize;
								else ptx2 += PatternData.GridSize;
								dx = ptx-ptx2;
							}
							if (Math.abs(dy) > PatternData.GridSize/2)
							{
								if (pty2 > pty) pty2 -= PatternData.GridSize;
								else pty2 += PatternData.GridSize;
								dy = pty-pty2;
							}
							var d = dx*dx + dy*dy;
							if ((d > 0.0) && (d < PatternData.DotDist*PatternData.DotDist*1.8))
							{
								n++;
								if (((symbol_types[i] < sym_cnt/2) && (symbol_types[j] < sym_cnt/2)) ||
								    ((symbol_types[i] >= sym_cnt/2) && (symbol_types[j] >= sym_cnt/2)))
									n_same++;
							}
						}
				}
			if (n > 0)
				symbol_nsame[i] = n_same/n;
			else
				symbol_nsame[i] = 0.0;

		}

		var thr = 1.5 + 0.25*s/(relax_step_count-1);
		var cnts = 0;

		// relax symbol type selections by swapping matching pairs
		for (var i=0; i < symbol_types.length; i++)
			if (symbol_nsame[i] > 0)
				for (var j=symbol_types.length-1; j >= i+1; j--)
				{
					if (((symbol_types[i] < sym_cnt/2) && (symbol_types[j] >= sym_cnt/2)) ||
					    ((symbol_types[i] >= sym_cnt/2) && (symbol_types[j] < sym_cnt/2)))
						if (symbol_nsame[i]+symbol_nsame[j] > thr)
						{
							var buf = symbol_types[i];
							symbol_types[i] = symbol_types[j];
							symbol_types[j] = buf;
							symbol_nsame[i] = -1.0;
							symbol_nsame[j] = -1.0;
							cnts++;
						}
				}

		console.log("iteration "+s+", symbol type swaps: "+cnts);
	}

}

// --------------------------------------------------
// render pattern symbols
// --------------------------------------------------
function render_symbols(sym, symc, px_align, sym_inl, seed)
{
	if (seed)
		Math.seedrandom(seed);

	// symbol indices
	var random_symbol = new Array(PatternData.DotCoordinates.length);
	for (var i = 0; i < random_symbol.length; ++i) random_symbol[i] = i;

	// shuffle symbol order
	for (var i = PatternData.DotCoordinates.length - 1; i > 0; i--)
	{
		var j = Math.floor(Math.random() * (i + 1));
		var buf = random_symbol[i];
		random_symbol[i] = random_symbol[j];
		random_symbol[j] = buf;
	}

	if (seed)
		Math.seedrandom(seed);

	// randomized (and possibly relaxed) symbol types
	var symbol_types = new Array(PatternData.DotCoordinates.length);

	set_symbol_types(symbol_types, sym.length, 0);

	for (var i=0; i < random_symbol.length; i++)
	{
		var cx = PatternData.DotCoordinates[random_symbol[i]].x;
		var cy = PatternData.DotCoordinates[random_symbol[i]].y;

		var snb = symbol_types[i];

		if (px_align)
		{
			cx = Math.round(cx-0.5);
			cy = Math.round(cy-0.5);
		}

		if (symc.length > 0)
			pattern_insert_symbol(symc[snb], cx, cy, sym_inl);
		pattern_insert_symbol(sym[snb], cx, cy, sym_inl);

		if (cx < PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern_insert_symbol(symc[snb], (cx+PatternData.GridSize), cy, sym_inl);
			pattern_insert_symbol(sym[snb], (cx+PatternData.GridSize), cy, sym_inl);
			if (cy < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx+PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx+PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
			}
			else if (cy > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx+PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx+PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
			}
		}
		else if (cx > PatternData.GridSize-PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern_insert_symbol(symc[snb], (cx-PatternData.GridSize), cy, sym_inl);
			pattern_insert_symbol(sym[snb], (cx-PatternData.GridSize), cy, sym_inl);
			if (cy < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx-PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx-PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
			}
			else if (cy > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx-PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx-PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
			}
		}

		if (cy < PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern_insert_symbol(symc[snb], cx, (cy+PatternData.GridSize), sym_inl);
			pattern_insert_symbol(sym[snb], cx, (cy+PatternData.GridSize), sym_inl);
			if (cx < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx+PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx+PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
			}
			else if (cx > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx-PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx-PatternData.GridSize), (cy+PatternData.GridSize), sym_inl);
			}
		}
		else if (cy > PatternData.GridSize-PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern_insert_symbol(symc[snb], cx, (cy-PatternData.GridSize), sym_inl);
			pattern_insert_symbol(sym[snb], cx, (cy-PatternData.GridSize), sym_inl);
			if (cx < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx+PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx+PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
			}
			else if (cx > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern_insert_symbol(symc[snb], (cx-PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
				pattern_insert_symbol(sym[snb], (cx-PatternData.GridSize), (cy-PatternData.GridSize), sym_inl);
			}
		}
	}
}

// --------------------------------------------------
// render pattern as SVG
// --------------------------------------------------
function render(px_align, sym_inl, rrot, sid, scale, off_x, off_y, casing_width, seed, col_sym, col_bkg)
{
	s.select('defs').selectAll('g').remove();
	s.select("#Pattern").selectAll('*').remove();

	$('.rim').css('background-color',col_bkg);

	var sym = [];
	var symc = [];

	var rrotate_cnt = 1;

	if (rrot)
		rrotate_cnt = 13;

	var custom_svg = false;

	if (sid < 0)
	{
		sid = -sid-1;
		custom_svg = true;
	}

	if (typeof(SelSyms[sid].svg) !== "string")
	{
		var c = 0;
		for (var i=0; i < SelSyms[sid].svg.length; i++)
		for (var j=0; j < rrotate_cnt; j++)
		{
			if (custom_svg)
				var f = Snap.parse($('#code'+i).val());
			else
				var f = Snap.parse(SelSyms[sid].svg[i]);
			sym.push(s.g());
			if ((col_sym != "#000000") && (col_sym != "#000"))
				sym[c].attr({fill: col_sym});
			if (!sym_inl) sym[c].toDefs();
			sym[c].append(f);
			if (j > 0)
				sym[c].transform("rotate("+(j*360/rrotate_cnt)+") scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");
			else
				sym[c].transform("scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");

			if (casing_width > 0)
			{
				if (custom_svg)
					var f2 = Snap.parse($('#code'+i).val());
				else
					var f2 = Snap.parse(SelSyms[sid].svg[i]);
				symc.push(s.g());
				symc[c].attr({stroke: "#ffffff", strokeWidth: casing_width/scale, strokeLinecap: "round"});
				if (!sym_inl) symc[c].toDefs();
				symc[c].append(f2);
				if (j > 0)
					symc[c].transform("rotate("+(j*360/rrotate_cnt)+") scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");
				else
					symc[c].transform("scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");
			}
			c++;
		}
	}
	else
	{
		for (var j=0; j < rrotate_cnt; j++)
		{
			if (custom_svg)
				var f = Snap.parse($('#code').val());
			else
				var f = Snap.parse(SelSyms[sid].svg);
			sym.push(s.g());
			if ((col_sym != "#000000") && (col_sym != "#000"))
				sym[j].attr({fill: col_sym});
			if (!sym_inl) sym[j].toDefs();
			sym[j].append(f);
			if (j > 0)
				sym[j].transform("rotate("+(j*360/rrotate_cnt)+") scale("+scale+") translate("+(0-off_y)+", "+(0-off_y)+")");
			else
				sym[j].transform("scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");

			if (casing_width > 0)
			{
				var f2 = Snap.parse($('#code').val());
				symc.push(s.g());
				symc[j].attr({stroke: "#ffffff", strokeWidth: casing_width/scale, strokeLinecap: "round"});
				if (!sym_inl) symc[j].toDefs();
				symc[j].append(f2);
				if (j > 0)
					symc[j].transform("rotate("+(j*360/rrotate_cnt)+") scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");
				else
					symc[j].transform("scale("+scale+") translate("+(0-off_x)+", "+(0-off_y)+")");
			}
		}
	}

	render_symbols(sym, symc, px_align, sym_inl, seed);

	if (sym_inl) 
	{
		for (var j=0; j < sym.length; j++) sym[j].remove();
		for (var j=0; j < symc.length; j++) symc[j].remove();
	}

	var svg = document.getElementById("Svg");
	svg.toDataURL("image/svg+xml", {
		callback: function(data) {
		var a = document.getElementById("SvgData");
		a.href = data;
		a.style.display = "inline";
		}
	});
}

// --------------------------------------------------
// print point list
// --------------------------------------------------
function point_list()
{
	$('#pointdata').text("");
	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		$('#pointdata').append(PatternData.DotCoordinates[i].x+" "+PatternData.DotCoordinates[i].y+"<br>");
	}
}

// --------------------------------------------------
// inspect SVG symbol
// --------------------------------------------------
function inspect()
{
	st.selectAll('*').remove();
	var sym = st.g();
	var se = sym.append(Snap.parse($('#code').val()));
	var bb = se.getBBox();
	st.attr({viewBox: [bb.x, bb.y, bb.w, bb.h]});
	$('#offset_x').val(Math.round(bb.cx));
	$('#offset_y').val(Math.round(bb.cy));
	var sz = $('#sym_scale').val();
	st.attr({width: bb.w*sz, height: bb.h*sz});
	$('#Svg_Test').css({"margin-left":Math.floor((24-bb.w*sz)/2), "margin-top":Math.floor((24-bb.h*sz)/2)});
}


// --------------------------------------------------
// command sequence functions
// --------------------------------------------------
function command_sequence_reset()
{
	cmd_sequence = "";
	$('#cmd_seq').text("");
	$('#cmd_seq_link').attr("href", "#");
}

function command_sequence_add(cmd)
{
	// for rendering commands: remove all previous rendering commands
	if (cmd.substr(0,2) == "rd")
	{
		var cmds = cmd_sequence.split(";");

		for (var j=cmds.length-1; j >= 0; j--)
		{
			if (cmds[j].substr(0,2) == "rd")
				cmds.splice(j,1);
		}

		cmd_sequence = cmds.join(";")+cmd+";";
	}
	// for swap: possibly cancel with previous swap
	else if (cmd.substr(0,2) == "ts")
	{
		var cmds = cmd_sequence.split(";");

		if (cmds[cmds.length-2].substr(0,2) == "ts")
		{
			cmds.pop();
			cmds.pop();
			cmd_sequence = cmds.join(";")+";";
		}
		else
			cmd_sequence = cmd_sequence+cmd+";";
	}
	else
		cmd_sequence = cmd_sequence+cmd+";";

	$('#cmd_seq').text(cmd_sequence);
	$('#cmd_seq_link').attr("href", "#"+cmd_sequence);
}

// --------------------------------------------------
// command interpreter
//
//  calls command_sequence_run recursively when 
//  called in script mode
// --------------------------------------------------
function command(cmd)
{
	if (!cmd) return;
	if (cmd.length == 0) return;

	console.log("command "+cmd);

	var params = cmd.split(",");
	if (params[0] == "x")
	{
		var sz = GridSize;
		if (params[1])
			if (params[1].length > 0)
				sz = parseInt(params[1]);

		$('.sz-switch').removeClass("active").addClass("inactive");
		$('#sz_'+sz).removeClass("inactive").addClass("active");

		Math.seedrandom();
		var seed = "jdp"+Math.floor(Math.random()*100000);
		if (params[2])
			if (params[2].length > 0)
				seed = params[2];

		if (isNaN(sz)) sz = 256;
		if (sz != 64) if (sz != 128) if (sz != 256) if (sz != 512) if (sz != 1024) if (sz != 2048) sz = 256;

		command_sequence_reset()
		command_sequence_add("x,"+sz+","+seed);

		Math.seedrandom(seed);

		reset(sz);
		if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
		else updateDisplay();
	}
	else if ((params[0] == "g") || (params[0] == "gt") || (params[0] == "gv") || (params[0] == "gs") || (params[0] == "g5"))
	{
		var dot_dist = parseFloat($('#dot_dist').val());
		if (params[1])
			if (params[1].length > 0)
			{
				dot_dist = parseFloat(params[1]);
				$('#dot_dist').val(dot_dist);
			}

		var dot_radius = parseInt($('#dot_radius').val());
		if (params[2])
			if (params[2].length > 0)
			{
				dot_radius = parseInt(params[2]);
				$('#dot_radius').val(dot_radius);
			}

		var dot_radius_y = parseFloat($('#dot_radius_y').val());
		if (params[3])
			if (params[3].length > 0)
			{
				dot_radius_y = parseFloat(params[3]);
				$('#dot_radius_y').val(dot_radius_y);
			}

		var grid = 0;
		if (params[0] == "gt") grid = 3;
		else if (params[0] == "gv") grid = 4;
		else if (params[0] == "gs") grid = 2;
		else if (params[0] == "g5") grid = 5;

		if (isNaN(dot_dist)) dot_dist = 20;
		if (isNaN(dot_radius)) dot_radius = 32;
		if (isNaN(dot_radius_y)) dot_radius_y = dot_radius;

		command_sequence_add(params[0]+","+dot_dist+","+dot_radius+","+dot_radius_y);

		generatePattern(dot_dist, dot_radius, dot_radius_y, grid);

		if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
		else updateDisplay();
	}
	else if (params[0] == "rx")
	{
		var steps = 25;
		if (params[1])
			if (params[1].length > 0)
				steps = parseInt(params[1]);

		var metric = $('#metric').val();
		if (params[2])
			if (params[2].length > 0)
			{
				metric = parseInt(params[2]);
				$('#metric').val(metric);
			}

		var dot_radius = parseInt($('#dot_radius').val());
		if (params[3])
			if (params[3].length > 0)
			{
				dot_radius = parseInt(params[3]);
				$('#dot_radius').val(dot_radius);
			}

		var dot_radius_y = parseFloat($('#dot_radius_y').val());
		if (params[4])
			if (params[4].length > 0)
			{
				dot_radius_y = parseFloat(params[4]);
				$('#dot_radius_y').val(dot_radius_y);
			}

		if (isNaN(steps)) steps = 25;
		if (isNaN(metric)) metric = 2;
		if (isNaN(dot_radius)) dot_radius = 32;
		if (isNaN(dot_radius_y)) dot_radius_y = dot_radius;

		if (steps > 500) steps = 500;

		command_sequence_add("rx,"+steps+","+metric+","+dot_radius+","+dot_radius_y);

		updateRadius(dot_radius, dot_radius_y)

		if (typeof window.Worker === "function")
		{
			$('#msg').text("relaxing...");
			worker = new Worker('relax_ww.js');
			worker.onmessage = function (event) {
				if (event.data.length > 100)
				{
					PatternData = JSON.parse(event.data);
					$('#msg').text("");
					if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
					else updateDisplay();
				}
				//else
				//	console.log(event.data);
			};
			worker.postMessage(JSON.stringify({"step":0.02, "metric": metric, "data":PatternData}));

			for (var i=0; i < steps; i++)
			{
				worker.postMessage("step");
			}

			worker.postMessage("stop");
		}
		else
		{
			for (var i=0; i < steps; i++)
			{
				relaxStep(0.02, metric);
			}
			if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
			else updateDisplay();
		}
	}
	else if (params[0] == "s")
	{
		Math.seedrandom();
		var seed = "jdp"+Math.floor(Math.random()*100000);
		if (params[1])
			if (params[1].length > 0)
				seed = params[1];

		command_sequence_add("s,"+seed);

		Math.seedrandom(seed);

		shakePattern(0.3);

		if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
		else updateDisplay();
	}
	else if (params[0] == "tr")
	{
		command_sequence_add("tr");

		rotate45Pattern();

		if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
		else updateDisplay();
	}
	else if (params[0] == "ts")
	{
		command_sequence_add("ts");

		swapPattern();

		if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
		else updateDisplay();
	}
	else if (params[0] == "rd")
	{
		var palign = false;
		if (params[1])
			if (params[1] != "0") palign = true;

		var sym_inl = false;
		if (params[2])
			if (params[2] != "0") sym_inl = true;

		var rrotate = $('#B_rrotate').is(':checked');
		if (params[3])
			if (params[3] != "0")
			{
				rrotate = true;
				$('#B_rrotate').prop('checked', true);
			}

		var sid = -1-sym_id;
		if (params[4])
			if (params[4].length > 0)
			{
				for (var i=0; i < SelSyms.length; i++)
					if (SelSyms[i].name == params[4])
					{
						sid = i;
						break;
					}
				if (sid < 0) sid = parseInt(params[4]);
				$('#sym_selector').slick("slickGoTo", sid);
				$('#sym_sel_'+sid).click();
			}

		var scale = parseFloat($('#sym_scale').val());
		if (params[5])
			if (params[5].length > 0)
			{
				scale = parseFloat(params[5]);
				$('#sym_scale').val(scale);
			}

		var off_x = parseFloat($('#offset_x').val());
		if (params[6])
			if (params[6].length > 0)
			{
				off_x = parseFloat(params[6]);
				$('#offset_x').val(off_x);
			}

		var off_y = parseFloat($('#offset_y').val());
		if (params[7])
			if (params[7].length > 0)
			{
				off_y = parseFloat(params[7]);
				$('#offset_y').val(off_y);
			}

		var cwdth = parseFloat($('#casing_width').val());
		if (params[8])
			if (params[8].length > 0)
			{
				cwdth = parseFloat(params[8]);
				$('#casing_width').val(cwdth);
			}

		Math.seedrandom();
		var seed = "jdp"+Math.floor(Math.random()*100000);
		if (params[9])
			if (params[9].length > 0)
				seed = params[9];

		var col_sym = $('#sym_color').val();
		if (params[10])
			if (params[10].length > 0)
			{
				col_sym = "#"+params[10].substr(0,6);
				$('#sym_color').val(col_sym);
			}

		var col_bkg = $('#bkg_color').val();
		if (params[11])
			if (params[11].length > 0)
			{
				col_bkg = "#"+params[11].substr(0,6);
				$('#bkg_color').val(col_bkg);
			}

		if (isNaN(scale)) scale = 1.0;
		if (isNaN(off_x)) off_x = 0.0;
		if (isNaN(off_y)) off_y = 0.0;
		if (isNaN(cwdth)) cwdth = 0.0;

		var sym_name = SelSyms[(sid>=0?sid:-sid-1)].name;

		command_sequence_add("rd,"+(palign?1:0)+","+(sym_inl?1:0)+","+(rrotate?1:0)+","+sym_name+","+scale+","+off_x+","+off_y+","+cwdth+","+seed+","+col_sym.substr(1)+","+col_bkg.substr(1));

		Math.seedrandom(seed);

		render(palign, sym_inl, rrotate, sid, scale, off_x, off_y, cwdth, seed, col_sym, col_bkg);

		if (cmd_sequence_run.length > 0) command_sequence_run(cmd_sequence_run);
		else
		{
			updateDisplay();
			$('#msg').text("");
		}
	}
}

function command_sequence_run(seq)
{
	var cmd = seq.shift();
	cmd_sequence_run = seq;
	if (cmd.length > 0)
	{
		$('#msg').text("running command '"+cmd+"'...");
		//console.log("command_sequence_run "+cmd);
		command(cmd);
	}
	else
	{
		$('#msg').text("");
		updateDisplay();
	}
}

$(document).ready(function () {

	if (PatternData.GridSizeS > 0)
		$('#B_relaxS').show();

	$('.sz-switch').click(function() {
		command("x,"+parseInt($(this).attr("id").split("_")[1]));
	});

	$('#B_generate').click(function() {
		command("x");
		command("g");
	});

	$('#B_generate_triangle').click(function() {
		command("x");
		command("gt");
	});

	$('#B_generate_triangle2').click(function() {
		command("x");
		command("gv");
	});

	$('#B_generate_square').click(function() {
		command("x");
		command("gs");
	});

	$('#B_generate_snub').click(function() {
		command("x");
		command("g5");
	});

	$('#B_relax').click(function() {
		command("rx,25");
	});

	$('#B_relax10').click(function() {
		command("rx,250");
	});

	$('#B_relaxS').click(function() {
		for (var i=0; i < 25; i++)
		{
			relaxStepS(0.02, parseInt($('#metric').val()));
		}
	});

	$('#B_shake').click(function() {
		command("s");
	});

	$('#B_rotate').click(function() {
		command("tr");
	});

	$('#B_swap').click(function() {
		command("ts");
	});

	$('#B_render').click(function() {
		command("rd");
	});

	$('#B_prender').click(function() {
		command("rd,1");
	});

	$('#B_irender').click(function() {
		command("rd,1,1");
	});

	$('#B_inspect').click(function() {
		inspect();
	});

	$('#B_list').click(function() {
		point_list();
	});

	$('#B_help').click(function() {
		$('.help').toggle("fast");
	});

	$('#B_cmdseq').click(function() {
		$('.cmdseq').toggle("fast");
	});

	for (var i=0; i < SelSyms.length; i++)
	{
		if (typeof(SelSyms[i].svg) === "string")
			$("#sym_selector").append("<div class=\"sym-sel-entry\" id='sym_sel_"+i+"'><div class=\"sym-sel-svg\"><svg id=\"Svg_"+i+"\"></svg></div><div class=\"sym-sel-caption\">"+SelSyms[i].name+"</div></div>");
		else
			$("#sym_selector").append("<div class=\"sym-sel-entry\" id='sym_sel_"+i+"'><div class=\"sym-sel-svg\"><svg id=\"Svg_"+i+"\"></svg></div><div class=\"sym-sel-caption\">"+SelSyms[i].name+"&nbsp;<span title=\"multiple symbols\" class=\"sym-multi\">+</span></div></div>");
	}

	$("#code").text(SelSyms[0].svg);
	$("#sym_sel_0").addClass("sym-active");

	$('#sym_selector').slick({
		slidesToShow: 5,
		slidesToScroll: 3
	});

	reset(GridSize);

	st = Snap("#Svg_Test");

	for (var i=0; i < SelSyms.length; i++)
	{
		var svg_preview = Snap("#Svg_"+i);
		svg_preview.selectAll('*').remove();
		var sym = svg_preview.g();
		if (typeof(SelSyms[i].svg) === "string")
			var se = sym.append(Snap.parse(SelSyms[i].svg));
		else
			var se = sym.append(Snap.parse(SelSyms[i].svg[0]));
		var bb = se.getBBox();
		svg_preview.attr({viewBox: [bb.x, bb.y, bb.w, bb.h]});
	}

	$('.sym-sel-entry').click(function() {
		if ($(this).attr("id"))
		{
			sym_id = parseInt($(this).attr("id").split("_")[2]);
			$('.sym-sel-entry').removeClass("sym-active");
			$(this).addClass("sym-active");

			if (typeof(SelSyms[sym_id].svg) === "string")
			{
				if (PatternData.GridSize > 256)
				{
					if (SelSyms[sym_id].svg.length < 600) $("#code").attr({"rows": 9});
					else $("#code").attr({"rows": 20});
				}
				else $("#code").attr({"rows": 9});

				$("#code").text(SelSyms[sym_id].svg);
				$("#code_single").show();
				$("#code_multi").hide();
			}
			else
			{
				for (var i=0; i < SelSyms[sym_id].svg.length; i++)
				{
					if (i >= code_multi_cnt)
					{
						$("#code_multi").append('<textarea class="svg-code-small" name="code'+i+'" id="code'+i+'" cols="72" rows="2" title="enter SVG code for the symbol here"></textarea>');
						code_multi_cnt++;
					}
					else
						$("#code"+i).show();

					if (SelSyms[sym_id].svg[i].length < 120) $("#code"+i).attr({"rows": 2});
					else $("#code"+i).attr({"rows": 4});

					$("#code"+i).text(SelSyms[sym_id].svg[i]);
					if (i == 0) $("#code").text(SelSyms[sym_id].svg[i]);
				}
				for (var i=SelSyms[sym_id].svg.length; i < code_multi_cnt; i++) $("#code"+i).hide();
				$("#code_single").hide();
				$("#code_multi").show();
			}
		}
	});

	cmd_sequence = $.url("#");

	if (cmd_sequence.length > 0)
	{
		$('.cmdseq').show();
		command_sequence_run(decodeURI(cmd_sequence).split(";"));
	}

});
