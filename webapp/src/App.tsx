import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import "./styles/RaceLeaderboard.css";
import LeaderboardHeader from "./components/LeaderboardHeader";
import LeaderboardGrid from "./components/LeaderboardGrid";
import type { Driver } from "./types";
import { parseCSV } from "./utils";

const R2_ENDPOINT = "https://pub-c40331d1ffaa483a8c55e70a0acd246f.r2.dev";
const RACE_METADATA_URL = `${R2_ENDPOINT}/race_metadata.csv`;
const LEADERBOARD_URL = `${R2_ENDPOINT}/leaderboard.csv`;

const RaceLeaderboard = () => {
  const [raceData, setRaceData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<Driver[]>([]);
  const [previousPositions, setPreviousPositions] = useState<{
    [key: string]: number;
  }>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCSVData = useCallback(async (url: RequestInfo | URL) => {
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
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const currentPositions: { [key: string]: number } = {};
        leaderboardData.forEach((driver) => {
          currentPositions[driver.driver_id] = parseInt(
            driver.running_position,
          );
        });
        const raceMetadata = await fetchCSVData(RACE_METADATA_URL);
        if (raceMetadata && raceMetadata.length > 0) {
          setRaceData(raceMetadata[0]);
        }
        const leaderboard = await fetchCSVData(LEADERBOARD_URL);
        if (leaderboard && leaderboard.length > 0) {
          setPreviousPositions(currentPositions);
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
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [fetchCSVData, leaderboardData]);

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

  return (
    <div className="race-leaderboard">
      <LeaderboardHeader raceData={raceData} />
      <LeaderboardGrid
        leaderboardData={leaderboardData}
        previousPositions={previousPositions}
      />
    </div>
  );
};

export default RaceLeaderboard;
