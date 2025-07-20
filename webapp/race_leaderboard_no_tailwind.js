import React, { useState, useEffect } from 'react';
import { Trophy, Flag, Car, Clock, AlertCircle } from 'lucide-react';
import './RaceLeaderboard.css'; // Import the CSS file

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

  const getPositionChangeClass = (change) => {
    if (change > 0) return 'change-up';
    if (change < 0) return 'change-down';
    return 'change-none';
  };

  const getPositionChangeIcon = (change) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  };

  const getPositionClass = (position) => {
    if (position === 1) return 'position-1';
    if (position === 2) return 'position-2';
    if (position === 3) return 'position-3';
    if (position <= 10) return 'position-top10';
    return '';
  };

  const getPositionTextClass = (position) => {
    if (position === 1) return 'position-1-text';
    if (position === 2) return 'position-2-text';
    if (position === 3) return 'position-3-text';
    if (position <= 10) return 'position-top10-text';
    return '';
  };

  const getDeltaClass = (delta) => {
    if (delta === '0') return 'delta-leader';
    if (parseFloat(delta) > 0) return 'delta-behind';
    return 'delta-ahead';
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
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading race data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <AlertCircle className="error-icon" />
          <div className="error-title">Error Loading Data</div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!raceData) {
    return (
      <div className="loading-container">
        <div className="loading-text">No race data available</div>
      </div>
    );
  }

  const flagInfo = getFlagState(raceData.flag_state);

  return (
    <div className="race-leaderboard">
      {/* Header */}
      <div className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <Trophy className="header-trophy" />
              <div>
                <h1 className="header-title">{raceData.run_name}</h1>
                <p className="header-subtitle">Series {raceData.series_id} • {raceData.track_name}</p>
              </div>
            </div>
            
            <div className="header-right">
              <div className="header-info">
                <Flag className="header-flag-icon" />
                <span className="header-info-text">
                  {flagInfo.emoji} {flagInfo.text}
                </span>
              </div>
              
              <div className="header-info">
                <Car className="header-car-icon" />
                <span className="header-info-text">
                  Lap {raceData.lap_number} / {raceData.laps_in_race}
                </span>
              </div>
              
              <div className="header-info">
                <Clock className="header-clock-icon" />
                <span className="header-time-text">
                  {new Date(raceData.time_of_day_os).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="main-container">
        <div className="leaderboard-container">
          {/* Header */}
          <div className="leaderboard-header">
            <div className="leaderboard-header-grid">
              <div className="header-pos">POS</div>
              <div className="header-chg">CHG</div>
              <div className="header-car">CAR</div>
              <div className="header-driver">DRIVER</div>
              <div className="header-lap">LAST LAP</div>
              <div className="header-delta">DELTA</div>
              <div className="header-status">STATUS</div>
            </div>
          </div>

          {/* Leaderboard rows */}
          <div className="leaderboard-rows">
            {leaderboardData.map((driver, index) => {
              const positionChange = getPositionChange(driver.driver_id, parseInt(driver.running_position));
              const changeClass = getPositionChangeClass(positionChange);
              const changeIcon = getPositionChangeIcon(positionChange);
              const position = parseInt(driver.running_position);
              const positionClass = getPositionClass(position);
              const positionTextClass = getPositionTextClass(position);
              const deltaClass = getDeltaClass(driver.delta);
              
              return (
                <div
                  key={driver.driver_id}
                  className={`leaderboard-row ${positionClass}`}
                  style={{
                    transform: `translateY(${positionChange * 4}px)`,
                    transition: 'transform 1s ease-in-out'
                  }}
                >
                  <div className="row-grid">
                    <div className="position-number">
                      <span className={positionTextClass}>
                        {driver.running_position}
                      </span>
                    </div>
                    
                    <div className={`position-change ${changeClass}`}>
                      {changeIcon}
                      {positionChange !== 0 && Math.abs(positionChange)}
                    </div>
                    
                    <div className="car-section">
                      <div className="car-image-container">
                        <img 
                          src={`https://your-cdn-domain.com/car-images/${driver.vehicle_number}.png`}
                          alt={`Car ${driver.vehicle_number}`}
                          className="car-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="car-fallback">
                          <span>{getManufacturerLogo(driver.vehicle_manufacturer)}</span>
                        </div>
                      </div>
                      <div className="car-info">
                        <span className="car-number">{driver.vehicle_number}</span>
                        <span className="car-manufacturer">{driver.vehicle_manufacturer}</span>
                      </div>
                    </div>
                    
                    <div className="driver-section">
                      <div className="driver-name-container">
                        <span className="driver-name">
                          {driver.full_name}
                        </span>
                        
                        {/* Hover tooltip */}
                        <div className="tooltip">
                          <div className="tooltip-header">
                            <span className="tooltip-driver-name">{driver.full_name}</span>
                            <span className="tooltip-car-number">#{driver.vehicle_number}</span>
                          </div>
                          
                          <div className="tooltip-grid">
                            <div className="tooltip-item">
                              <span className="tooltip-label">Starting Position:</span>
                              <span className="tooltip-value">{driver.starting_position}</span>
                            </div>
                            <div className="tooltip-item">
                              <span className="tooltip-label">Current Position:</span>
                              <span className="tooltip-value">{driver.running_position}</span>
                            </div>
                            <div className="tooltip-item">
                              <span className="tooltip-label">Last Lap Time:</span>
                              <span className="tooltip-value mono">{formatTime(driver.last_lap_time)}s</span>
                            </div>
                            <div className="tooltip-item">
                              <span className="tooltip-label">Best Lap Time:</span>
                              <span className="tooltip-value green mono">{formatTime(driver.last_lap_time)}s*</span>
                            </div>
                            <div className="tooltip-item">
                              <span className="tooltip-label">Laps Led:</span>
                              <span className="tooltip-value yellow">--</span>
                            </div>
                            <div className="tooltip-item">
                              <span className="tooltip-label">Delta to Leader:</span>
                              <span className={`tooltip-value mono ${getDeltaClass(driver.delta).replace('delta-', '')}`}>
                                {formatDelta(driver.delta)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="tooltip-footer">
                            <div className="tooltip-footer-item">
                              <span className="tooltip-label">Manufacturer:</span>
                              <span className="tooltip-value">{driver.vehicle_manufacturer}</span>
                            </div>
                            <div className="tooltip-footer-item">
                              <span className="tooltip-label">Driver ID:</span>
                              <span className="tooltip-value">{driver.driver_id}</span>
                            </div>
                            <div className="tooltip-footer-item">
                              <span className="tooltip-label">Track Status:</span>
                              <span className={driver.is_on_track === 'TRUE' ? 'tooltip-status-on' : 'tooltip-status-off'}>
                                {driver.is_on_track === 'TRUE' ? 'On Track' : 'Off Track'}
                              </span>
                            </div>
                            {driver.is_on_dvp === 'TRUE' && (
                              <div className="tooltip-footer-item">
                                <span className="tooltip-label">DVP Status:</span>
                                <span className="tooltip-status-dvp">Active</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="tooltip-disclaimer">
                            *Best lap time placeholder - will be populated from actual data
                          </div>
                        </div>
                      </div>
                      
                      {driver.is_on_dvp === 'TRUE' && (
                        <span className="dvp-badge">
                          DVP
                        </span>
                      )}
                    </div>
                    
                    <div className="lap-time">
                      {formatTime(driver.last_lap_time)}s
                    </div>
                    
                    <div className={`delta-time ${deltaClass}`}>
                      {formatDelta(driver.delta)}
                    </div>
                    
                    <div className="status-container">
                      <span className={`status-badge ${
                        driver.is_on_track === 'TRUE' ? 'status-on' : 'status-off'
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