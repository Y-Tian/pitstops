import React, { useState, useEffect } from 'react';
import { Trophy, Flag, Car, Clock, AlertCircle } from 'lucide-react';

const RaceLeaderboard = () => {
  const [raceData, setRaceData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [previousPositions, setPreviousPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Google Sheets CSV endpoints
  const RACE_METADATA_URL = 'https://docs.google.com/spreadsheets/d/1XiMKoDaT7ou4oWlkUhtoaQhAkfLNtUF2ErJTFYeQPPc/export?format=csv&gid=2042946012';
  const LEADERBOARD_URL = 'https://docs.google.com/spreadsheets/d/1XiMKoDaT7ou4oWlkUhtoaQhAkfLNtUF2ErJTFYeQPPc/export?format=csv&gid=1066144851';

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      return obj;
    });
  };

  const fetchCSVData = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      return parseCSV(csvText);
    } catch (error) {
      console.error('Error fetching CSV data:', error);
      return null;
    }
  };

  const getManufacturerLogo = (manufacturer) => {
    const logos = {
      'Chv': '🏁', // Chevrolet
      'Frd': '🚗', // Ford
      'Toy': '🏎️'  // Toyota
    };
    return logos[manufacturer] || '🏁';
  };

  const getFlagState = (flagState) => {
    const flags = {
      '1': { emoji: '🟢', text: 'Green Flag' },
      '2': { emoji: '🟡', text: 'Yellow Flag' },
      '3': { emoji: '🔴', text: 'Red Flag' },
      '4': { emoji: '🏁', text: 'Checkered Flag' }
    };
    return flags[flagState] || { emoji: '🏁', text: 'Racing' };
  };

  const getPositionChange = (driverId, currentPosition) => {
    const previousPosition = previousPositions[driverId];
    if (previousPosition === undefined) return 0;
    return previousPosition - currentPosition;
  };

  const getPositionChangeColor = (change) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getPositionChangeIcon = (change) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch race metadata
        const raceMetadata = await fetchCSVData(RACE_METADATA_URL);
        if (raceMetadata && raceMetadata.length > 0) {
          setRaceData(raceMetadata[0]);
        }

        // Fetch leaderboard
        const leaderboard = await fetchCSVData(LEADERBOARD_URL);
        if (leaderboard && leaderboard.length > 0) {
          // Store previous positions for animation
          const newPositions = {};
          leaderboard.forEach(driver => {
            newPositions[driver.driver_id] = parseInt(driver.running_position);
          });
          
          setLeaderboardData(leaderboard);
          setPreviousPositions(newPositions);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load race data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Update data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeString) => {
    return parseFloat(timeString).toFixed(3);
  };

  const formatDelta = (delta) => {
    const deltaNum = parseFloat(delta);
    if (deltaNum === 0) return 'Leader';
    return deltaNum > 0 ? `+${deltaNum.toFixed(1)}` : `${deltaNum.toFixed(1)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl">Loading race data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl mb-2">Error Loading Data</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!raceData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">No race data available</div>
      </div>
    );
  }

  const flagInfo = getFlagState(raceData.flag_state);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-gray-700 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="text-yellow-400 h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">{raceData.run_name}</h1>
                <p className="text-gray-300">Series {raceData.series_id} • {raceData.track_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Flag className="text-blue-400 h-5 w-5" />
                <span className="text-lg font-semibold">
                  {flagInfo.emoji} {flagInfo.text}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Car className="text-green-400 h-5 w-5" />
                <span className="text-lg font-semibold">
                  Lap {raceData.lap_number} / {raceData.laps_in_race}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="text-purple-400 h-5 w-5" />
                <span className="text-sm">
                  {new Date(raceData.time_of_day_os).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-black/30 backdrop-blur-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm items-center">
              <div className="col-span-1 text-center">POS</div>
              <div className="col-span-1 text-center">CHG</div>
              <div className="col-span-2 text-left">CAR</div>
              <div className="col-span-3 text-left">DRIVER</div>
              <div className="col-span-2 text-center">LAST LAP</div>
              <div className="col-span-2 text-center">DELTA</div>
              <div className="col-span-1 text-center">STATUS</div>
            </div>
          </div>

          {/* Leaderboard rows */}
          <div className="divide-y divide-gray-700">
            {leaderboardData.map((driver, index) => {
              const positionChange = getPositionChange(driver.driver_id, parseInt(driver.running_position));
              const changeColor = getPositionChangeColor(positionChange);
              const changeIcon = getPositionChangeIcon(positionChange);
              const position = parseInt(driver.running_position);
              
              return (
                <div
                  key={driver.driver_id}
                  className={`p-4 transition-all duration-1000 ease-in-out hover:bg-white/10 ${
                    position === 1 ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : 
                    position === 2 ? 'bg-gray-400/10 border-l-4 border-gray-400' : 
                    position === 3 ? 'bg-orange-500/10 border-l-4 border-orange-500' : 
                    position <= 10 ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''
                  }`}
                  style={{
                    transform: `translateY(${positionChange * 4}px)`,
                    transition: 'transform 1s ease-in-out'
                  }}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center">
                      <span className={`text-lg font-bold ${
                        position === 1 ? 'text-yellow-400' : 
                        position === 2 ? 'text-gray-300' : 
                        position === 3 ? 'text-orange-400' : 
                        position <= 10 ? 'text-blue-400' : 'text-white'
                      }`}>
                        {driver.running_position}
                      </span>
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <span className={`text-sm ${changeColor}`}>
                        {changeIcon}
                        {positionChange !== 0 && Math.abs(positionChange)}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                          {/* Car image placeholder - will be replaced with actual image */}
                          <img 
                            src={`https://your-cdn-domain.com/car-images/${driver.vehicle_number}.png`}
                            alt={`Car ${driver.vehicle_number}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            <span className="text-lg">{getManufacturerLogo(driver.vehicle_manufacturer)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">{driver.vehicle_number}</span>
                          <span className="text-xs text-gray-400">{driver.vehicle_manufacturer}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="flex flex-col">
                        <div className="relative inline-block group">
                          <span className="font-semibold text-lg cursor-pointer hover:text-blue-400 transition-colors">
                            {driver.full_name}
                          </span>
                          
                          {/* Hover tooltip - only on driver name */}
                          <div className="absolute left-0 top-full mt-2 bg-black/95 backdrop-blur-md border border-gray-600 rounded-lg p-4 z-20 min-w-72 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl">
                            <div className="text-sm space-y-2">
                              <div className="border-b border-gray-700 pb-2 mb-2">
                                <span className="text-blue-400 font-semibold">{driver.full_name}</span>
                                <span className="text-gray-400 ml-2">#{driver.vehicle_number}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Starting Position:</span>
                                  <span className="text-white">{driver.starting_position}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Current Position:</span>
                                  <span className="text-white">{driver.running_position}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Last Lap Time:</span>
                                  <span className="text-white font-mono">{formatTime(driver.last_lap_time)}s</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Best Lap Time:</span>
                                  <span className="text-green-400 font-mono">{formatTime(driver.last_lap_time)}s*</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Laps Led:</span>
                                  <span className="text-yellow-400">--</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Delta to Leader:</span>
                                  <span className={`font-mono ${
                                    driver.delta === '0' ? 'text-yellow-400' : 
                                    parseFloat(driver.delta) > 0 ? 'text-red-400' : 'text-green-400'
                                  }`}>
                                    {formatDelta(driver.delta)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="border-t border-gray-700 pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Manufacturer:</span>
                                  <span className="text-white">{driver.vehicle_manufacturer}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Driver ID:</span>
                                  <span className="text-white">{driver.driver_id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Track Status:</span>
                                  <span className={driver.is_on_track === 'TRUE' ? 'text-green-400' : 'text-red-400'}>
                                    {driver.is_on_track === 'TRUE' ? 'On Track' : 'Off Track'}
                                  </span>
                                </div>
                                {driver.is_on_dvp === 'TRUE' && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400">DVP Status:</span>
                                    <span className="text-orange-400">Active</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500 mt-2 text-center">
                                *Best lap time placeholder - will be populated from actual data
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {driver.is_on_dvp === 'TRUE' && (
                          <span className="bg-orange-600 text-white px-1 py-0.5 rounded text-xs w-fit mt-1">
                            DVP
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <span className="font-mono text-lg">{formatTime(driver.last_lap_time)}s</span>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <span className={`font-mono text-lg ${
                        driver.delta === '0' ? 'text-yellow-400' : 
                        parseFloat(driver.delta) > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {formatDelta(driver.delta)}
                      </span>
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <span className={`text-sm px-2 py-1 rounded ${
                        driver.is_on_track === 'TRUE' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {driver.is_on_track === 'TRUE' ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceLeaderboard;