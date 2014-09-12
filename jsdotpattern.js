
if (typeof GridSize == 'undefined')
	var GridSize = 256;
if (typeof GridSizeS == 'undefined')
	var GridSizeS = 0;

var DotDist = 20;
var DotRadius = 32;

var GridCnt = GridSize/DotRadius;
var GridCntS = GridSizeS/DotRadius;

var DotGrid;
var DotGridS;
var DotCoordinates = new Array();

var RelaxState = -1;

var s;
var st;

// --------------------------------------------------
// generate randomized grid dot pattern
// --------------------------------------------------
function generatePattern()
{
	DotDist = $('#dot_dist').val();
	DotRadius = $('#dot_radius').val();
	GridCnt = GridSize/DotRadius;
	GridCntS = GridSizeS/DotRadius;

	DotGrid = new Array(GridCnt*GridCnt);
	DotGridS = new Array(GridCntS*GridCntS);
	DotCoordinates = new Array();

	for (var i=0; i < GridCnt*GridCnt; i++)
		DotGrid[i] = new Array();

	for (var i=0; i < GridCntS*GridCntS; i++)
		DotGridS[i] = new Array();

	var idx = 0;

	var DotCntL = Math.floor(GridSize/DotDist);
	var DotDistComp = GridSize/DotCntL;

	for (var py=0; py < DotCntL; py++)
		for (var px=0; px < DotCntL; px++)
		{
			var cx = (px+0.05+Math.random()*0.9)*DotDistComp;
			var cy = (py+0.05+Math.random()*0.9)*DotDistComp;
			var ix = Math.floor(cx/DotRadius);
			var iy = Math.floor(cy/DotRadius);
			var DC = new Object();
			DC.x = cx;
			DC.y = cy;
			DotGrid[iy*GridCnt+ix].push(idx);
			if ((iy < GridCntS) && (ix < GridCntS))
			{
				DotGridS[iy*GridCntS+ix].push(idx);
				DC.type = 1;
			}
			else
			{
				DC.type = 2;
			}
			DotCoordinates.push(DC);
			idx++;
		}
		
	RelaxState = 0;
}

// --------------------------------------------------
// relax dot pattern with periodic bounds
// --------------------------------------------------
function relaxStep(step)
{
	var DotCoordinatesNew = DotCoordinates;

	if (RelaxState == 0)
	{
		// change all dots to type 2 (large area)
		for (var i=0; i < DotCoordinates.length; i++)
			DotCoordinates[i].type = 2;
	}

	for (var i=0; i < DotCoordinates.length; i++)
	{
		if (DotCoordinates[i].type != 2) continue;

		var ptx = DotCoordinates[i].x;
		var pty = DotCoordinates[i].y;
		var ix = Math.floor(ptx/DotRadius);
		var iy = Math.floor(pty/DotRadius);
		var ax = 0.0;
		var ay = 0.0;
		var wsum = 0.0;

		for (var diy=iy-1; diy <= iy+1; diy++)
			for (var dix=ix-1; dix <= ix+1; dix++)
			{
				var dix2 = dix;
				var diy2 = diy;
				if (dix2 < 0) dix2 += GridCnt;
				if (diy2 < 0) diy2 += GridCnt;
				if (dix2 >= GridCnt) dix2 -= GridCnt;
				if (diy2 >= GridCnt) diy2 -= GridCnt;

				for (var j=0; j < DotGrid[diy2*GridCnt+dix2].length; j++)
				if (j != i)
				{
					var ptx2 = DotCoordinates[DotGrid[diy2*GridCnt+dix2][j]].x;
					var pty2 = DotCoordinates[DotGrid[diy2*GridCnt+dix2][j]].y;
					var dx = ptx-ptx2;
					var dy = pty-pty2;
					if (Math.abs(dx) > GridSize/2)
					{
						if (ptx2 > ptx) ptx2 -= GridSize;
						else ptx2 += GridSize;
						dx = ptx-ptx2;
					}
					if (Math.abs(dy) > GridSize/2)
					{
						if (pty2 > pty) pty2 -= GridSize;
						else pty2 += GridSize;
						dy = pty-pty2;
					}
					var d = dx*dx + dy*dy;
					if (d > 0.0)
					if (d < DotRadius*DotRadius)
					{
						ax += dx/d;
						ay += dy/d;
						wsum += 1.0/d;
					}
				}
			}

		if (wsum > 0)
		{
			DotCoordinatesNew[i].x = DotCoordinates[i].x + step*ax/wsum;
			DotCoordinatesNew[i].y = DotCoordinates[i].y + step*ay/wsum;
			if (DotCoordinatesNew[i].x < 0) DotCoordinatesNew[i].x += GridSize;
			if (DotCoordinatesNew[i].y < 0) DotCoordinatesNew[i].y += GridSize;
			if (DotCoordinatesNew[i].x >= GridSize) DotCoordinatesNew[i].x -= GridSize;
			if (DotCoordinatesNew[i].y >= GridSize) DotCoordinatesNew[i].y -= GridSize;
		}
	}

	for (var i=0; i < GridCnt*GridCnt; i++)
		DotGrid[i] = new Array();

	for (var i=0; i < DotCoordinates.length; i++)
	{
		var ix = Math.floor(DotCoordinatesNew[i].x/DotRadius);
		var iy = Math.floor(DotCoordinatesNew[i].y/DotRadius);
		DotCoordinates[i].x = DotCoordinatesNew[i].x;
		DotCoordinates[i].y = DotCoordinatesNew[i].y;
		DotGrid[iy*GridCnt+ix].push(i);
	}

	RelaxState = 2;
}

// --------------------------------------------------
// relax dot pattern with periodic bounds - small subset
// --------------------------------------------------
function relaxStepS(step)
{
	RelaxState = 1;
}

// --------------------------------------------------
// modify a color map with auto Luminance
// --------------------------------------------------
function updateDisplay()
{
	var c = document.getElementById("Canvas");
	var ctx = c.getContext("2d");
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,GridSize,GridSize);
	if (GridSizeS > 0)
	{
		ctx.strokeStyle="#808080";
		ctx.strokeRect(-1,-1,GridSizeS+1,GridSizeS+1); 
	}
	for (var i=0; i < DotCoordinates.length; i++)
	{
		if (DotCoordinates[i].type <= 1)
			ctx.fillStyle = "#000000";
		else if (DotCoordinates[i].type == 2)
			ctx.fillStyle = "#0000FF";
		else
			ctx.fillStyle = "#FF0000";
		ctx.fillRect(Math.floor(DotCoordinates[i].x)-1,Math.floor(DotCoordinates[i].y)-1,3,3);
	}
}

// --------------------------------------------------
// render pattern as SVG
// --------------------------------------------------
function render()
{
	var f = Snap.parse($('#code').val());
	s.select('defs').selectAll('g').remove();
	s.select("#Pattern").selectAll('*').remove();
	var sym = s.g();
	sym.toDefs();
	sym.append(f);
	sym.transform("translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+") scale("+$('#sym_scale').val()+")");
	var g = s.select("#Pattern");

	for (var i=0; i < DotCoordinates.length; i++)
	{
		var cx = DotCoordinates[i].x;
		var cy = DotCoordinates[i].y;
		g.append(sym.use().attr({x: cx, y: cy}));

		if (cx < DotRadius)
		{
			g.append(sym.use().attr({x: (cx+GridSize), y: cy}));
			if (cy < DotRadius)
			{
				g.append(sym.use().attr({x: (cx+GridSize), y: (cy+GridSize)}));
			}
			else if (cy > GridSize-DotRadius)
			{
				g.append(sym.use().attr({x: (cx+GridSize), y: (cy-GridSize)}));
			}
		}
		else if (cx > GridSize-DotRadius)
		{
			g.append(sym.use().attr({x: (cx-GridSize), y: cy}));
			if (cy < DotRadius)
			{
				g.append(sym.use().attr({x: (cx-GridSize), y: (cy+GridSize)}));
			}
			else if (cy > GridSize-DotRadius)
			{
				g.append(sym.use().attr({x: (cx-GridSize), y: (cy-GridSize)}));
			}
		}

		if (cy < DotRadius)
		{
			g.append(sym.use().attr({x: cx, y: (cy+GridSize)}));
			if (cx < DotRadius)
			{
				g.append(sym.use().attr({x: (cx+GridSize), y: (cy+GridSize)}));
			}
			else if (cx > GridSize-DotRadius)
			{
				g.append(sym.use().attr({x: (cx-GridSize), y: (cy+GridSize)}));
			}
		}
		else if (cy > GridSize-DotRadius)
		{
			g.append(sym.use().attr({x: cx, y: (cy-GridSize)}));
			if (cx < DotRadius)
			{
				g.append(sym.use().attr({x: (cx+GridSize), y: (cy-GridSize)}));
			}
			else if (cx > GridSize-DotRadius)
			{
				g.append(sym.use().attr({x: (cx-GridSize), y: (cy-GridSize)}));
			}
		}
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
	for (var i=0; i < DotCoordinates.length; i++)
	{
		$('#pointdata').append(DotCoordinates[i].x+" "+DotCoordinates[i].y+"<br>");
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
	$('#offset_x').val(bb.cx);
	$('#offset_y').val(bb.cy);
}

$(document).ready(function () {

	if (GridSizeS > 0)
		$('#B_relaxS').show();

	$('#B_generate').click(function() {
		generatePattern();
		updateDisplay();
	});

	$('#B_relax').click(function() {
		for (var i=0; i < 25; i++)
			relaxStep(0.02);
		updateDisplay();
	});

	$('#B_relaxS').click(function() {
		for (var i=0; i < 25; i++)
			relaxStepS(0.02);
		updateDisplay();
	});

	$('#B_render').click(function() {
		render();
	});

	$('#B_inspect').click(function() {
		inspect();
	});

	$('#B_list').click(function() {
		point_list();
	});

	$('#B_load').click(function() {
		$("#code").text(SelSyms[$("#SelSymbol").val()].svg);
	});

	s = Snap("#Svg");
	st = Snap("#Svg_Test");

	for (var i=0; i < SelSyms.length; i++)
		$("#SelSymbol").append("<option value='"+i+"'>"+SelSyms[i].name+"</option>");

	$("#code").text(SelSyms[$("#SelSymbol").val()].svg);

});
