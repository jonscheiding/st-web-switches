import angular from 'angular'

import logger from 'src/logger'
import { MainController } from './controllers'

const app = angular.module('switch-app', ['ngMaterial'])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q) {
      return {
        'response': function(response) { 
          logger.debug({obj: {response}}, 'API response received.')
          return response
        },
        'responseError': function(response) {
          return $q.reject(response)
        }
      }
    })
  })

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .accentPalette('indigo')
})

app.controller('SwitchAppController', MainController)

