-- This Source Code Form is subject to the terms of the bCDDL, v. 1.1.
-- If a copy of the bCDDL was not distributed with this
-- file, You can obtain one at http://beamng.com/bCDDL-1.1.txt

local M = {}

M.hasReachedTargetSpeed = false
M.minimumSpeed = 10 / 3.6

local autoEnable = false

local max = math.max
local min = math.min
local clamp = clamp
local sqrt = math.sqrt

local isEnabled = false
-- UI APP COMPATIBILITY: We keep the baseline matching the UI app's internal default format (80.5 km/h = 50 mph)
local targetSpeed = 80.4672 / 3.6 
local state = {}

local speedPID = newPIDStandard(0.15, 0.05, 0.01, -0.2, 0.5, 0, 1)

local saveData = nil
local currentMapData = nil
local mapChecked = false 

local pitMapDatabase = {
  ["west_coast_usa"] = {
    entryX = 675.371, entryY = -176.082, entryZ = 146.978, radius = 2.5,
    exitX  = 288.837, exitY  = -227.774, exitZ  = 141.829, radius = 2.5
  },
  ["hirochi_raceway"] = {
    entryX = -415.148, entryY = 452.906, entryZ = 33.537, radius = 2.5,
    exitX  = -378.067, exitY  = -231.457, exitZ  = 25.156, radius = 2.5
  },
  ["automation_test_track"] = {
    entryX = 302.825, entryY = 192.600, entryZ = 135.124, radius = 2.5,
    exitX  = 545.412, exitY = 192.380, exitZ = 131.639, radius = 2.5
  },
  ["industrial"] = {
    entryX = 213.975, entryY = -25.748, entryZ = 36.384, radius = 2.5,
    exitX  = 141.535, exitY  = -92.621, exitZ  = 36.271, radius = 2.5
  },
  ["ks_nord"] = {
    entryX = -817.374, entryY = -1784.252, entryZ = 435.089, radius = 2.5,
    exitX  = -1038.966, exitY   = -1696.655, exitZ  = 446.856, radius = 2.5
  }
}

local function getVehicleIdentifier()
  local model = "unknown"
  if v.data and v.data.vehicleDirectory then
    model = v.data.vehicleDirectory:match("vehicles/([^/]+)") or v.data.vehicleDirectory:match("([^/]+)/?$") or "unknown"
  end
  local config = "default"
  if partmgmt and partmgmt.pcPath and partmgmt.pcPath ~= "" then
    config = partmgmt.pcPath:match("([^/]+)%.pc$") or "default"
  end
  return model .. "_" .. config
end

local function loadLimiterSpeed()
  if not saveData then
    local loaded = jsonReadFile("settings/pitLimiter.json")
    saveData = (type(loaded) == "table") and loaded or {}
  end
  local vehicleId = getVehicleIdentifier()
  targetSpeed = saveData[vehicleId] or (80.4672 / 3.6)
end

local function saveLimiterSpeed()
  if not saveData then return end
  local vehicleId = getVehicleIdentifier()
  saveData[vehicleId] = targetSpeed
  jsonWriteFile("settings/pitLimiter.json", saveData, true)
end

local function cacheMapCoordinates()
  mapChecked = true
  
  if not v.data or not v.data.levelName or v.data.levelName == "" then 
    currentMapData = pitMapDatabase["west_coast_usa"]
    return 
  end

  local currentMap = v.data.levelName:gsub("levels/", ""):gsub("/", "")
  
  if pitMapDatabase[currentMap] then
    currentMapData = pitMapDatabase[currentMap]
  else
    currentMapData = pitMapDatabase["west_coast_usa"]
  end
end

local function setEnabled(enabled)
  if type(enabled) == "table" then
    isEnabled = not not enabled.enabled
  else
    isEnabled = not not enabled
  end
  M.hasReachedTargetSpeed = false
  electrics.values.throttleOverride = nil
  speedPID:reset()
  M.requestState()
end

local function toggleEnabled()
  setEnabled(not isEnabled)
end

local function updateGFX(dt)
  if not mapChecked or not currentMapData then
    cacheMapCoordinates()
  end

  if currentMapData then
    local carPos = obj:getPosition()
    
    local dX_entry = carPos.x - currentMapData.entryX
    local dY_entry = carPos.y - currentMapData.entryY
    local dZ_entry = carPos.z - currentMapData.entryZ
    local distToEntry = sqrt(dX_entry*dX_entry + dY_entry*dY_entry + dZ_entry*dZ_entry)
    
    if distToEntry <= currentMapData.radius and not isEnabled then
      setEnabled(true)
    end
    
    local dX_exit = carPos.x - currentMapData.exitX
    local dY_exit = carPos.y - currentMapData.exitY
    local dZ_exit = carPos.z - currentMapData.exitZ
    local distToExit = sqrt(dX_exit*dX_exit + dY_exit*dY_exit + dZ_exit*dZ_exit)
    
    if distToExit <= currentMapData.radius and isEnabled then
      setEnabled(false)
    end
  end

  if not isEnabled then return end

  local driverThrottle = input.throttle or 0
  if driverThrottle <= 0 then
    electrics.values.throttleOverride = 0
    speedPID:reset()
    M.hasReachedTargetSpeed = false
    return
  end

  local currentSpeed = electrics.values.airspeed or 0
  local pidOutput = speedPID:get(currentSpeed, targetSpeed, dt)
  electrics.values.throttleOverride = clamp(min(driverThrottle, pidOutput), 0, 1)

  local currentError = currentSpeed - targetSpeed
  M.hasReachedTargetSpeed = math.abs(currentError) / targetSpeed <= 0.03
end

local function setSpeed(speed)
  targetSpeed = max(speed, M.minimumSpeed)
  saveLimiterSpeed()
  M.requestState()
end

local function changeSpeed(offset)
  targetSpeed = max(targetSpeed + offset, M.minimumSpeed)
  saveLimiterSpeed()
  M.requestState()
end

local function holdCurrentSpeed()
  local currentSpeed = electrics.values.airspeed or 0
  if currentSpeed > M.minimumSpeed then setSpeed(currentSpeed) end
  M.requestState()
end

local function requestState()
  state.targetSpeed = targetSpeed
  state.isEnabled = isEnabled
  electrics.values.pitLimiterTarget = targetSpeed
  electrics.values.pitLimiterActive = isEnabled

  if not playerInfo.firstPlayerSeated then return end
  guihooks.trigger("PitLimiterState", state)
end

local function onInit()
  mapChecked = false
  loadLimiterSpeed()
  cacheMapCoordinates()
end

local function onReset()
  mapChecked = false
  loadLimiterSpeed()
  cacheMapCoordinates()
  M.requestState()
end

local function getConfiguration()
  return {isEnabled = isEnabled, targetSpeed = targetSpeed, minimumSpeed = M.minimumSpeed, hasReachedTargetSpeed = M.hasReachedTargetSpeed}
end

M.onInit = onInit
M.onReset = onReset
M.updateGFX = updateGFX
M.setSpeed = setSpeed
M.changeSpeed = changeSpeed
M.holdCurrentSpeed = holdCurrentSpeed
M.setEnabled = setEnabled
M.toggleEnabled = toggleEnabled 
M.requestState = requestState
M.getConfiguration = getConfiguration

if not extensions then extensions = {} end
extensions.pitLimiter = M

return M