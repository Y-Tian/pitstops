import requests
import json
import sys
import os
from google.oauth2.service_account import Credentials
import gspread
from datetime import datetime

class LiveFeedToSheets:
    def __init__(self, credentials_path, live_feed_url, sheet_name):
        """
        Initialize the LiveFeedToSheets class
        
        Args:
            credentials_path (str): Path to your Google Service Account JSON file
            live_feed_url (str): URL of the live feed endpoint
        """
        self.live_feed_url = live_feed_url
        self.credentials_path = credentials_path
        self.sheet_name = sheet_name
        self.gc = None
        self.sheet = None
        self.setup_google_sheets()
    
    def setup_google_sheets(self):
        """Setup Google Sheets connection"""
        try:
            # Define the scope
            scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive"
            ]
            
            # Load credentials
            credentials = Credentials.from_service_account_file(
                self.credentials_path, scopes=scope
            )
            
            # Initialize the client
            self.gc = gspread.authorize(credentials)
            print("Google Sheets connection established")
            
        except Exception as e:
            print(f"Error setting up Google Sheets: {e}")
            raise
    
    def fetch_live_feed(self):
        """Fetch data from the live feed endpoint"""
        try:
            response = requests.get(self.live_feed_url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching live feed: {e}")
            return None
    
    def create_or_get_sheet(self, data):
        """Create or get the Google Sheet based on race data"""
        try:
            sheet_created = False
            
            try:
                # Try to open existing sheet
                self.sheet = self.gc.open(self.sheet_name)
                print(f"Opened existing sheet: {self.sheet_name}")
            except gspread.SpreadsheetNotFound:
                # Create new sheet if it doesn't exist
                self.sheet = self.gc.create(self.sheet_name)
                sheet_created = True
                print(f"Created new sheet: {self.sheet_name}")
            
            # Ensure both tabs exist
            self.setup_worksheets()
            
            # Make sheet public if it was just created
            if sheet_created:
                self.make_sheet_public()
                self.print_public_urls()
            
        except Exception as e:
            print(f"Error creating/getting sheet: {e}")
            raise
    
    def setup_worksheets(self):
        """Setup the leaderboard and race metadata worksheets"""
        try:
            # Get or create leaderboard worksheet
            try:
                leaderboard_ws = self.sheet.worksheet("leaderboard")
            except gspread.WorksheetNotFound:
                leaderboard_ws = self.sheet.add_worksheet(title="leaderboard", rows=50, cols=10)
                print("Created leaderboard worksheet")
            
            # Get or create race metadata worksheet
            try:
                metadata_ws = self.sheet.worksheet("race_metadata")
            except gspread.WorksheetNotFound:
                metadata_ws = self.sheet.add_worksheet(title="race_metadata", rows=10, cols=10)
                print("Created race metadata worksheet")
            
            # Delete the default "Sheet1" if it exists
            try:
                default_sheet = self.sheet.worksheet("Sheet1")
                self.sheet.del_worksheet(default_sheet)
                print("Deleted default Sheet1")
            except gspread.WorksheetNotFound:
                pass
                
        except Exception as e:
            print(f"Error setting up worksheets: {e}")
            raise
    
    def make_sheet_public(self):
        """Make the Google Sheet publicly accessible"""
        try:
            # Share the sheet with anyone who has the link (view only)
            self.sheet.share(None, perm_type='anyone', role='reader')
            print("Sheet made publicly accessible")
            
        except Exception as e:
            print(f"Error making sheet public: {e}")
            # Don't raise the error - this is not critical for functionality
    
    def print_public_urls(self):
        """Print the public URLs for accessing the sheet data"""
        try:
            sheet_id = self.sheet.id
            
            # Get worksheet GIDs for proper CSV export URLs
            leaderboard_gid = self.get_worksheet_gid("leaderboard")
            metadata_gid = self.get_worksheet_gid("race_metadata")
            
            # Public URLs for CSV export
            leaderboard_csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={leaderboard_gid}"
            metadata_csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={metadata_gid}"
            
            # Public URL for the full sheet
            sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit?usp=sharing"
            
            print("\n" + "="*60)
            print("PUBLIC URLS FOR FRONTEND ACCESS:")
            print("="*60)
            print(f"Full Sheet URL: {sheet_url}")
            print(f"Leaderboard CSV: {leaderboard_csv_url}")
            print(f"Race Metadata CSV: {metadata_csv_url}")
            print("="*60)
            print("Note: Save these URLs for your frontend application")
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"Error generating public URLs: {e}")
    
    def get_worksheet_gid(self, worksheet_name):
        """Get the GID (worksheet ID) for a specific worksheet"""
        try:
            worksheet = self.sheet.worksheet(worksheet_name)
            return worksheet.id
        except Exception as e:
            print(f"Error getting worksheet GID for {worksheet_name}: {e}")
            return None
    
    def update_leaderboard(self, vehicles):
        """Update the leaderboard worksheet with vehicle data"""
        try:
            leaderboard_ws = self.sheet.worksheet("leaderboard")
            
            # Define headers
            headers = [
                "last_lap_time", "vehicle_manufacturer", "vehicle_number", 
                "driver_id", "full_name", "starting_position", 
                "running_position", "delta", "is_on_track", "is_on_dvp"
            ]
            
            # Clear existing data
            leaderboard_ws.clear()
            
            # Add headers
            leaderboard_ws.append_row(headers)
            
            # Process vehicle data
            for vehicle in vehicles:
                row_data = [
                    vehicle.get("last_lap_time", ""),
                    vehicle.get("vehicle_manufacturer", ""),
                    vehicle.get("vehicle_number", ""),
                    vehicle.get("driver", {}).get("driver_id", ""),
                    vehicle.get("driver", {}).get("full_name", ""),
                    vehicle.get("starting_position", ""),
                    vehicle.get("running_position", ""),
                    vehicle.get("delta", ""),
                    vehicle.get("is_on_track", ""),
                    vehicle.get("is_on_dvp", "")
                ]
                leaderboard_ws.append_row(row_data)
            
            print(f"Updated leaderboard with {len(vehicles)} vehicles")
            
        except Exception as e:
            print(f"Error updating leaderboard: {e}")
            raise
    
    def update_race_metadata(self, data):
        """Update the race metadata worksheet"""
        try:
            metadata_ws = self.sheet.worksheet("race_metadata")
            
            # Define headers
            headers = [
                "lap_number", "flag_state", "laps_in_race", "run_name", 
                "race_id", "run_id", "series_id", "time_of_day_os", 
                "track_id", "track_name"
            ]
            
            # Clear existing data
            metadata_ws.clear()
            
            # Add headers
            metadata_ws.append_row(headers)
            
            # Add race metadata
            metadata_row = [
                data.get("lap_number", ""),
                data.get("flag_state", ""),
                data.get("laps_in_race", ""),
                data.get("run_name", ""),
                data.get("race_id", ""),
                data.get("run_id", ""),
                data.get("series_id", ""),
                data.get("time_of_day_os", ""),
                data.get("track_id", ""),
                data.get("track_name", "")
            ]
            
            metadata_ws.append_row(metadata_row)
            print("Updated race metadata")
            
        except Exception as e:
            print(f"Error updating race metadata: {e}")
            raise
    
    def update_sheets(self):
        """Main method to fetch data and update sheets"""
        try:
            # Fetch live feed data
            print("Fetching live feed data...")
            data = self.fetch_live_feed()
            
            if not data:
                print("No data received from live feed")
                return False
            
            # Create or get the sheet
            self.create_or_get_sheet(data)
            
            # Update leaderboard
            if "vehicles" in data:
                self.update_leaderboard(data["vehicles"])
            
            # Update race metadata
            self.update_race_metadata(data)
            
            print(f"Successfully updated sheets at {datetime.now()}")
            return True
            
        except Exception as e:
            print(f"Error in update_sheets: {e}")
            return False
    
    def run_once(self):
        """Run a single update - idempotent for cron execution"""
        try:
            success = self.update_sheets()
            if success:
                print("Update completed successfully")
                return 0  # Success exit code
            else:
                print("Update failed")
                return 1  # Error exit code
        except Exception as e:
            print(f"Error in run_once: {e}")
            return 1  # Error exit code


def main():
    """Main function to run the live feed to sheets updater"""
    
    # Configuration - can be set via environment variables or updated here
    CREDENTIALS_PATH = os.getenv('GOOGLE_CREDENTIALS_PATH', 'pitstops-dev.json')
    LIVE_FEED_URL = os.getenv('LIVE_FEED_URL', 'http://localhost:5000/live-feed')
    GSHEET_NAME = os.getenv('GSHEET_NAME', 'live-feed-dev')
    
    # Validate configuration
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"Error: Credentials file not found at {CREDENTIALS_PATH}")
        print("Set GOOGLE_CREDENTIALS_PATH environment variable or update the script")
        sys.exit(1)
    
    try:
        # Create instance and run once
        updater = LiveFeedToSheets(CREDENTIALS_PATH, LIVE_FEED_URL, GSHEET_NAME)
        exit_code = updater.run_once()
        sys.exit(exit_code)
        
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()