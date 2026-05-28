angular.module('beamng.apps')
    .directive('pitStatusText', ['$log', function ($log) {
        return {
            template: `
      <div class="pit-text-wrapper" ng-show="state.isEnabled || isInEditMode">
        <style>
          .pit-text-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          .pit-text-indicator {
            font-family: "Impact", "Arial Black", sans-serif;
            font-size: 2.5em;
            font-weight: 900;
            color: #ff003c;
            text-shadow: 0 0 10px rgba(255, 0, 60, 0.8), 0 0 20px rgba(255, 0, 60, 0.5);
            letter-spacing: 2px;
            text-align: center;
            text-transform: uppercase;
            animation: pit-pulse 1s infinite alternate;
          }
          @keyframes pit-pulse {
            from {
              opacity: 0.75;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1.04);
            }
          }
        </style>
        <div class="pit-text-indicator">PIT</div>
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