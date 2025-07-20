import { useState, useEffect } from "react";
import { Trophy, Flag, Car, Clock, AlertCircle } from "lucide-react";
import "./styles/RaceLeaderboard.css";

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
  const [previousPositions, setPreviousPositions] = useState<{
    [key: string]: number;
  }>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google Sheets CSV endpoints
  const R2_ENDPOINT = "https://pub-c40331d1ffaa483a8c55e70a0acd246f.r2.dev";
  const RACE_METADATA_URL = `${R2_ENDPOINT}/race_metadata.csv`;
  const LEADERBOARD_URL = `${R2_ENDPOINT}/leaderboard.csv`;

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const obj: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || "";
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
      console.error("Error fetching CSV data:", error);
      return null;
    }
  };

  const getManufacturerLogo = (manufacturer: string | number) => {
    const logos: Record<"Chv" | "Frd" | "Toy", string> = {
      Chv: "🏁", // Chevrolet
      Frd: "🚗", // Ford
      Toy: "🏎️", // Toyota
    };
    const key = String(manufacturer) as keyof typeof logos;
    return logos[key] ?? "🏁";
  };

  const getFlagState = (flagState: string | number) => {
    const flags: Record<
      "1" | "2" | "3" | "4",
      { emoji: string; text: string }
    > = {
      "1": { emoji: "🟢", text: "Green Flag" },
      "2": { emoji: "🟡", text: "Yellow Flag" },
      "3": { emoji: "🔴", text: "Red Flag" },
      "4": { emoji: "🏁", text: "Checkered Flag" },
    };
    const key = String(flagState) as keyof typeof flags;
    return flags[key] ?? { emoji: "🏁", text: "Racing" };
  };

  const getPositionChange = (
    driverId: string | number,
    currentPosition: number,
  ) => {
    const previousPosition = previousPositions[driverId];
    if (previousPosition === undefined) return 0;
    return previousPosition - currentPosition;
  };

  const getPositionChangeClass = (change: number) => {
    if (change > 0) return "change-up";
    if (change < 0) return "change-down";
    return "change-none";
  };

  const getPositionChangeIcon = (change: number) => {
    if (change > 0) return "↗️";
    if (change < 0) return "↘️";
    return "→";
  };

  const getDeltaClass = (delta: string) => {
    const deltaNum = parseFloat(delta);
    if (deltaNum === 0) return "delta-leader";
    if (deltaNum > 0) return "delta-behind";
    if (deltaNum < 0) return "delta-ahead";
    return "";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        // Store current positions before fetching new data
        const currentPositions: { [key: string]: number } = {};
        leaderboardData.forEach((driver) => {
          currentPositions[driver.driver_id] = parseInt(
            driver.running_position,
          );
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
            .map((d) => d as Driver)
            .sort(
              (a, b) =>
                parseInt(a.running_position) - parseInt(b.running_position),
            );

          setLeaderboardData(sortedLeaderboard);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError(
          "Failed to load race data. Please check your connection and try again.",
        );
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();

    // Update data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [LEADERBOARD_URL, RACE_METADATA_URL, fetchCSVData, leaderboardData]);

  const formatTime = (timeString: string) => {
    return parseFloat(timeString).toFixed(3);
  };

  const formatDelta = (delta: string) => {
    const deltaNum = parseFloat(delta);
    if (deltaNum === 0) return "Leader";
    return deltaNum > 0 ? `+${deltaNum.toFixed(1)}` : `${deltaNum.toFixed(1)}`;
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div>Loading race data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <AlertCircle size={48} color="#ef4444" />
          <div className="error-title">Error Loading Data</div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!raceData) {
    return (
      <div className="loading-container">
        <div>No race data available</div>
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
            <div className="title-section">
              <Trophy size={32} color="#ffd700" />
              <div>
                <h1 className="race-title">{raceData.run_name}</h1>
                <p className="race-subtitle">
                  Series {raceData.series_id} • {raceData.track_name}
                </p>
              </div>
            </div>
            <div className="race-info">
              <div className="info-item">
                <Flag size={20} />
                <span>
                  {flagInfo.emoji} {flagInfo.text}
                </span>
              </div>
              <div className="info-item">
                <Car size={20} />
                <span>
                  Lap {raceData.lap_number} / {raceData.laps_in_race}
                </span>
              </div>
              <div className="info-item">
                <Clock size={20} />
                <span>
                  {new Date(raceData.time_of_day_os).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Leaderboard */}
      <div className="leaderboard-container">
        <div className="leaderboard">
          {/* Header */}
          <div className="leaderboard-header">
            <div className="grid-header">
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
              const positionChange = getPositionChange(
                driver.driver_id,
                parseInt(driver.running_position),
              );
              const changeClass = getPositionChangeClass(positionChange);
              const changeIcon = getPositionChangeIcon(positionChange);
              const position = parseInt(driver.running_position);
              const deltaClass = getDeltaClass(driver.delta);
              // Determine color for position
              const positionColorClass =
                position <= 3 ? "position-top3" : "position-other";
              // Determine background for row
              let rowBgClass = "";
              if (position === 1) rowBgClass = "position-1";
              else if (position === 2) rowBgClass = "position-2";
              else if (position === 3) rowBgClass = "position-3";
              else if (position <= 10) rowBgClass = "position-top10";
              return (
                <div
                  key={driver.driver_id}
                  className={`position-row ${rowBgClass}`}
                >
                  <div className="grid-row">
                    <div className={`position ${positionColorClass}`}>
                      {driver.running_position}
                    </div>
                    <div
                      className={changeClass}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {changeIcon}
                      {positionChange !== 0 && Math.abs(positionChange)}
                    </div>
                    <div className="car-info">
                      <div className="manufacturer-logo">
                        {getManufacturerLogo(driver.vehicle_manufacturer)}
                      </div>
                      <div>
                        <div className="car-number">
                          {driver.vehicle_number}
                        </div>
                        <div className="manufacturer-name">
                          {driver.vehicle_manufacturer}
                        </div>
                      </div>
                    </div>
                    <div className="driver-info">
                      <div className="driver-name">
                        {driver.full_name}
                        <div className="tooltip">
                          <div className="tooltip-header">
                            <span className="tooltip-name">
                              {driver.full_name}
                            </span>
                            <span className="tooltip-number">
                              #{driver.vehicle_number}
                            </span>
                          </div>
                          <div className="tooltip-grid">
                            <div>
                              <span className="tooltip-label">
                                Starting Position:
                              </span>
                              <span className="tooltip-value">
                                {driver.starting_position}
                              </span>
                            </div>
                            <div>
                              <span className="tooltip-label">
                                Current Position:
                              </span>
                              <span className="tooltip-value">
                                {driver.running_position}
                              </span>
                            </div>
                            <div>
                              <span className="tooltip-label">Last Lap:</span>
                              <span
                                className="tooltip-value"
                                style={{ fontFamily: "monospace" }}
                              >
                                {formatTime(driver.last_lap_time)}s
                              </span>
                            </div>
                            <div>
                              <span className="tooltip-label">Delta:</span>
                              <span
                                className={`tooltip-value ${deltaClass}`}
                                style={{ fontFamily: "monospace" }}
                              >
                                {formatDelta(driver.delta)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {driver.is_on_dvp === "TRUE" && (
                        <span className="dvp-tag">DVP</span>
                      )}
                    </div>
                    <div className="lap-time">
                      {formatTime(driver.last_lap_time)}s
                    </div>
                    <div className={`delta ${deltaClass}`}>
                      {formatDelta(driver.delta)}
                    </div>
                    <div>
                      <span
                        className={`track-status ${driver.is_on_track === "TRUE" ? "status-on" : "status-off"}`}
                      >
                        {driver.is_on_track === "TRUE" ? "ON" : "OFF"}
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
