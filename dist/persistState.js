(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'lodash/get', 'lodash/set', 'lodash/debounce', '@virtuous/logger', './adapters/LocalStorageAdapater'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('lodash/get'), require('lodash/set'), require('lodash/debounce'), require('@virtuous/logger'), require('./adapters/LocalStorageAdapater'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.get, global.set, global.debounce, global.logger, global.LocalStorageAdapater);
    global.persistState = mod.exports;
  }
})(this, function (exports, _get, _set, _debounce, _logger, _LocalStorageAdapater) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.persistState = persistState;

  var _get2 = _interopRequireDefault(_get);

  var _set2 = _interopRequireDefault(_set);

  var _debounce2 = _interopRequireDefault(_debounce);

  var _LocalStorageAdapater2 = _interopRequireDefault(_LocalStorageAdapater);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  var defaultPaths = [];

  function getSubset(state) {
    var paths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultPaths;

    if (!paths.length) {
      return state;
    }

    var subset = {};

    paths.forEach(function (entry) {
      (0, _set2.default)(subset, entry, (0, _get2.default)(state, entry));
    });

    return subset;
  }

  function persistState(config) {
    var _config$key = config.key,
        key = _config$key === undefined ? 'redux' : _config$key,
        _config$paths = config.paths,
        paths = _config$paths === undefined ? [] : _config$paths,
        _config$adapter = config.adapter,
        adapter = _config$adapter === undefined ? _LocalStorageAdapater2.default : _config$adapter,
        _config$logEngine = config.logEngine,
        logEngine = _config$logEngine === undefined ? _logger.logger : _config$logEngine;


    return function handleCreateStore(createStore) {
      return function (reducer, initialState, enhancer) {
        var finalInitialState = initialState;

        adapter.get(key, function (error, value) {
          if (error) {
            logEngine.warn('Unable to persist state to localStorage:', error);
            return;
          }

          finalInitialState = _extends({}, initialState, value);
          (0, _logger.group)('redux-persister %cLoaded persistent state', value, 'gray');
        });

        var store = createStore(reducer, finalInitialState, enhancer);

        store.subscribe(function () {
          var state = store.getState();
          var subset = getSubset(state, paths);

          adapter.set(key, subset, (0, _debounce2.default)(function (error) {
            if (error) {
              logEngine.warn('Unable to persist state to localStorage:', error);
            }
          }, 100));
        });

        return store;
      };
    };
  }
});