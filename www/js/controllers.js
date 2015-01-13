angular.module('buurtmeter.controllers', [])

.controller('MapController', function($scope) {
    $scope.map = {
        defaults: {
            tileLayer: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
            maxZoom: 18,
            zoomControlPosition: 'bottomleft',
            path: {
                weight: 10,
                color: '#800000',
                opacity: 1
            }
        },
        center: {
			autoDiscover: true,
            lat: 51.221311,
            lng: 4.399160,
            zoom: 16
        }
    };
})

.controller('DataController', function($scope, AreaService) {
	$scope.areas = AreaService.all();
});
