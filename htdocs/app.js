var app = angular.module("app", []);

app.controller("AppController", function($scope, $http) {
  $scope.loading = true;
  
  $http.get("/api/switches").then(function(response) {
    $scope.loading = false;
    $scope.switches = response.data;
  });
  
  $scope.toggle = function() {
    var $this = this;
    var newState = $this.switch.state == "off" ? "on" : "off";
    
    $scope.changingSwitch = {
      label: $this.switch.label,
      to: newState
    };
    
    var url = $this.switch.links[newState];
    $http.put(url).then(function(response) {
      $http.get($this.switch.links.self).then(function(response) {
        $scope.changingSwitch = null;
        $this.switch = response.data;
      });
    });
  }
});