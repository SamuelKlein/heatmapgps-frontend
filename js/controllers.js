angular.module('starter.controllers', ['starter.services', 'starter.factories'])

.controller('MenuCtrl', function($scope, $location, Auth) {
    if (!Auth.hasUser()) {
        //manda para o login
        Auth.clearUser();
        $location.path('/');
    }
})

.controller('LoginCtrl', function($scope, $location, $ionicLoading, Auth) {
    // Form data for the login modal
    $scope.loginData = {};
    Auth.clearUser();

    $scope.doLogin = function() {
        $ionicLoading.show({
            content: 'Entrando...',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });

        Auth.doLogin($scope.loginData, function(descErro) {
            $scope.msgErr = null;
            try{
                if (!Auth.hasUser()) {
                    $location.path('/');
                    $scope.msgErr = "Usuário ou senha incorretos";
                } else {
                    $location.path('/map');
                }
                $scope.loginData = {};
            }catch(e){
               $scope.msgErr = descErro;
            } finally {
                $ionicLoading.hide();
            }
        });
    }

})

.controller('MapController', function($scope,
    $window,
    $ionicModal,
    MapFactory,
    OcorrenciaService,
    BairroService) {

    var reloadMap = function(data) {
        var map = MapFactory.init();

        var pinIcon = new google.maps.MarkerImage(
            "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|CCCCAA",
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            new google.maps.Size(8, 8)
        );

        var points = [];

        for (var i = 0; i < data.length; i++) {
            var cor = JSON.parse(data[i].jsonLocal).coordinates;
            console.log('lat:' + cor[1] + ',lng:' + cor[0]);

            var latlng = new google.maps.LatLng(cor[1], cor[0]);

            //new google.maps.Marker({
            //        position: latlng,
            //        map: map,
            //        icon: pinIcon
            //    });

            points.push(latlng);
        };

        var pointArray = new google.maps.MVCArray(points);

        heatmap = new google.maps.visualization.HeatmapLayer({
            data: pointArray
        });

        var gradient = [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
        ];

        heatmap.setOptions({
            dissipating: true,
            maxIntensity: 30,
            radius: 20,
            opacity: 1,
            gradient: gradient
                //dissipating: false
        });

        heatmap.setMap(map);

        google.maps.event.addDomListener($window, 'load', map);
    };

    $scope.startMap = function() {
        OcorrenciaService.load(reloadMap);
    }

    $ionicModal.fromTemplateUrl('filtroHeatMap.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        // $scope.descricaoFatos = [];
        // $scope.bairros = [];
        $scope.modal = modal;
    })

    $scope.submit = function(filter) {
        OcorrenciaService.load(reloadMap, filter);
        $scope.closeModal();
    };

    $scope.openModal = function() {
        OcorrenciaService.descricaoFatos(function(data){
            $scope.descricaoFatos = data;
        });

        BairroService.todosBairros(function(data){
            $scope.bairros = data;
        });

        $scope.modal.show();
    };

    $scope.closeModal = function() {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
})

.controller('RotaController', function($scope,
                                       $window,
                                       $ionicPopup,
                                       $state,
                                       $ionicLoading,
                                       MapFactory,
                                       RotaFactory,
                                       OcorrenciaService,
                                       Auth,
                                       ApiEndpoint) {
    var watch = null;
    var policeLocation = null;
    var map = MapFactory.init('mapRoute');

    //var sessionUser = Auth.getUser();

    $scope.$on('$ionicView.beforeLeave', function(){
        if(watch != null)
          navigator.geolocation.clearWatch(watch);
    });

    var reloadMap = function(data) {
        watch = MapFactory.phonePosition(function(position){
            var pinIcon = new google.maps.MarkerImage(
                ApiEndpoint.url + "/img/car-pol.png",
                null, /* size is determined at runtime */
                null, /* origin is 0,0 */
                null, /* anchor is bottom center of the scaled image */
                new google.maps.Size(72, 72)
            );

            if(policeLocation == null){
                policeLocation = new google.maps.Marker({
                   position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                   map: map,
                   icon: pinIcon
                });

                map.panTo(policeLocation.position);
                map.setZoom(16);

            } else {
                policeLocation.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
            }

            //google.maps.event.addDomListener($window, 'load', map);
        }, function(error) {
            console.log(error);
        });
    };

    $scope.startMap = function() {
        try{
            cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
                if(enabled){
                    reloadMap();     
                } else {
                    alert("GPS deve estar ativo!\nAtive-o nas configurações do aparelho e tente novamente.");    
                    $state.go('menu.map', {cache:true});
                }
            }, function(error){
                alert("The following error occurred: "+error);
            });
        }catch(e){
            reloadMap();
        }
    }

    $scope.showPopup = function() {
        
        //GPS do aparelho deve estar Ligado

        if(!policeLocation){
            alert('Nenhuma posição de inicio válida encontrada.');
            return;
        }

        navigator.geolocation.clearWatch(watch);

        $scope.dataPop = {}

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<input type="number" ng-model="dataPop.distancia">',
            title: 'Distância da Rota',
            subTitle: 'Informe em Quilômetros (KM)',
            scope: $scope,
            buttons: [{
                text: 'Cancelar',
                onTap: function(e) {
                    myPopup.close();
                }
            }, {
                text: '<b>Gerar</b>',
                type: 'button-positive',
                onTap: function(e) {
                    if (!$scope.dataPop.distancia) {
                        e.preventDefault();
                    } else {
                        return $scope.dataPop.distancia;
                    }
                }
            }]
        });

        myPopup.then(function(res) {
            if(res) {
                $ionicLoading.show({
                        content: 'Gerando Rota',
                        showBackdrop: true,
                        maxWidth: 200,
                        showDelay: 0
                    });

                try {
                    OcorrenciaService.pontosRotaSol(Auth.getUser(), 
                                                    //lat,log
                                                    policeLocation.position.lat(),
                                                    policeLocation.position.lng(),
                                                    res, 
                                                    function(data){
                        RotaFactory.calculate(map, data, policeLocation);
                    });
                }
                finally {
                    $ionicLoading.hide();
                }
            } else {
                policeLocation = null;
                reloadMap();
            }

        });
    };

});
