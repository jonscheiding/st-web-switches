var app = angular.module("switch-app", [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        'responseError': function(response) {
          if(response.status == 401) {
            $rootScope.authorizationMissing = true;
            $rootScope.loading = false;
          }
          return $q.reject(response);
        }
      };
    });
  });

app.controller("SwitchAppController", function($scope, $http, $window, $interval, $timeout) {
  $scope.loading = true;
  
  $scope.reload = function() {
    $http.get($scope.api.links.switches).then(function(response) {
      $scope.loading = false;
      $scope.switches = response.data;
    });
  };
  
  $scope.authorize = function() {
    $window.location.href = "/authorize";
  };
  
  $scope.switchOffWhen = function() {
    if(this.switch.state.is != "on" || !this.switch.state.until) {
      return;
    }
    
    return moment(this.switch.state.until).fromNow();
  }
  
  $scope.toggle = function() {
    var $this = this;
    var newState = $this.switch.state.is == "off" ? "on" : "off";
    
    $scope.changingSwitch = {
      label: $this.switch.label,
      to: newState
    };
    
    var url = $this.switch.links[newState];
    $http.put(url).then(function(response) {
      $scope.changingSwitch = null;
      $this.switch = response.data;
      
      $timeout($scope.reload, 1000);
    });
  }
  
  $http.get("/api").then(function(response) {
    $scope.api = response.data;
    $scope.reload();
    $interval($scope.reload, 5000);
  });
});