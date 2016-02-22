var app = angular.module("heaters", []);

app.controller("HeatersController", function($scope, $http) {
  $http.get("/api/switches").then(function(response) {
    $scope.switches = response.data;
  })
});