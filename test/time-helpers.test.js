import { expect } from 'chai'
import moment from 'moment'

import { normalizeTime, calculateMinutesFromNow } from 'src/ui/time-helpers'

describe('time helpers', () => {
  const fmt = 'YYYY-MM-DDTHH:mm:ss'
  
  describe('normalizeTime', () => {
    it('should convert times in the past into today', () => {
      const now = moment('2016-11-01T11:00:00')
      const time = moment('2016-01-01T12:00:00')
      
      const result = normalizeTime(time, now)
      
      expect(result.format(fmt)).to.equal('2016-11-01T12:00:00')
    })
    
    it('should convert times in the future into today', () => {
      const now = moment('2016-11-01T11:00:00')
      const time = moment('2017-11-02T12:00:00')
      
      const result = normalizeTime(time, now)
      
      expect(result.format(fmt)).to.equal('2016-11-01T12:00:00')
    })
    
    it('should convert times to tomorrow if converting to today would mean they were in the past', () => {
      const now = moment('2016-11-01T11:00:00')
      const time = moment('2016-10-01T07:00:00')
      
      const result = normalizeTime(time, now)
      
      expect(result.format(fmt)).to.equal('2016-11-02T07:00:00')
    })
  })

  describe('calculateMinutesFromNow', () => {
    it('should get the correct number of minutes for a future date', () => {
      const now = moment('2016-11-01T11:00:00')
      const time = moment('2016-11-01T12:30:00')
      
      const result = calculateMinutesFromNow(time, now)
      
      expect(result).to.equal(90)
    })

    it('should normalize the time first', () => {
      const now = moment('2016-11-01T11:00:00')
      const time = moment('2016-10-01T12:30:00')
      
      const result = calculateMinutesFromNow(time, now)
      
      expect(result).to.equal(90)
    })
  })
})