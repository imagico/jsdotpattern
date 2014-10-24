
var PatternData;
var step = 0.02;
var metric = 2;


// --------------------------------------------------
// relax dot pattern with periodic bounds
// --------------------------------------------------
function relaxStep_ww(step, metric)
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

self.addEventListener('message', function(e) {
  var data = e.data;
	if (typeof(data) === "string")
		if (data.length > 100)
			data = JSON.parse(data);
	if (typeof(data) === "string")
	{
		switch (data) {
    case 'step':
      self.postMessage('doing relax step');
			relaxStep_ww(step, metric);
      self.postMessage('done relax step');
      break;
    case 'stop':
			self.postMessage(JSON.stringify(PatternData));
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('unknown command: ' + data);
		};
	}
	else
	{
		PatternData = data.data;
		step = data.step;
		metric = data.metric;
		self.postMessage("data transferred "+e.data.length);
	}
}, false);
