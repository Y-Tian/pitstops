from flask import Flask, jsonify
from flask_cors import CORS
import random
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Mock driver data - 40 drivers to match typical NASCAR field
DRIVERS = [
    {"id": 3832, "first_name": "Michael", "last_name": "McDowell", "number": "71", "manufacturer": "Chv", "sponsor": "DePaul"},
    {"id": 3833, "first_name": "Denny", "last_name": "Hamlin", "number": "11", "manufacturer": "Toy", "sponsor": "FedEx"},
    {"id": 3834, "first_name": "Kyle", "last_name": "Larson", "number": "5", "manufacturer": "Chv", "sponsor": "HendrickCars.com"},
    {"id": 3835, "first_name": "Chase", "last_name": "Elliott", "number": "9", "manufacturer": "Chv", "sponsor": "NAPA"},
    {"id": 3836, "first_name": "Martin", "last_name": "Truex Jr.", "number": "19", "manufacturer": "Toy", "sponsor": "Bass Pro Shops"},
    {"id": 3837, "first_name": "Kyle", "last_name": "Busch", "number": "8", "manufacturer": "Chv", "sponsor": "Cheerios"},
    {"id": 3838, "first_name": "William", "last_name": "Byron", "number": "24", "manufacturer": "Chv", "sponsor": "Liberty University"},
    {"id": 3839, "first_name": "Christopher", "last_name": "Bell", "number": "20", "manufacturer": "Toy", "sponsor": "Rheem"},
    {"id": 3840, "first_name": "Alex", "last_name": "Bowman", "number": "48", "manufacturer": "Chv", "sponsor": "Ally"},
    {"id": 3841, "first_name": "Ross", "last_name": "Chastain", "number": "1", "manufacturer": "Chv", "sponsor": "Moose Fraternity"},
    {"id": 3842, "first_name": "Tyler", "last_name": "Reddick", "number": "45", "manufacturer": "Toy", "sponsor": "Monster Energy"},
    {"id": 3843, "first_name": "Ryan", "last_name": "Blaney", "number": "12", "manufacturer": "Frd", "sponsor": "Menards"},
    {"id": 3844, "first_name": "Joey", "last_name": "Logano", "number": "22", "manufacturer": "Frd", "sponsor": "Shell Pennzoil"},
    {"id": 3845, "first_name": "Brad", "last_name": "Keselowski", "number": "6", "manufacturer": "Frd", "sponsor": "Kohler"},
    {"id": 3846, "first_name": "Kevin", "last_name": "Harvick", "number": "4", "manufacturer": "Frd", "sponsor": "Mobil 1"},
    {"id": 3847, "first_name": "Austin", "last_name": "Cindric", "number": "2", "manufacturer": "Frd", "sponsor": "Discount Tire"},
    {"id": 3848, "first_name": "Daniel", "last_name": "Suarez", "number": "99", "manufacturer": "Chv", "sponsor": "Freeway Insurance"},
    {"id": 3849, "first_name": "Bubba", "last_name": "Wallace", "number": "23", "manufacturer": "Toy", "sponsor": "DoorDash"},
    {"id": 3850, "first_name": "Chris", "last_name": "Buescher", "number": "17", "manufacturer": "Frd", "sponsor": "Fastenal"},
    {"id": 3851, "first_name": "Austin", "last_name": "Dillon", "number": "3", "manufacturer": "Chv", "sponsor": "Bass Pro Shops"},
    {"id": 3852, "first_name": "Aric", "last_name": "Almirola", "number": "10", "manufacturer": "Frd", "sponsor": "Smithfield"},
    {"id": 3853, "first_name": "Erik", "last_name": "Jones", "number": "43", "manufacturer": "Chv", "sponsor": "FOCUSfactor"},
    {"id": 3854, "first_name": "Ricky", "last_name": "Stenhouse Jr.", "number": "47", "manufacturer": "Chv", "sponsor": "Kroger"},
    {"id": 3855, "first_name": "AJ", "last_name": "Allmendinger", "number": "16", "manufacturer": "Chv", "sponsor": "Hyperice"},
    {"id": 3856, "first_name": "Noah", "last_name": "Gragson", "number": "42", "manufacturer": "Chv", "sponsor": "Beard Oil"},
    {"id": 3857, "first_name": "Ty", "last_name": "Gibbs", "number": "54", "manufacturer": "Toy", "sponsor": "Interstate Batteries"},
    {"id": 3858, "first_name": "Todd", "last_name": "Gilliland", "number": "38", "manufacturer": "Frd", "sponsor": "Speedco"},
    {"id": 3859, "first_name": "Corey", "last_name": "LaJoie", "number": "7", "manufacturer": "Chv", "sponsor": "Spire Motorsports"},
    {"id": 3860, "first_name": "Harrison", "last_name": "Burton", "number": "21", "manufacturer": "Frd", "sponsor": "Motorcraft"},
    {"id": 3861, "first_name": "Ryan", "last_name": "Preece", "number": "41", "manufacturer": "Frd", "sponsor": "HaasTooling.com"},
    {"id": 3862, "first_name": "Ty", "last_name": "Dillon", "number": "13", "manufacturer": "Chv", "sponsor": "GEICO"},
    {"id": 3863, "first_name": "Carson", "last_name": "Hocevar", "number": "77", "manufacturer": "Chv", "sponsor": "Trane"},
    {"id": 3864, "first_name": "Zane", "last_name": "Smith", "number": "71", "manufacturer": "Chv", "sponsor": "Spire Motorsports"},
    {"id": 3865, "first_name": "Justin", "last_name": "Haley", "number": "51", "manufacturer": "Frd", "sponsor": "Fraternal Order of Eagles"},
    {"id": 3866, "first_name": "Josh", "last_name": "Berry", "number": "4", "manufacturer": "Frd", "sponsor": "Overstock.com"},
    {"id": 3867, "first_name": "John Hunter", "last_name": "Nemechek", "number": "42", "manufacturer": "Toy", "sponsor": "FOCUSfactor"},
    {"id": 3868, "first_name": "Jimmie", "last_name": "Johnson", "number": "84", "manufacturer": "Chv", "sponsor": "Carvana"},
    {"id": 3869, "first_name": "Daniel", "last_name": "Hemric", "number": "31", "manufacturer": "Chv", "sponsor": "Kaulig Racing"},
    {"id": 3870, "first_name": "Shane", "last_name": "van Gisbergen", "number": "88", "manufacturer": "Chv", "sponsor": "Wendy's"},
    {"id": 3871, "first_name": "Kaz", "last_name": "Grala", "number": "15", "manufacturer": "Frd", "sponsor": "Hy-Vee"}
]

