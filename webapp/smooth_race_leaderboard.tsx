import React, { useState, useEffect } from 'react';
import { Trophy, Flag, Car, Clock, AlertCircle } from 'lucide-react';

const RaceLeaderboard = () => {
  const [raceData, setRaceData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [previousPositions, setPreviousPositions] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
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
        // Only show error state on initial load
        if (initialLoading) {
          setError(null);
        }
        
        // Fetch race metadata
        const raceMetadata = await fetchCSVData(RACE_METADATA_URL);
        if (raceMetadata && raceMetadata.length > 0) {
          setRaceData(raceMetadata[0]);
        }

        // Fetch leaderboard
        const leaderboard = await fetchCSVData(LEADERBOARD_URL);
        if (leaderboard && leaderboard.length > 0) {
          // Store previous positions before updating
          const currentPositions = {};
          leaderboardData.forEach(driver => {
            currentPositions[driver.driver_id] = parseInt(driver.running_position);
          });
          setPreviousPositions(currentPositions);
          
          // Sort by running position to ensure proper order
          const sortedLeaderboard = leaderboard.sort((a, b) => 
            parseInt(a.running_position) - parseInt(b.running_position)
          );
          
          setLeaderboardData(sortedLeaderboard);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Only show error on initial load
        if (initialLoading) {
          setError('Failed to load race data. Please check your connection and try again.');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
    
    // Update data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [leaderboardData, initialLoading]);

  const formatTime = (timeString) => {
    return parseFloat(timeString).toFixed(3);
  };

  const formatDelta = (delta) => {
    const deltaNum = parseFloat(delta);
    if (deltaNum === 0) return 'Leader';
    return deltaNum > 0 ? `+${deltaNum.toFixed(1)}` : `${deltaNum.toFixed(1)}`;
  };

  if (initialLoading) {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 50%, #111827 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #374151',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Trophy style={{ color: '#fbbf24', width: '32px', height: '32px' }} />
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>
                  {raceData.run_name}
                </h1>
                <p style={{ color: '#d1d5db', margin: 0 }}>
                  Series {raceData.series_id} • {raceData.track_name}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flag style={{ color: '#60a5fa', width: '20px', height: '20px' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                  {flagInfo.emoji} {flagInfo.text}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car style={{ color: '#34d399', width: '20px', height: '20px' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                  Lap {raceData.lap_number} / {raceData.laps_in_race}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock style={{ color: '#a78bfa', width: '20px', height: '20px' }} />
                <span style={{ fontSize: '0.875rem' }}>
                  {new Date(raceData.time_of_day_os).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '24px' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
            padding: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 2fr 3fr 2fr 2fr 1fr',
              gap: '16px',
              fontWeight: '600',
              fontSize: '0.875rem',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>POS</div>
              <div style={{ textAlign: 'center' }}>CHG</div>
              <div style={{ textAlign: 'left' }}>CAR</div>
              <div style={{ textAlign: 'left' }}>DRIVER</div>
              <div style={{ textAlign: 'center' }}>LAST LAP</div>
              <div style={{ textAlign: 'center' }}>DELTA</div>
              <div style={{ textAlign: 'center' }}>STATUS</div>
            </div>
          </div>

          {/* Leaderboard rows */}
          <div style={{ borderTop: '1px solid #374151' }}>
            {leaderboardData.map((driver, index) => {
              const positionChange = getPositionChange(driver.driver_id, parseInt(driver.running_position));
              const changeClass = getPositionChangeClass(positionChange);
              const changeIcon = getPositionChangeIcon(positionChange);
              const position = parseInt(driver.running_position);
              const positionClass = getPositionClass(position);
              const positionTextClass = getPositionTextClass(position);
              const deltaClass = getDeltaClass(driver.delta);
              
              // Position-based styling
              let rowStyle = {
                padding: '16px',
                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                borderBottom: '1px solid #374151',
                order: position // This ensures proper ordering
              };
              
              if (position === 1) {
                rowStyle = {
                  ...rowStyle,
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderLeft: '4px solid #fbbf24'
                };
              } else if (position === 2) {
                rowStyle = {
                  ...rowStyle,
                  background: 'rgba(156, 163, 175, 0.1)',
                  borderLeft: '4px solid #9ca3af'
                };
              } else if (position === 3) {
                rowStyle = {
                  ...rowStyle,
                  background: 'rgba(249, 115, 22, 0.1)',
                  borderLeft: '4px solid #f97316'
                };
              } else if (position <= 10) {
                rowStyle = {
                  ...rowStyle,
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderLeft: '2px solid #3b82f6'
                };
              }
              
              return (
                <div key={driver.driver_id} style={rowStyle}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 2fr 3fr 2fr 2fr 1fr',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: position === 1 ? '#fbbf24' : 
                               position === 2 ? '#d1d5db' : 
                               position === 3 ? '#fb923c' : 
                               position <= 10 ? '#60a5fa' : 'white'
                      }}>
                        {driver.running_position}
                      </span>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: positionChange > 0 ? '#10b981' : 
                             positionChange < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {changeIcon}
                      {positionChange !== 0 && Math.abs(positionChange)}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '64px',
                        height: '40px',
                        backgroundColor: '#1f2937',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        <span style={{ fontSize: '1.125rem' }}>
                          {getManufacturerLogo(driver.vehicle_manufacturer)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                          {driver.vehicle_number}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {driver.vehicle_manufacturer}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                        {driver.full_name}
                      </span>
                      {driver.is_on_dvp === 'TRUE' && (
                        <span style={{
                          backgroundColor: '#ea580c',
                          color: 'white',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          width: 'fit-content',
                          marginTop: '4px'
                        }}>
                          DVP
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      fontSize: '1.125rem'
                    }}>
                      {formatTime(driver.last_lap_time)}s
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      fontSize: '1.125rem',
                      color: delta === '0' ? '#fbbf24' : 
                             parseFloat(delta) > 0 ? '#fca5a5' : '#34d399'
                    }}>
                      {formatDelta(driver.delta)}
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: driver.is_on_track === 'TRUE' ? '#059669' : '#dc2626',
                        color: 'white'
                      }}>
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