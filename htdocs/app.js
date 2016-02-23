var app = angular.module("app", []);

app.controller("AppController", function($scope, $http) {
  $http.get("/api/switches").then(function(response) {
    $scope.switches = response.data;
  });
  
  $scope.toggle = function() {
    var $scope = this;
    var url = $scope.switch.links[$scope.switch.state == "off" ? "on" : "off"];
    $http.put(url).then(function(response) {
      $http.get($scope.switch.links.self).then(function(response) {
        $scope.switch = response.data;
      })
    })
  }
});