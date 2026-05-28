angular.module('beamng.apps')
    .directive('pitStatusText', ['$log', function ($log) {
        return {
            template: `
      <div class="pit-text-wrapper" ng-class="{'is-active': state.isEnabled, 'is-inactive': !state.isEnabled}">
        <style>
          .pit-text-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          .pit-svg {
            width: 100%;
            height: 100%;
          }
          .pit-text-indicator {
            font-family: "Impact", "Arial Black", sans-serif;
            font-weight: 900;
            text-anchor: middle;
            dominant-baseline: central;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-size: 34px;
          }
          /* Active State */
          .pit-text-wrapper.is-active .pit-text-indicator {
            fill: #ff003c;
            filter: drop-shadow(0 0 10px rgba(255, 0, 60, 0.8)) drop-shadow(0 0 20px rgba(255, 0, 60, 0.5));
            animation: pit-pulse 1s infinite alternate;
          }
          /* Inactive State */
          .pit-text-wrapper.is-inactive .pit-text-indicator {
            fill: #666666;
            opacity: 0.7;
          }
          @keyframes pit-pulse {
            from {
              opacity: 0.75;
              transform: scale(0.96);
              transform-origin: center;
            }
            to {
              opacity: 1;
              transform: scale(1.04);
              transform-origin: center;
            }
          }
        </style>
        <svg class="pit-svg" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet">
          <text x="50%" y="50%" class="pit-text-indicator">PIT</text>
          <line x1="18%" y1="50%" x2="82%" y2="50%" stroke="#666666" stroke-width="4" ng-show="!state.isEnabled" style="opacity: 0.7;" />
        </svg>
      </div>
    `,
            replace: true,
            restrict: 'E',
            scope: true,
            link: function (scope, element, attrs) {
                scope.state = { isEnabled: false };
                scope.isInEditMode = false;

                // Listen directly to the streams from our VLua script properties
                scope.$on('streamsUpdate', function (event, streams) {
                    if (streams.electrics && streams.electrics.pitLimiterActive !== undefined) {
                        scope.$evalAsync(function () {
                            scope.state.isEnabled = !!streams.electrics.pitLimiterActive;
                        });
                    }
                });

                // Keeps placeholder active matching runtime layout rules when customizing user interfaces
                scope.$on('EditModeChanged', function (event, data) {
                    scope.$evalAsync(function () {
                        scope.isInEditMode = !!data.editMode;
                    });
                });
            }
        };
    }]);