# Track configurations
TRACKS = [
    {"id": 218, "name": "Chicago Street Course", "length": 2.2, "type": "Street"},
    {"id": 1, "name": "Daytona International Speedway", "length": 2.5, "type": "Superspeedway"},
    {"id": 2, "name": "Atlanta Motor Speedway", "length": 1.54, "type": "Intermediate"},
    {"id": 3, "name": "Charlotte Motor Speedway", "length": 1.5, "type": "Intermediate"},
    {"id": 4, "name": "Martinsville Speedway", "length": 0.526, "type": "Short Track"},
    {"id": 5, "name": "Bristol Motor Speedway", "length": 0.533, "type": "Short Track"},
    {"id": 6, "name": "Phoenix Raceway", "length": 1.0, "type": "Short Track"}
]

# Global race state
race_state = {
    "lap_number": 1,
    "elapsed_time": 0,
    "flag_state": 1,  # 1 = green, 2 = caution, 3 = red
    "race_id": random.randint(5000, 6000),
    "laps_in_race": 75,
    "current_track": random.choice(TRACKS),
    "stage_num": 1,
    "positions": list(range(40)),  # Track positions (0-based for indexing)
    "leaders": [],
    "caution_segments": 0,
    "caution_laps": 0,
    "lead_changes": 0
}

