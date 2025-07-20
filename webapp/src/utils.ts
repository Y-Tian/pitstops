export const parseCSV = (csvText: string) => {
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

export const getManufacturerLogo = (manufacturer: string | number) => {
  const logos: Record<"Chv" | "Frd" | "Tyt", string> = {
    Chv: "🚕",
    Frd: "🚗",
    Tyt: "🚙",
  };
  const key = String(manufacturer) as keyof typeof logos;
  return logos[key] ?? "🏁";
};

export const getPositionChange = (
  driverId: string | number,
  currentPosition: number,
  previousPosition?: number,
) => {
  if (previousPosition === undefined) return 0;
  return previousPosition - currentPosition;
};

export const getPositionChangeClass = (change: number) => {
  if (change > 0) return "change-up";
  if (change < 0) return "change-down";
  return "change-none";
};

export const getPositionChangeIcon = (change: number) => {
  if (change > 0) return "↗️";
  if (change < 0) return "↘️";
  return "→";
};

export const getDeltaClass = (delta: string) => {
  const deltaNum = parseFloat(delta);
  if (deltaNum === 0) return "delta-leader";
  if (deltaNum > 0) return "delta-behind";
  if (deltaNum < 0) return "delta-lapped";
  return "";
};

export const formatTime = (timeString: string) => {
  return parseFloat(timeString).toFixed(3);
};

export const formatDelta = (delta: string) => {
  const deltaNum = parseFloat(delta);
  if (deltaNum === 0) return "Leader";
  if (deltaNum < 0) return `-${Math.abs(Math.round(deltaNum))} lap`;
  return `+${deltaNum.toFixed(1)}`;
};
