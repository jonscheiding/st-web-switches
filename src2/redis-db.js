import client from 'redis-js'
import redis from 'redis'

client.mset('smartapp-base-url', 'https://graph.api.smartthings.com/api/smartapps/installations/2b520eaf-eabe-4a98-a6b9-25eb0226a4d8', 'smartapp-access-token', 'c352e5bc-e60e-4adc-a7b7-1704fc4da4b4', redis.print)

export default client