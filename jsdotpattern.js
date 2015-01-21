
if (typeof GridSize == 'undefined')
	var GridSize = 256;
if (typeof GridSizeS == 'undefined')
	var GridSizeS = 0;
if (typeof CasingWidth == 'undefined')
	var CasingWidth = 12;

var s;
var st;

var worker;

var code_multi_cnt = 0;

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

	s.select('defs').select('clipPath').select('*').remove();
	var rect = Snap().rect(0, 0, size, size);
	s.select('defs').select('clipPath').append(rect);
}

// --------------------------------------------------
// generate randomized grid dot pattern
// --------------------------------------------------
function generatePattern()
{
	PatternData.DotDist = parseFloat($('#dot_dist').val());
	PatternData.DotRadius = parseInt($('#dot_radius').val());
	PatternData.DotRadiusY = parseFloat($('#dot_radius_y').val());
	PatternData.GridCnt = PatternData.GridSize/PatternData.DotRadius;
	PatternData.GridCntS = PatternData.GridSizeS/PatternData.DotRadius;

	PatternData.DotGrid = new Array(PatternData.GridCnt*PatternData.GridCnt);
	PatternData.DotGridS = new Array(PatternData.GridCntS*PatternData.GridCntS);
	PatternData.DotCoordinates = new Array();

	for (var i=0; i < PatternData.GridCnt*PatternData.GridCnt; i++)
		PatternData.DotGrid[i] = new Array();

	for (var i=0; i < PatternData.GridCntS*PatternData.GridCntS; i++)
		PatternData.DotGridS[i] = new Array();

	var idx = 0;

	var DotCntL = Math.floor(PatternData.GridSize/PatternData.DotDist);
	var DotDistComp = PatternData.GridSize/DotCntL;

	for (var py=0; py < DotCntL; py++)
		for (var px=0; px < DotCntL; px++)
		{
			//var cx = Math.random()*PatternData.GridSize;
			//var cy = Math.random()*PatternData.GridSize;
			//var cx = (px+0.5)*DotDistComp;
			//var cy = (py+0.5)*DotDistComp;
			var cx = (px+0.05+Math.random()*0.9)*DotDistComp;
			var cy = (py+0.05+Math.random()*0.9)*DotDistComp;
			var ix = Math.floor(cx/PatternData.DotRadius);
			var iy = Math.floor(cy/PatternData.DotRadius);
			var DC = new Object();
			DC.x = cx;
			DC.y = cy;
			PatternData.DotGrid[iy*PatternData.GridCnt+ix].push(idx);
			if ((iy < PatternData.GridCntS) && (ix < PatternData.GridCntS))
			{
				PatternData.DotGridS[iy*PatternData.GridCntS+ix].push(idx);
				DC.type = 1;
			}
			else
			{
				DC.type = 2;
			}
			PatternData.DotCoordinates.push(DC);
			idx++;
		}
		
	PatternData.RelaxState = 0;
}

