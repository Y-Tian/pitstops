import { Trophy, Flag, Car, Clock } from "lucide-react";

interface LeaderboardHeaderProps {
  raceData: any;
}

const LeaderboardHeader = ({ raceData }: LeaderboardHeaderProps) => {
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

  const flagInfo = getFlagState(raceData.flag_state);

  return (
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
  );
};

export default LeaderboardHeader;
