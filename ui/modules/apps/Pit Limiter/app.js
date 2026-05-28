angular.module('beamng.apps')
.directive('pitLimiter', ['$log', function ($log) {
  return {
    template: `
      <div class="pit-container" ng-class="{'collapsed': isCollapsed, 'active': state.isEnabled}">
        <style>
          .pit-container {
            font-family: "Lucida Console", Monaco, monospace, sans-serif;
            background: rgba(0, 0, 0, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            color: #fff;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          }
          
          .pit-container.collapsed {
            height: 38px !important;
            border-color: rgba(255, 255, 255, 0.08);
          }
          
          .pit-header {
            height: 36px;
            min-height: 36px;
            padding: 0 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            user-select: none;
          }
          
          .pit-header:hover {
            background: rgba(255, 255, 255, 0.08);
          }
          
          .pit-title-container {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .pit-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #555;
            display: inline-block;
            transition: background-color 0.2s, box-shadow 0.2s;
          }
          
          .pit-container.active .pit-dot {
            background: #00e5ff;
            box-shadow: 0 0 8px #00e5ff;
          }
          
          .pit-title {
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #aaa;
          }
          
          .pit-container.active .pit-title {
            color: #00e5ff;
          }
          
          .pit-header-right {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .pit-header-limit {
            font-size: 11px;
            color: #00e5ff;
            font-weight: bold;
          }
          
          .pit-collapse-icon {
            font-size: 9px;
            color: #888;
            transition: transform 0.2s;
          }
          
          .pit-container.collapsed .pit-collapse-icon {
            transform: rotate(180deg);
          }
          
          .pit-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            padding: 8px;
            box-sizing: border-box;
            opacity: 1;
            transition: opacity 0.15s;
          }
          
          .pit-container.collapsed .pit-body {
            opacity: 0;
            pointer-events: none;
          }
          
          .pit-speed-display {
            text-align: center;
            padding: 4px 0;
          }
          
          .pit-speed-num {
            font-size: 26px;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
          }
          
          .pit-container.active .pit-speed-num {
            color: #00e5ff;
            text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
          }
          
          .pit-speed-unit {
            font-size: 9px;
            color: #666;
            margin-left: 2px;
            text-transform: uppercase;
          }
          
          .pit-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
          }
          
          .pit-btn {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
            user-select: none;
          }
          
          .pit-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.18);
          }
          
          .pit-btn:active {
            background: rgba(255, 255, 255, 0.2);
          }
          
          .pit-btn-adjust {
            width: 28px;
            height: 28px;
            font-size: 16px;
            font-weight: bold;
          }
          
          .pit-btn-toggle {
            flex: 1;
            height: 28px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          
          .pit-btn-toggle.active {
            background: rgba(0, 229, 255, 0.15);
            border-color: rgba(0, 229, 255, 0.4);
            color: #00e5ff;
          }
          
          .pit-btn-toggle.active:hover {
            background: rgba(0, 229, 255, 0.25);
          }
        </style>
        
        <div class="pit-header" ng-click="toggleCollapse()">
          <div class="pit-title-container">
            <span class="pit-dot"></span>
            <span class="pit-title">PIT LIMIT</span>
          </div>
          <div class="pit-header-right">
            <span class="pit-header-limit" ng-show="isCollapsed">{{ getSpeedDisplay() }} <span style="font-size: 8px; color: #666;">{{ speedUnit }}</span></span>
            <span class="pit-collapse-icon">▲</span>
          </div>
        </div>
        
        <div class="pit-body">
          <div class="pit-speed-display">
            <span class="pit-speed-num">{{ getSpeedDisplay() }}</span>
            <span class="pit-speed-unit">{{ speedUnit }}</span>
          </div>
          
          <div class="pit-controls">
            <button class="pit-btn pit-btn-adjust" ng-mousedown="startAdjust(-1)" ng-mouseup="stopAdjust()" ng-mouseleave="stopAdjust()">-</button>
            <button class="pit-btn pit-btn-toggle" ng-class="{'active': state.isEnabled}" ng-click="toggleLimiter()">
              {{ state.isEnabled ? 'Active' : 'Off' }}
            </button>
            <button class="pit-btn pit-btn-adjust" ng-mousedown="startAdjust(1)" ng-mouseup="stopAdjust()" ng-mouseleave="stopAdjust()">+</button>
          </div>
        </div>
      </div>
    `,
    replace: true,
    restrict: 'EA',
    scope: true,
    link: function (scope, element, attrs) {
      var unitMultiplier = {
        'metric': 3.6,
        'imperial': 2.23694
      };
      var speedStep = 1 / 3.6;
      scope.speedUnit = 'km/h';
      scope.state = { targetSpeed: 50 / 3.6, isEnabled: false };
      scope.isCollapsed = localStorage.getItem('pit_limiter_collapsed') === 'true';

      function callLimiter(luaCode) {
        bngApi.activeObjectLua(`(function() if not extensions.pitLimiter then extensions.load("pitLimiter") end ${luaCode} end)()`);
      }

      scope.toggleCollapse = function () {
        scope.isCollapsed = !scope.isCollapsed;
        localStorage.setItem('pit_limiter_collapsed', scope.isCollapsed);
      };

      scope.getSpeedDisplay = function () {
        var speedVal = (scope.state && scope.state.targetSpeed !== undefined) ? scope.state.targetSpeed : (50 / 3.6);
        return Math.round(speedVal / speedStep);
      };

      scope.toggleLimiter = function () {
        var nextState = !scope.state.isEnabled;
        callLimiter(`extensions.pitLimiter.setEnabled(${nextState})`);
      };

      var changeInterval = null;
      scope.startAdjust = function (dir) {
        if (changeInterval) return;
        var step = speedStep * dir;
        callLimiter(`extensions.pitLimiter.changeSpeed(${step})`);
        
        var count = 0;
        changeInterval = setInterval(function () {
          count++;
          var multiplier = 1;
          if (count > 15) {
            multiplier = 5;
          } else if (count > 5) {
            multiplier = 2;
          }
          callLimiter(`extensions.pitLimiter.changeSpeed(${step * multiplier})`);
        }, 100);
      };

      scope.stopAdjust = function () {
        if (changeInterval) {
          clearInterval(changeInterval);
          changeInterval = null;
        }
      };

      scope.$on('SettingsChanged', function (event, data) {
        var unit = data.values.uiUnitLength;
        speedStep = 1 / unitMultiplier[unit];
        scope.speedUnit = (unit === 'imperial') ? 'mph' : 'km/h';
        callLimiter('extensions.pitLimiter.requestState()');
      });

      scope.$on('PitLimiterState', function (event, data) {
        scope.$evalAsync(function() {
          scope.state = data;
        });
      });

      scope.$on('VehicleFocusChanged', function () {
        callLimiter('extensions.pitLimiter.requestState()');
      });

      scope.$on('AIStateChange', function () {
        callLimiter('extensions.pitLimiter.requestState()');
      });

      scope.$on('$destroy', function () {
        scope.stopAdjust();
      });

      // Request initial state
      callLimiter('extensions.pitLimiter.requestState()');
      bngApi.engineLua('settings.notifyUI()');
    }
  };
}]);
