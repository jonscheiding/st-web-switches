var app = angular.module("app", []);

app.controller("AppController", function($scope, $http) {
  $http.get("/api/switches").then(function(response) {
    $scope.switches = response.data;
  })
});