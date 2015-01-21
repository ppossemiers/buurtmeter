// TODO :
// 1/ Formula areas
// 2/ Splash screen

angular.module('buurtmeter.controllers', ['leaflet-directive'])

.controller('MapController', function($scope, $timeout, AreaService, StorageService, CameraService){

	var cameraOptions = {
		destinationType : 1, // 0 : base64-encoded, 1 : image file URI, 2 : image native URI
		sourceType : 2, // 0 : PHOTOLIBRARY, 1 : CAMERA, 2 : SAVEDPHOTOALBUM
		//quality: 90, // less than 50 to avoid memory problems for older iPhones
		encodingType: 1, // 0 : jpeg, 1 : png
		correctOrientation: true, // rotate the image to correct for the orientation of the device during capture
		//targetWidth: 100,
		//targetHeight: 100,
		saveToPhotoAlbum: true
	};

	var center = StorageService.getObject('center');
	if(JSON.stringify(center) == '{}'){
		center.lat = 51.221311;
		center.lng = 4.399160;
	}

    var map = {
        defaults: {
        	// MapQuest
        	tileLayer: 'http://otile4.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
        	// OpenStreetMap
            //tileLayer: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
            maxZoom: 20,
            zoomControl: false,
            doubleClickZoom: false,
            scrollWheelZoom: true,
            touchZoom: true,
            path: {
                weight: 10,
                color: '#800000',
                opacity: 1
            }
        },
        markers: StorageService.getObject('mapMarkers'),
        center: {
            lat: center.lat,
            lng: center.lng,
            zoom: 17
        }
    };

	$scope.map = map;
	$scope.markerCount = $scope.map.markers.length;

	// normal click
	$scope.$on('leafletDirectiveMap.click', function(event, locationEvent){
		setTimeout(addMarker(locationEvent), 1000);
	});

	// double click
	// $scope.$on('leafletDirectiveMap.dblclick', function(event, locationEvent){ });

	// right-click
	$scope.$on('leafletDirectiveMap.contextmenu', function(event, locationEvent){
		$scope.map.markers = [];
    	$scope.markerCount = 0;
    	StorageService.setObject('mapMarkers', $scope.map.markers);
	});

	locate = function(){
		navigator.geolocation.getCurrentPosition(function(position){
			var center = {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
				zoom : 17
			};
			$timeout(function(){
        		$scope.map.center = center;
    		}, 3000);
			StorageService.setObject('center', center);
		}, function(err){ console.log(err); });
	};

	/* http://alienryderflex.com/polygon/
	The basic idea is to find all edges of the polygon that span the 'x' position of the point you're testing against. 
	Then you find how many of them intersect the vertical line that extends above your point. If an even number cross above the point, 
	then you're outside the polygon. If an odd number crosses above, then you're inside. */
	inPolygon = function(location, polyLoc){
		var lastPoint = polyLoc[polyLoc.length-1];
		var isInside = false;
		var x = location[0];

		for(var i = 0; i < polyLoc.length; i++){
			var point = polyLoc[i];
			var x1 = lastPoint[0];
			var x2 = point[0];
			var dx = x2 - x1;
			
			if(Math.abs(dx) > 180.0){
				if(x > 0){
					while(x1 < 0)
						x1 += 360;
					while(x2 < 0)
						x2 += 360;
				}
				else{
					while(x1 > 0)
						x1 -= 360;
					while(x2 > 0)
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
	};
	
	getAreaScore = function(lat, lng){
		var x = ((lat / 3) + (lng / 10)) * Math.random() * 10;
		return Math.round(x * 100) / 100;
	};

	addMarker = function(locationEvent){
		var lat = locationEvent.leafletEvent.latlng.lat;
		var lng = locationEvent.leafletEvent.latlng.lng;
		var areas = AreaService.all();
		for(var i = 0; i < areas.length; i++){
			var geometry = JSON.parse(areas[i].geometry);
			var coordinates = geometry.coordinates[0];
			if(inPolygon([lng, lat], coordinates)){
				var msg = '<b>' + areas[i].wijknaam + '</b><div>' + 'Score : ' + getAreaScore(lat, lng) + '</div>';
				var marker = {
			        lat: lat,
			        lng: lng,
			        message: msg,
					focus: true,
					draggable: false
				};
				updateMap = function(){
			        $scope.map.markers[$scope.markerCount] = marker;
			        $scope.markerCount += 1;
			        StorageService.setObject('mapMarkers', $scope.map.markers);
				};
				CameraService.getPicture(cameraOptions).then(function(imageURI){
			    	var img = document.createElement('img');
			    	var canvas = document.createElement('canvas');
			        var ctx = canvas.getContext('2d');
					canvas.width = 100;
			        canvas.height = 100;
			        img.onload = function(){        
			            ctx.drawImage(this, 0, 0, 100, 100);
			     		marker.message += '<br><div><center><img src=' + canvas.toDataURL() + '></center>';
			     		// Dunno why, but timeout necessary for update of map
						$timeout(updateMap(), 500);
			        };
			        img.src = imageURI;
	    		}, function(err){
	    			updateMap();
	    		});
	    		break;
			}
		}
	};
})

.controller('DataController', function($scope, DataSetService, StorageService){
	$scope.allDataSets = DataSetService.all();
	$scope.savedValues = StorageService.getObject('savedValues');
	if(JSON.stringify($scope.savedValues) == '{}'){
		for(var i = 0; i < $scope.allDataSets.length; i++){
			$scope.savedValues[$scope.allDataSets[i].name] = {'used':false, 'range':5};
		}
		StorageService.setObject('savedValues', $scope.savedValues);
	}

  	$scope.saveRange = function(){
    	StorageService.setObject('savedValues', $scope.savedValues);
  	}

	$scope.download = function(set){
	    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
	        fs.root.getDirectory(
	            'Buurtmeter',
	            {
	                create: true
	            },
	            function(dirEntry) {
	                dirEntry.getFile(
	                    set.name + '.json',
	                    {
	                        create: true,
	                        exclusive: false
	                    },
	                    function gotFileEntry(fe){
	                        var p = fe.toURL();
	                        fe.remove();
	                        ft = new FileTransfer();
	                        ft.download(
	                            encodeURI(set.url),
	                            p,
	                            function(entry){
	                                //alert(entry.toURL());
	                            },
	                            function(error){
	                                alert(error.source);
	                            },
	                            false, null
	                        );
	                    },
	                    function(){
	                        alert('Fout bij ophalen dataset');
	                    }
	                );
	            }
	        );
	    },
	    function(){
	        alert('Fout bij ophalen filesysteem');
	    });
	}

	$scope.load = function(set){
		StorageService.setObject('savedValues', $scope.savedValues);
	    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
	        fs.root.getDirectory(
	            'Buurtmeter',
	            {
	                create: true
	            },
	            function(dirEntry){
	                dirEntry.getFile(
	                    set.name + '.json',
	                    {
	                        create: false,
	                        exclusive: false
	                    },
	                    function gotFileEntry(fe){
	                        fe.file(function(file){
								var reader = new FileReader();
								reader.onloadend = function(e){
									//alert(this.result);
								}
								reader.readAsText(file);
							});
	                    },
	                    function(error){
	                        $scope.download(set);
	                    }
	                );
	            }
	        );
	    },
	    function(){
	        alert('Fout bij ophalen filesysteem');
	    });
	}
});