def generate_lap_time(track_type):
    """Generate realistic lap time based on track type"""
    base_times = {
        "Street": 90.0,
        "Superspeedway": 45.0,
        "Intermediate": 28.0,
        "Short Track": 20.0
    }
    base_time = base_times.get(track_type, 30.0)
    return base_time + random.uniform(-2.0, 3.0)

def generate_speed(track_type):
    """Generate realistic speed based on track type"""
    base_speeds = {
        "Street": 85.0,
        "Superspeedway": 200.0,
        "Intermediate": 180.0,
        "Short Track": 90.0
    }
    base_speed = base_speeds.get(track_type, 100.0)
    return base_speed + random.uniform(-5.0, 5.0)

def generate_pit_stops():
    """Generate realistic pit stop data"""
    num_stops = random.randint(0, 3)
    pit_stops = []
    
    for i in range(num_stops):
        pit_stops.append({
            "positions_gained_lossed": random.randint(-5, 5),
            "pit_in_elapsed_time": random.uniform(100, race_state["elapsed_time"]),
            "pit_in_lap_count": random.randint(1, race_state["lap_number"]),
            "pit_in_leader_lap": random.randint(1, race_state["lap_number"]),
            "pit_out_elapsed_time": random.uniform(100, race_state["elapsed_time"]),
            "pit_in_rank": random.randint(1, 40),
            "pit_out_rank": random.randint(1, 40)
        })
    
    return pit_stops

def generate_laps_led():
    """Generate laps led data"""
    if random.random() < 0.3:  # 30% chance of leading laps
        return [{
            "start_lap": random.randint(1, max(1, race_state["lap_number"] - 5)),
            "end_lap": random.randint(1, race_state["lap_number"])
        }]
    return []

def randomize_race_state():
    """Completely randomize race state on each request"""
    # Randomize basic race info
    race_state["lap_number"] = random.randint(1, 75)
    race_state["elapsed_time"] = random.randint(300, 7200)  # 5 minutes to 2 hours
    race_state["flag_state"] = random.choice([1, 1, 1, 2])  # Mostly green, sometimes caution
    race_state["race_id"] = random.randint(5000, 6000)
    race_state["current_track"] = random.choice(TRACKS)
    race_state["caution_segments"] = random.randint(0, 8)
    race_state["caution_laps"] = random.randint(0, 25)
    race_state["lead_changes"] = random.randint(0, 35)
    
    # Completely shuffle positions
    race_state["positions"] = list(range(40))
    random.shuffle(race_state["positions"])
    
    # Update stage based on lap
    if race_state["lap_number"] <= 25:
        race_state["stage_num"] = 1
    elif race_state["lap_number"] <= 45:
        race_state["stage_num"] = 2
    else:
        race_state["stage_num"] = 3

