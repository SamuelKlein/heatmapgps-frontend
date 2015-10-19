// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers'])

.constant('ApiEndpoint', {
  //url: 'http://localhost:8100/api'
  //url: 'http://192.168.0.14:8080/hm'
  url: 'http://159.203.86.79/hm'
})

.run(function($ionicPlatform, Auth) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})

.config(function($stateProvider, $httpProvider, $urlRouterProvider, $ionicConfigProvider) {
    
    // We need to setup some parameters for http requests
    // These three lines are all you need for CORS support
    
    $httpProvider.defaults.useXDomain = true;

    //Remove the header containing XMLHttpRequest used to identify ajax call 
    //that would prevent CORS from working
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $ionicConfigProvider.views.maxCache(0);

    $stateProvider
    
    .state('login', {
        url: "/",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl'
    })

    .state('menu', {
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'MenuCtrl'
    })

    .state('menu.rota', {
        url: "/rota",
        views: {
            'menuContent': {
                templateUrl: "templates/rota.html",
                controller: 'RotaController'
            }
        }
    })

    .state('menu.map', {
      url: "/map",
      views: {
        'menuContent' : {
          templateUrl: "templates/map.html", 
          controller: 'MapController' 
        }
      }
    });

    $urlRouterProvider.otherwise('/');
});