// --------------------------------------------------
// 'shake' pattern by randomly varying the dot positions
// --------------------------------------------------
function shakePattern(strength)
{
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
				if (j != i)
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
// render pattern symbol
// --------------------------------------------------
function render_symbol(pattern, sym, symc, px_align)
{
	for (var i=0; i < PatternData.DotCoordinates.length; i++)
	{
		var cx = PatternData.DotCoordinates[i].x;
		var cy = PatternData.DotCoordinates[i].y;

		var snb = Math.floor(Math.random()*sym.length);

		if (px_align)
		{
			cx = Math.round(cx-0.5);
			cy = Math.round(cy-0.5);
		}

		if (symc.length > 0)
			pattern.append(symc[snb].use().attr({x: cx, y: cy}));
		pattern.append(sym[snb].use().attr({x: cx, y: cy}));

		if (cx < PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern.append(symc[snb].use().attr({x: (cx+PatternData.GridSize), y: cy}));
			pattern.append(sym[snb].use().attr({x: (cx+PatternData.GridSize), y: cy}));
			if (cy < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy+PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy+PatternData.GridSize)}));
			}
			else if (cy > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy-PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy-PatternData.GridSize)}));
			}
		}
		else if (cx > PatternData.GridSize-PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern.append(symc[snb].use().attr({x: (cx-PatternData.GridSize), y: cy}));
			pattern.append(sym[snb].use().attr({x: (cx-PatternData.GridSize), y: cy}));
			if (cy < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy+PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy+PatternData.GridSize)}));
			}
			else if (cy > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy-PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy-PatternData.GridSize)}));
			}
		}

		if (cy < PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern.append(symc[snb].use().attr({x: cx, y: (cy+PatternData.GridSize)}));
			pattern.append(sym[snb].use().attr({x: cx, y: (cy+PatternData.GridSize)}));
			if (cx < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy+PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy+PatternData.GridSize)}));
			}
			else if (cx > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy+PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy+PatternData.GridSize)}));
			}
		}
		else if (cy > PatternData.GridSize-PatternData.DotRadius)
		{
			if (symc.length > 0)
				pattern.append(symc[snb].use().attr({x: cx, y: (cy-PatternData.GridSize)}));
			pattern.append(sym[snb].use().attr({x: cx, y: (cy-PatternData.GridSize)}));
			if (cx < PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy-PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx+PatternData.GridSize), y: (cy-PatternData.GridSize)}));
			}
			else if (cx > PatternData.GridSize-PatternData.DotRadius)
			{
				if (symc.length > 0)
					pattern.append(symc[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy-PatternData.GridSize)}));
				pattern.append(sym[snb].use().attr({x: (cx-PatternData.GridSize), y: (cy-PatternData.GridSize)}));
			}
		}
	}
}

// --------------------------------------------------
// render pattern as SVG
// --------------------------------------------------
function render(px_align)
{
	s.select('defs').selectAll('g').remove();
	s.select("#Pattern").selectAll('*').remove();

	var sym = [];
	var symc = [];

	var rrotate_cnt = 1;

	if ($('#B_rrotate').is(':checked'))
		rrotate_cnt = 13;

	if ($("#code_multi").is(':visible'))
	{
		var c = 0;
		for (var i=0; i < code_multi_cnt; i++)
		for (var j=0; j < rrotate_cnt; j++)
		{
			if ($("#code"+i).is(':visible'))
			{
				var f = Snap.parse($('#code'+i).val());
				sym.push(s.g());
				sym[c].toDefs();
				sym[c].append(f);
				if (j > 0)
					sym[c].transform("rotate("+(j*360/rrotate_cnt)+") scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");
				else
					sym[c].transform("scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");

				if ($('#B_casing').is(':checked'))
				{
					var f2 = Snap.parse($('#code'+i).val());
					symc.push(s.g());
					symc[c].attr({stroke: "#ffffff", strokeWidth: CasingWidth/parseFloat($('#sym_scale').val())});
					symc[c].toDefs();
					symc[c].append(f2);
					if (j > 0)
						symc[c].transform("rotate("+(j*360/rrotate_cnt)+") scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");
					else
						symc[c].transform("scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");
				}
				c++;
			}
		}
	}
	else
	{
		for (var j=0; j < rrotate_cnt; j++)
		{
			var f = Snap.parse($('#code').val());
			sym.push(s.g());
			sym[j].toDefs();
			sym[j].append(f);
			if (j > 0)
				sym[j].transform("rotate("+(j*360/rrotate_cnt)+") scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");
			else
				sym[j].transform("scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");

			if ($('#B_casing').is(':checked'))
			{
				var f2 = Snap.parse($('#code').val());
				symc.push(s.g());
				symc[j].attr({stroke: "#ffffff", strokeWidth: CasingWidth/parseFloat($('#sym_scale').val())});
				symc[j].toDefs();
				symc[j].append(f2);
				if (j > 0)
					symc[j].transform("rotate("+(j*360/rrotate_cnt)+") scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");
				else
					symc[j].transform("scale("+$('#sym_scale').val()+") translate("+(0-$('#offset_x').val())+", "+(0-$('#offset_y').val())+")");
			}
		}
	}

	var g = s.select("#Pattern");

	render_symbol(g, sym, symc, px_align);

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
}

