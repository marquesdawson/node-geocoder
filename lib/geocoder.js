'use strict';

var BPromise = require('bluebird');

/**
* Constructor
* @param <object> geocoder  Geocoder Adapter
* @param <object> formatter Formatter adapter or null
*/
var Geocoder = function (geocoder, formatter) {
  this._geocoder = geocoder;
  this._formatter = formatter;
};

/**
* Geocode a value (address or ip)
* @param <string>   value    Value to geocoder (address or IP)
* @param <function> callback Callback method
*/
Geocoder.prototype.geocode = function (value, callback) {
  return BPromise.resolve()
    .bind(this)
    .then(function() {
      return BPromise.fromCallback(function(callback) {
        this._geocoder.geocode(value, callback);
      }.bind(this));
    })
    .then(function(data) {
      return this._filter(value, data);
    })
    .then(function(data) {
      return this._format(data);
    })
    .asCallback(callback);
};

/**
* Reverse geocoding
* @param {lat:<number>,lon:<number>}  lat: Latitude, lon: Longitude
* @param {function} callback Callback method
*/
Geocoder.prototype.reverse = function(query, callback) {

  return BPromise.resolve()
    .bind(this)
    .then(function() {
      return BPromise.fromCallback(function(callback) {
        this._geocoder.reverse(query, callback);
      }.bind(this));
    })
    .then(function(data) {
      return this._format(data);
    })
    .asCallback(callback);
};

/**
* Batch geocode
* @param <array>    values    array of Values to geocode (address or IP)
* @param <function> callback
*
* @return promise
*/
Geocoder.prototype.batchGeocode = function(values, callback) {
  return BPromise.resolve(values)
    .bind(this)
    .map(function(value) {
      return this.geocode(value)
        .then(function(value) {
          return {
            error: null,
            value: value
          };
        })
        .catch(function(error) {
          return {
            error: error,
            value: null
          };
        });
    })
    .asCallback(callback);
};

Geocoder.prototype._filter = function (value, data) {
  if (!data || !data.length) {
    return data;
  }

  if (value.minConfidence) {
    data = data.filter(function(geocodedAddress) {
      if (geocodedAddress.extra && geocodedAddress.extra.confidence) {
        return geocodedAddress.extra.confidence >= value.minConfidence;
      }
    });
  }

  return data;
};

Geocoder.prototype._format = function (data) {
  var _this = this;
  return BPromise.resolve()
    .bind(this)
    .then(function() {
      if (!data) {
        return data;
      }

      Object.defineProperty(data,'raw',{configurable:false, enumerable:false, writable:false});

      data = data.map(function(result) {
        result.provider = _this._geocoder.name;

        return result;
      });

      return data;
    })
    .then(function(data) {
      var _data = data;
      if (this._formatter && this._formatter !== 'undefined') {
        _data = this._formatter.format(_data);
      }

      return _data;
    });
};

module.exports = Geocoder;
