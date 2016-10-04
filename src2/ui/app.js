import angular from 'angular'
import moment from 'moment'

const app = angular.module('switch-app', [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        'responseError': function(response) {
          if(response.status == 401) {
            $rootScope.authorizationMissing = true
            $rootScope.loading = false
          }
          return $q.reject(response)
        }
      }
    })
  })

app.controller('SwitchAppController', function($scope, $http, $window, $interval, $timeout) {
  $scope.loading = true
  
  //
  // Refreshes the state of all switches
  //
  $scope.reload = function() {
    $http.get($scope.api.links.switches).then(function(response) {
      $scope.loading = false
      $scope.switches = response.data
    })
  }
  
  //
  // Gets a description of when a switch will be turning off relative to now.
  // E.G. "in an hour"
  //
  $scope.switchOffWhen = function() {
    if(!this.switch.timer) {
      return
    }
    
    return moment(Date.parse(this.switch.timer.at)).fromNow()
  }
  
  //
  // Builds the message for the state bar.  Takes a message to display when
  // the switch is unplugged, and a message to describe when it's turning off.
  // Puts them together with a comma if they both need to be displayed.
  //
  $scope.getStateMessage = function(displayParts) {
    const parts = []
    if(this.getPlugStatus() == 'unplugged') {
      parts.push(displayParts.unplugged)
    }
    if(this.switch.timer) {
      parts.push(displayParts.until)
    }
    
    const message = parts.join(displayParts.joiner)
    return message.firstLetterToUpperCase()
  }
  
  $scope.getPlugStatus = function() {
    if(this.switch.state.currently != 'on') {
      return null
    }
    
    const timeInState = Date.now() - Date.parse(this.switch.state.since)
    
    if(timeInState < 6000) return null
    
    if(this.switch.usage > 0) return 'plugged'
    return 'unplugged'
  }
  
  //
  // Makes an API call to toggle the switch on/off from its current state of
  // off/on.
  //
  $scope.toggle = function() {
    const $this = this
    const newState = $this.switch.state.currently == 'off' ? 'on' : 'off'
    
    const url = $this.switch.links[newState]
    $http.post(url).then(function(response) {
      $scope.changingSwitch = null
      $this.switch = response.data
      
      $timeout($scope.reload, 1000)
    })
  }
  
  //
  // Start everything up by calling the API root so we can get our app info
  // and links to other actions.
  //
  $http.get('/api').then(function(response) {
    $scope.api = response.data
    $scope.reload()
    $interval($scope.reload, 2000)
  })
})

String.prototype.firstLetterToUpperCase = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}