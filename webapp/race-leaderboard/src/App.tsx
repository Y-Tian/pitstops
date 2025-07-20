import { useState, useEffect } from 'react';
import { Trophy, Flag, Car, Clock, AlertCircle } from 'lucide-react';

const RaceLeaderboard = () => {
  type Driver = {
    driver_id: string;
    running_position: string;
    vehicle_manufacturer: string;
    vehicle_number: string;
    full_name: string;
    starting_position: string;
    last_lap_time: string;
    delta: string;
    is_on_dvp: string;
    is_on_track: string;
    [key: string]: any;
  };

  const [raceData, setRaceData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<Driver[]>([]);
  const [previousPositions, setPreviousPositions] = useState<{ [key: string]: number }>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google Sheets CSV endpoints
  const RACE_METADATA_URL = 'https://pub-b7783bd311854f5d831d46eaa8eb5a93.r2.dev/race_metadata.csv';
  const LEADERBOARD_URL = 'https://pub-b7783bd311854f5d831d46eaa8eb5a93.r2.dev/leaderboard.csv';

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      return obj;
    });
  };

  const fetchCSVData = async (url: RequestInfo | URL) => {
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

  const getManufacturerLogo = (manufacturer: string | number) => {
    const logos: Record<'Chv' | 'Frd' | 'Toy', string> = {
      'Chv': '🏁', // Chevrolet
      'Frd': '🚗', // Ford
      'Toy': '🏎️'  // Toyota
    };
    const key = String(manufacturer) as keyof typeof logos;
    return logos[key] ?? '🏁';
  };

  const getFlagState = (flagState: string | number) => {
    const flags: Record<'1' | '2' | '3' | '4', { emoji: string; text: string }> = {
      '1': { emoji: '🟢', text: 'Green Flag' },
      '2': { emoji: '🟡', text: 'Yellow Flag' },
      '3': { emoji: '🔴', text: 'Red Flag' },
      '4': { emoji: '🏁', text: 'Checkered Flag' }
    };
    const key = String(flagState) as keyof typeof flags;
    return flags[key] ?? { emoji: '🏁', text: 'Racing' };
  };

  const getPositionChange = (driverId: string | number, currentPosition: number) => {
    const previousPosition = previousPositions[driverId];
    if (previousPosition === undefined) return 0;
    return previousPosition - currentPosition;
  };

  const getPositionChangeClass = (change: number) => {
    if (change > 0) return 'change-up';
    if (change < 0) return 'change-down';
    return 'change-none';
  };

  const getPositionChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  };

  const getPositionClass = (position: number) => {
    if (position === 1) return 'position-1';
    if (position === 2) return 'position-2';
    if (position === 3) return 'position-3';
    if (position <= 10) return 'position-top10';
    return '';
  };

  const getDeltaClass = (delta: string) => {
    const deltaNum = parseFloat(delta);
    if (deltaNum === 0) return 'delta-leader';
    if (deltaNum > 0) return 'delta-behind';
    if (deltaNum < 0) return 'delta-ahead';
    return '';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        
        // Store current positions before fetching new data
        const currentPositions: { [key: string]: number } = {};
        leaderboardData.forEach(driver => {
          currentPositions[driver.driver_id] = parseInt(driver.running_position);
        });
        
        // Fetch race metadata
        const raceMetadata = await fetchCSVData(RACE_METADATA_URL);
        if (raceMetadata && raceMetadata.length > 0) {
          setRaceData(raceMetadata[0]);
        }

        // Fetch leaderboard
        const leaderboard = await fetchCSVData(LEADERBOARD_URL);
        if (leaderboard && leaderboard.length > 0) {
          // Update previous positions for change tracking
          setPreviousPositions(currentPositions);
          
          // Sort leaderboard by running position
          const sortedLeaderboard = leaderboard
            .map(d => d as Driver)
            .sort((a, b) => 
              parseInt(a.running_position) - parseInt(b.running_position)
            );
          
          setLeaderboardData(sortedLeaderboard);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load race data. Please check your connection and try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
    
    // Update data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeString: string) => {
    return parseFloat(timeString).toFixed(3);
  };

  const formatDelta = (delta: string) => {
    const deltaNum = parseFloat(delta);
    if (deltaNum === 0) return 'Leader';
    return deltaNum > 0 ? `+${deltaNum.toFixed(1)}` : `${deltaNum.toFixed(1)}`;
  };

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #333',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Loading race data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} color="#ef4444" />
          <div style={{ fontSize: '24px', fontWeight: '600' }}>Error Loading Data</div>
          <div style={{ fontSize: '16px', color: '#888' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!raceData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>No race data available</div>
      </div>
    );
  }

  const flagInfo = getFlagState(raceData.flag_state);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .position-row {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .position-1 {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          border-left: 4px solid #ffd700;
        }
        
        .position-2 {
          background: linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%);
          border-left: 4px solid #c0c0c0;
        }
        
        .position-3 {
          background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
          border-left: 4px solid #cd7f32;
        }
        
        .position-top10 {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-left: 4px solid #3b82f6;
        }
        
        .change-up {
          color: #22c55e;
          font-weight: 600;
        }
        
        .change-down {
          color: #ef4444;
          font-weight: 600;
        }
        
        .change-none {
          color: #6b7280;
        }
        
        .delta-leader {
          color: #ffd700;
          font-weight: 600;
        }
        
        .delta-behind {
          color: #ef4444;
        }
        
        .delta-ahead {
          color: #22c55e;
        }
        
        .tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          min-width: 300px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 1000;
          margin-bottom: 8px;
        }
        
        .driver-name:hover .tooltip {
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '20px 0',
        borderBottom: '2px solid #3b82f6'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <Trophy size={32} color="#ffd700" />
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: 0,
                  color: 'white'
                }}>
                  {raceData.run_name}
                </h1>
                <p style={{
                  fontSize: '16px',
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  Series {raceData.series_id} • {raceData.track_name}
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Flag size={20} />
                <span>{flagInfo.emoji} {flagInfo.text}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Car size={20} />
                <span>Lap {raceData.lap_number} / {raceData.laps_in_race}</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Clock size={20} />
                <span>{new Date(raceData.time_of_day_os).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #333'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
            padding: '16px 20px',
            borderBottom: '1px solid #333'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 60px 120px 1fr 100px 100px 80px',
              gap: '16px',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <div>POS</div>
              <div>CHG</div>
              <div>CAR</div>
              <div>DRIVER</div>
              <div>LAST LAP</div>
              <div>DELTA</div>
              <div>STATUS</div>
            </div>
          </div>

          {/* Leaderboard rows */}
          <div>
            {leaderboardData.map((driver) => {
              const positionChange = getPositionChange(driver.driver_id, parseInt(driver.running_position));
              const changeClass = getPositionChangeClass(positionChange);
              const changeIcon = getPositionChangeIcon(positionChange);
              const position = parseInt(driver.running_position);
              const positionClass = getPositionClass(position);
              const deltaClass = getDeltaClass(driver.delta);
              
              return (
                <div
                  key={driver.driver_id}
                  className={`position-row ${positionClass}`}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #333',
                    backgroundColor: position <= 3 ? 'rgba(255, 255, 255, 0.1)' : 
                                   position <= 10 ? 'rgba(59, 130, 246, 0.1)' : 
                                   'transparent'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 60px 120px 1fr 100px 100px 80px',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: position <= 3 ? '#000' : '#fff'
                    }}>
                      {driver.running_position}
                    </div>
                    
                    <div className={changeClass} style={{
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {changeIcon}
                      {positionChange !== 0 && Math.abs(positionChange)}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#333',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        {getManufacturerLogo(driver.vehicle_manufacturer)}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#fff'
                        }}>
                          {driver.vehicle_number}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#888'
                        }}>
                          {driver.vehicle_manufacturer}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative'
                    }}>
                      <div className="driver-name" style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#fff',
                        cursor: 'pointer'
                      }}>
                        {driver.full_name}
                        <div className="tooltip">
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #333'
                          }}>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>
                              {driver.full_name}
                            </span>
                            <span style={{ fontSize: '14px', color: '#888' }}>
                              #{driver.vehicle_number}
                            </span>
                          </div>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <div>
                              <span style={{ color: '#888' }}>Starting Position:</span>
                              <span style={{ color: '#fff', marginLeft: '8px' }}>
                                {driver.starting_position}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#888' }}>Current Position:</span>
                              <span style={{ color: '#fff', marginLeft: '8px' }}>
                                {driver.running_position}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#888' }}>Last Lap:</span>
                              <span style={{ color: '#fff', marginLeft: '8px', fontFamily: 'monospace' }}>
                                {formatTime(driver.last_lap_time)}s
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#888' }}>Delta:</span>
                              <span className={deltaClass} style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                                {formatDelta(driver.delta)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {driver.is_on_dvp === 'TRUE' && (
                        <span style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          DVP
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      fontSize: '16px',
                      fontFamily: 'monospace',
                      color: '#fff'
                    }}>
                      {formatTime(driver.last_lap_time)}s
                    </div>
                    
                    <div className={deltaClass} style={{
                      fontSize: '16px',
                      fontFamily: 'monospace',
                      fontWeight: '600'
                    }}>
                      {formatDelta(driver.delta)}
                    </div>
                    
                    <div>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: driver.is_on_track === 'TRUE' ? '#22c55e' : '#ef4444',
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