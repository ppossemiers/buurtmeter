angular.module('buurtmeter.controllers', [])

.controller('MapController', function($scope, AreaService){
    var map = {
        defaults: {
            tileLayer: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
            maxZoom: 20,
            zoomControlPosition: 'bottomleft',
            path: {
                weight: 10,
                color: '#800000',
                opacity: 1
            }
        },
        center: {
			//autoDiscover: true,
            lat: 51.221311,
            lng: 4.399160,
            zoom: 17
        },
    };

	$scope.map = map;
	$scope.markers = new Array();

	/* http://alienryderflex.com/polygon/
		The basic idea is to find all edges of the polygon that span the 'x' position of the point you're testing against. Then you find how many of them intersect the vertical line that extends above your point. If an even number cross above the point, then you're outside the polygon. If an odd number crosses above, then you're inside. */
	function inPolygon(location, polyLoc){
		var lastPoint = polyLoc[polyLoc.length-1];
		var isInside = false;
		var x = location[0];

		for(var i = 0; i < polyLoc.length; i++){
			var point = polyLoc[i];
			var x1 = lastPoint[0];
			var x2 = point[0];
			var dx = x2 - x1;
			
			if(Math.abs(dx) > 180.0){
				if (x > 0) {
					while (x1 < 0)
						x1 += 360;
					while (x2 < 0)
						x2 += 360;
				}
				else{
					while (x1 > 0)
						x1 -= 360;
					while (x2 > 0)
						x2 -= 360;
				}
				dx = x2 - x1;
			}
			
			if((x1 <= x && x2 > x) || (x1 >= x && x2 < x)){
				var grad = (point[1] - lastPoint[1]) / dx;
				var intersectAtLat = lastPoint[1] + ((x - x1) * grad);
			
				if(intersectAtLat > location[1])
					isInside = !isInside;
			}
			lastPoint = point;
		}
		return isInside;
	}
	
	// normal click
	$scope.$on('leafletDirectiveMap.click', function(event, locationEvent){
		var lat = locationEvent.leafletEvent.latlng.lat;
		var lng = locationEvent.leafletEvent.latlng.lng;
		$scope.map.center  = {
			lat: lat,
			lng: lng,
			zoom : 17
		};
		/*$scope.markers.push({
			lat: lat,
			lng: lng,
			message: 'My Added Marker'
		});*/
		var areas = AreaService.all();
		for(var i = 0; i < areas.length; i++){
			var geometry = JSON.parse(areas[i].geometry);
			var coordinates = geometry.coordinates[0];
			if(inPolygon([lng, lat], coordinates)){
			   console.log(areas[i].wijknaam);
			   break;
			}
		}
	});
	// right-click
	$scope.$on('leafletDirectiveMap.contextmenu', function(event, locationEvent){
					   
	});
})

.controller('DataController', function($scope, AreaService){
	$scope.areas = AreaService.all();
});