@app.route('/live-feed')
def live_feed():
    """Main endpoint that mirrors NASCAR live feed structure exactly"""
    # Randomize everything on each request
    randomize_race_state()
    
    # Generate vehicle data
    vehicles = []
    track_type = race_state["current_track"]["type"]
    
    for i in range(40):
        driver = DRIVERS[i]
        position = race_state["positions"][i] + 1  # Convert to 1-based position
        
        # Generate lap times and speeds
        last_lap_time = generate_lap_time(track_type)
        best_lap_time = last_lap_time - random.uniform(1, 5)
        last_lap_speed = generate_speed(track_type)
        best_lap_speed = last_lap_speed + random.uniform(2, 8)
        
        vehicle = {
            "average_restart_speed": best_lap_speed - random.uniform(0, 3),
            "average_running_position": position + random.uniform(-2, 2),
            "average_speed": last_lap_speed - random.uniform(5, 15),
            "best_lap": random.randint(1, race_state["lap_number"]),
            "best_lap_speed": round(best_lap_speed, 3),
            "best_lap_time": round(best_lap_time, 3),
            "vehicle_manufacturer": driver["manufacturer"],
            "vehicle_number": driver["number"],
            "driver": {
                "driver_id": driver["id"],
                "full_name": f"{driver['first_name']} {driver['last_name']}",
                "first_name": driver["first_name"],
                "last_name": driver["last_name"],
                "is_in_chase": random.choice([True, False])
            },
            "vehicle_elapsed_time": race_state["elapsed_time"] - random.uniform(0, 60),
            "fastest_laps_run": random.randint(0, 10),
            "laps_position_improved": random.randint(0, 5),
            "laps_completed": race_state["lap_number"] - random.randint(0, 2),
            "laps_led": generate_laps_led(),
            "last_lap_speed": round(last_lap_speed, 3),
            "last_lap_time": round(last_lap_time, 3),
            "passes_made": random.randint(0, 15),
            "passing_differential": random.randint(-5, 10),
            "position_differential_last_10_percent": random.randint(-10, 10),
            "pit_stops": generate_pit_stops(),
            "qualifying_status": random.randint(0, 2),
            "running_position": position,
            "status": random.choice([1, 1, 1, 1, 2, 3]),  # 1=running, 2=pit, 3=out
            "delta": round(random.uniform(-5.0, 5.0), 1) if position > 1 else 0.0,
            "sponsor_name": driver["sponsor"],
            "starting_position": random.randint(1, 40),
            "times_passed": random.randint(0, 8),
            "quality_passes": random.randint(0, 5),
            "is_on_track": random.choice([True, True, True, False]),
            "is_on_dvp": random.choice([True, False])
        }
        vehicles.append(vehicle)
    
    # Sort vehicles by running position
    vehicles.sort(key=lambda x: x["running_position"])
    
    # Calculate stage finish lap
    stage_finish_lap = 25 if race_state["stage_num"] == 1 else (45 if race_state["stage_num"] == 2 else race_state["laps_in_race"])
    stage_laps = 25 if race_state["stage_num"] <= 2 else (race_state["laps_in_race"] - 45)
    
    # Generate the complete response matching the original structure
    response = {
        "lap_number": race_state["lap_number"],
        "elapsed_time": int(race_state["elapsed_time"]),
        "flag_state": race_state["flag_state"],
        "race_id": race_state["race_id"],
        "laps_in_race": race_state["laps_in_race"],
        "laps_to_go": max(0, race_state["laps_in_race"] - race_state["lap_number"]),
        "vehicles": vehicles,
        "run_id": random.randint(1, 20),
        "run_name": f"Mock Race at {race_state['current_track']['name']}",
        "series_id": 1,
        "time_of_day": int(time.time() % 86400),  # Seconds since midnight
        "time_of_day_os": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "-05:00",
        "track_id": race_state["current_track"]["id"],
        "track_length": race_state["current_track"]["length"],
        "track_name": race_state["current_track"]["name"],
        "run_type": 3,
        "number_of_caution_segments": race_state["caution_segments"],
        "number_of_caution_laps": race_state["caution_laps"],
        "number_of_lead_changes": race_state["lead_changes"],
        "number_of_leaders": len(set(v["running_position"] for v in vehicles if v["laps_led"])),
        "avg_diff_1to3": random.randint(1000, 5000),
        "stage": {
            "stage_num": race_state["stage_num"],
            "finish_at_lap": stage_finish_lap,
            "laps_in_stage": stage_laps
        }
    }
    
    return jsonify(response)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "message": "NASCAR Mock API is running. Use /live-feed for race data."
    })

if __name__ == '__main__':
    print("Starting NASCAR Live Feed Mock API...")
    print("Endpoint:")
    print("  GET /live-feed - Live feed data (completely randomized on each request)")
    print("  GET /health - Health check")
    print("\nRunning on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)