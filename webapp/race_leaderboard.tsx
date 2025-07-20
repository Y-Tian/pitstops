import React, { useState, useEffect } from 'react';
import { Trophy, Flag, Car, Clock } from 'lucide-react';

const RaceLeaderboard = () => {
  const [raceData, setRaceData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [previousPositions, setPreviousPositions] = useState({});

  // Mock CSV data - replace with actual API calls later
  const mockRaceMetadata = `lap_number,flag_state,laps_in_race,run_name,race_id,run_id,series_id,time_of_day_os,track_id,track_name
6,1,75,Mock Race at Phoenix Raceway,5365,3,1,2025-07-12T19:02:12.333-05:00,6,Phoenix Raceway`;

  const mockLeaderboard = `last_lap_time,vehicle_manufacturer,vehicle_number,driver_id,full_name,starting_position,running_position,delta,is_on_track,is_on_dvp
18.75,Chv,7,3859,Corey LaJoie,24,1,0,TRUE,FALSE
18.684,Chv,84,3868,Jimmie Johnson,35,2,-3,TRUE,TRUE
19.953,Chv,9,3835,Chase Elliott,23,3,2.6,TRUE,FALSE
20.852,Chv,43,3853,Erik Jones,17,4,2.5,TRUE,FALSE
19.799,Frd,38,3858,Todd Gilliland,16,5,3.4,TRUE,FALSE
22.277,Chv,16,3855,AJ Allmendinger,23,6,-4.6,TRUE,TRUE
18.709,Frd,15,3871,Kaz Grala,33,7,2.9,TRUE,FALSE
20.251,Chv,77,3863,Carson Hocevar,12,8,-3.9,TRUE,TRUE
20.48,Chv,1,3841,Ross Chastain,17,9,3.2,TRUE,TRUE
21.941,Toy,23,3849,Bubba Wallace,40,10,0.2,TRUE,FALSE
20.908,Chv,3,3851,Austin Dillon,18,11,4.6,TRUE,FALSE
22.421,Toy,42,3867,John Hunter Nemechek,5,12,-1.2,TRUE,TRUE
22.352,Chv,48,3840,Alex Bowman,9,13,1.6,FALSE,FALSE
18.586,Chv,13,3862,Ty Dillon,23,14,-4.5,TRUE,FALSE
21.698,Frd,51,3865,Justin Haley,28,15,2.5,TRUE,TRUE
19.01,Frd,12,3843,Ryan Blaney,32,16,-3.4,TRUE,TRUE
22.506,Chv,42,3856,Noah Gragson,8,17,-2.3,TRUE,TRUE
22.049,Chv,5,3834,Kyle Larson,30,18,-0.5,FALSE,TRUE
21.325,Chv,71,3832,Michael McDowell,14,19,-3.1,TRUE,FALSE
19.915,Frd,4,3846,Kevin Harvick,24,20,-3.8,TRUE,TRUE
22.916,Chv,24,3838,William Byron,20,21,2.3,TRUE,TRUE
18.43,Chv,31,3869,Daniel Hemric,12,22,1.7,TRUE,TRUE
18.015,Frd,2,3847,Austin Cindric,11,23,-1.6,FALSE,FALSE
18.092,Chv,8,3837,Kyle Busch,9,24,1.4,TRUE,FALSE
18.708,Toy,54,3857,Ty Gibbs,1,25,0.6,TRUE,FALSE
21.165,Toy,19,3836,Martin Truex Jr.,34,26,2.4,TRUE,FALSE
22.778,Frd,6,3845,Brad Keselowski,25,27,0.2,TRUE,TRUE
21.197,Toy,11,3833,Denny Hamlin,18,28,1,TRUE,FALSE
19.82,Chv,71,3864,Zane Smith,6,29,-1.6,FALSE,TRUE
18.478,Chv,99,3848,Daniel Suarez,26,30,0.6,TRUE,FALSE
19.173,Frd,41,3861,Ryan Preece,12,31,1.4,TRUE,FALSE
19.773,Toy,20,3839,Christopher Bell,4,32,3.1,FALSE,TRUE
21.087,Frd,21,3860,Harrison Burton,32,33,1.6,TRUE,TRUE
22.79,Frd,10,3852,Aric Almirola,8,34,-3.5,TRUE,TRUE
19.326,Chv,88,3870,Shane van Gisbergen,1,35,-0.8,TRUE,FALSE
18.422,Frd,17,3850,Chris Buescher,24,36,-3.6,TRUE,TRUE
19.528,Toy,45,3842,Tyler Reddick,28,37,-4.2,TRUE,TRUE
22.604,Frd,22,3844,Joey Logano,31,38,4.6,TRUE,TRUE
19.094,Frd,4,3866,Josh Berry,24,39,-4.3,TRUE,TRUE
20.597,Chv,47,3854,Ricky Stenhouse Jr.,40,40,1.5,TRUE,FALSE`;

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
    const loadData = () => {
      // Parse race metadata
      const raceMetadata = parseCSV(mockRaceMetadata)[0];
      setRaceData(raceMetadata);

      // Parse leaderboard
      const leaderboard = parseCSV(mockLeaderboard);
      
      // Store previous positions for animation
      const newPositions = {};
      leaderboard.forEach(driver => {
        newPositions[driver.driver_id] = parseInt(driver.running_position);
      });
      
      setLeaderboardData(leaderboard);
      setPreviousPositions(newPositions);
    };

    loadData();
    
    // Simulate data updates every 5 seconds
    const interval = setInterval(loadData, 5000);
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

  if (!raceData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading race data...</div>
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