$(document).ready(function () {

	if (PatternData.GridSizeS > 0)
		$('#B_relaxS').show();

	$('#B_generate').click(function() {
		generatePattern();
		updateDisplay();
	});

	$('.sz-switch').click(function() {
    $('.sz-switch').removeClass("active").addClass("inactive");
    $(this).removeClass("inactive").addClass("active");
    reset(parseInt($(this).attr("id").split("_")[1]));
	});

	$('#B_relax').click(function() {
		if (typeof window.Worker === "function")
		{
			$('#msg').text("relaxing...");
			worker = new Worker('relax_ww.js');
			worker.onmessage = function (event) {
				if (event.data.length > 100)
				{
					PatternData = JSON.parse(event.data);
					$('#msg').text("");
					updateDisplay();
				}
				//else
				//	console.log(event.data);
			};
			worker.postMessage(JSON.stringify({step:0.02, metric:$('#metric').val(), data:PatternData}));

			for (var i=0; i < 25; i++)
			{
				worker.postMessage("step");
			}

			worker.postMessage("stop");
		}
		else
		{
			for (var i=0; i < 25; i++)
			{
				relaxStep(0.02, parseInt($('#metric').val()));
			}
			updateDisplay();
		}
	});

	$('#B_relax10').click(function() {
		if (typeof window.Worker === "function")
		{
			$('#msg').text("relaxing...");
			worker = new Worker('relax_ww.js');
			worker.onmessage = function (event) {
				if (event.data.length > 100)
				{
					PatternData = JSON.parse(event.data);
					$('#msg').text("");
					updateDisplay();
				}
				//else
				//	console.log(event.data);
			};
			worker.postMessage(JSON.stringify({step:0.02, metric:$('#metric').val(), data:PatternData}));

			for (var i=0; i < 250; i++)
			{
				worker.postMessage("step");
			}

			worker.postMessage("stop");
		}
		else
		{
			for (var i=0; i < 250; i++)
			{
				relaxStep(0.02, parseInt($('#metric').val()));
			}
			updateDisplay();
		}
	});

	$('#B_relaxS').click(function() {
		for (var i=0; i < 25; i++)
		{
			relaxStepS(0.02, parseInt($('#metric').val()));
		}
		updateDisplay();
	});

	$('#B_shake').click(function() {
		shakePattern(0.3);
		updateDisplay();
	});

	$('#B_render').click(function() {
		render(false);
	});

	$('#B_prender').click(function() {
		render(true);
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

	$('#B_load').click(function() {
		if (typeof(SelSyms[$("#SelSymbol").val()].svg) === "string")
		{
			$("#code").text(SelSyms[$("#SelSymbol").val()].svg);
			$("#code_single").show();
			$("#code_multi").hide();			
		}
		else
		{
			for (var i=0; i < SelSyms[$("#SelSymbol").val()].svg.length; i++)
			{
				if (i >= code_multi_cnt)
				{
					$("#code_multi").append('<textarea name="code'+i+'" id="code'+i+'" rows="2" cols="80" title="enter SVG code for the symbol here"></textarea>');
					code_multi_cnt++;
				}
				else
					$("#code"+i).show();

				$("#code"+i).text(SelSyms[$("#SelSymbol").val()].svg[i]);
				if (i == 0) $("#code").text(SelSyms[$("#SelSymbol").val()].svg[i]);
			}
			for (var i=SelSyms[$("#SelSymbol").val()].svg.length; i < code_multi_cnt; i++) $("#code"+i).hide();
			$("#code_single").hide();
			$("#code_multi").show();	
		}
	});

	for (var i=0; i < SelSyms.length; i++)
		$("#SelSymbol").append("<option value='"+i+"'>"+SelSyms[i].name+"</option>");

	$("#code").text(SelSyms[$("#SelSymbol").val()].svg);

	reset(GridSize);

	st = Snap("#Svg_Test");

});
