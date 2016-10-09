import angular from 'angular'
import deepIs from 'deep-is'
import clone from 'clone'
import moment from 'moment'

const app = angular.module('switch-app', [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q) {
      return {
        'response': function(response) { 
          return response
        },
        'responseError': function(response) {
          return $q.reject(response)
        }
      }
    })
  })

app.controller('SwitchAppController', function($scope, $http, $interval, $timeout) {
  $scope.loading = true
    
  //
  // Gets a description of when a switch will be turning off relative to now.
  // E.G. "in an hour"
  //
  $scope.getTimerDescription = function() {
    if(!this.switch.timer) return null
    return moment(Date.parse(this.switch.timer.at)).fromNow()
  }
  
  $scope.getStateColor = function() {
    switch(this.switch.state.currently) {
      case 'on': return this.switch.unplugged ? 'red' : 'green'
      case 'turning on': return 'orange'
      default: return 'grey'
    }
  }
  
  $scope.getStateDescription = function() {
    if(this.switch.state.currently == 'on' && this.switch.unplugged) {
      return 'on, unplugged'
    }
    
    return this.switch.state.currently
  }
  
  $scope.canToggle = function() {
    switch(this.switch.state.currently) {
      case 'turning on':
      case 'turning off':
        return false
    }
    
    return true
  }
  
  $scope.canExtend = function() {
    return this.switch.state.currently == 'on' && this.switch.timer != null
  }
  
  $scope.setLoadingWhile = function(promise) {
    $scope.loading = true
    promise.then(() => $scope.loading = false)
  }
  
  {
    let switches = {}
    $scope.reload = function() {
      $http.get($scope.api.links.switches).then(function(response) {
        if(deepIs(switches, response.data)) {
          return
        }
        
        switches = response.data
        $scope.switches = clone(switches) // Have to clone because Angular modifies our objects
        $scope.loading = false
      })
    }
  }

  $scope.toggle = function() {
    const newState = this.switch.state.currently == 'off' ? 'on' : 'off'
    
    const url = this.switch.links[newState]
    $scope.setLoadingWhile(
      $http.post(url).then(response => {
        this.switch = response.data
        $timeout($scope.reload, 1000)
      })
    )
  }
  
  $scope.extend = function() {
    const url = this.switch.links[`timer/${this.switch.timer.turn}`]
    this.setLoadingWhile(
      $http.post(url).then(response => {
        this.switch = response.data
      })
    )
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
