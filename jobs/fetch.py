import requests
import json
import sys
import os
import csv
import io
from datetime import datetime
import base64
import hashlib

class LiveFeedToR2:
    def __init__(self, live_feed_url, r2_config):
        """
        Initialize the LiveFeedToR2 class
        
        Args:
            live_feed_url (str): URL of the live feed endpoint
            r2_config (dict): R2 configuration with keys: account_id, api_token, bucket
        """
        self.live_feed_url = live_feed_url
        self.r2_config = r2_config
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{r2_config['account_id']}/r2/buckets/{r2_config['bucket']}/objects"
        self.headers = {
            'Authorization': f"Bearer {r2_config['api_token']}",
            'Content-Type': 'application/octet-stream'
        }
        self.verify_connection()
    
    def verify_connection(self):
        """Verify R2 connection and permissions"""
        try:
            # Test connection by attempting to list bucket (this will fail gracefully if no permissions)
            test_url = f"https://api.cloudflare.com/client/v4/accounts/{self.r2_config['account_id']}/r2/buckets"
            test_headers = {
                'Authorization': f"Bearer {self.r2_config['api_token']}",
                'Content-Type': 'application/json'
            }
            
            response = requests.get(test_url, headers=test_headers, timeout=10)
            if response.status_code == 200:
                print("R2 API connection verified successfully")
            else:
                print(f"R2 API connection warning: {response.status_code} - {response.text}")
                print("Proceeding anyway - this might be due to limited permissions")
            
        except Exception as e:
            print(f"Warning: Could not verify R2 connection: {e}")
            print("Proceeding anyway...")
    
    def fetch_live_feed(self):
        """Fetch data from the live feed endpoint"""
        try:
            response = requests.get(self.live_feed_url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching live feed: {e}")
            return None
    
    def create_csv_string(self, headers, rows):
        """Create CSV string from headers and rows"""
        try:
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            writer.writerow(headers)
            
            # Write data rows
            for row in rows:
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Error creating CSV string: {e}")
            return None
    
    def upload_to_r2(self, filename, content, content_type='text/csv'):
        """Upload content to R2 using Cloudflare API"""
        try:
            url = f"{self.base_url}/{filename}"
            
            # Prepare headers for this specific upload
            upload_headers = self.headers.copy()
            upload_headers.update({
                'Content-Type': content_type,
                'Cache-Control': 'public, max-age=30'  # 30 second cache for frequent updates
            })
            
            # Convert content to bytes if it's a string
            if isinstance(content, str):
                content_bytes = content.encode('utf-8')
            else:
                content_bytes = content
            
            # Upload to R2
            response = requests.put(
                url,
                data=content_bytes,
                headers=upload_headers,
                timeout=60
            )
            
            if response.status_code in [200, 201]:
                print(f"Successfully uploaded {filename} to R2")
                return True
            else:
                print(f"Error uploading {filename} to R2: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error uploading {filename} to R2: {e}")
            return False
    
    def create_leaderboard_csv(self, vehicles):
        """Create leaderboard CSV content"""
        try:
            # Define headers
            headers = [
                "last_lap_time", "vehicle_manufacturer", "vehicle_number", 
                "driver_id", "full_name", "starting_position", 
                "running_position", "delta", "is_on_track", "is_on_dvp"
            ]
            
            # Prepare data rows
            rows = []
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
                rows.append(row_data)
            
            return self.create_csv_string(headers, rows)
            
        except Exception as e:
            print(f"Error creating leaderboard CSV: {e}")
            return None
    
    def create_race_metadata_csv(self, data):
        """Create race metadata CSV content"""
        try:
            # Define headers
            headers = [
                "lap_number", "flag_state", "laps_in_race", "run_name", 
                "race_id", "run_id", "series_id", "time_of_day_os", 
                "track_id", "track_name"
            ]
            
            # Prepare metadata row
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
            
            return self.create_csv_string(headers, [metadata_row])
            
        except Exception as e:
            print(f"Error creating race metadata CSV: {e}")
            return None
    
    def upload_manifest(self, timestamp):
        """Upload a manifest file to track current version"""
        try:
            manifest = {
                "last_updated": timestamp.isoformat(),
                "version": int(timestamp.timestamp()),
                "files": {
                    "leaderboard": "leaderboard.csv",
                    "race_metadata": "race_metadata.csv"
                }
            }
            
            manifest_content = json.dumps(manifest, indent=2)
            
            success = self.upload_to_r2('manifest.json', manifest_content, 'application/json')
            
            if success:
                print("Uploaded manifest file")
            
            return success
            
        except Exception as e:
            print(f"Error uploading manifest: {e}")
            return False

    
    def print_public_urls(self):
        """Print the public URLs for accessing the CSV files"""
        try:
            bucket_name = self.r2_config['bucket']
            custom_domain = self.r2_config.get('custom_domain')
            
            if custom_domain:
                base_url = f"https://{custom_domain}"
            else:
                # Use R2 public URL format (you'll need to configure public access)
                account_id = self.r2_config['account_id']
                base_url = f"https://pub-{account_id}.r2.dev/{bucket_name}"
            
            print("\n" + "="*60)
            print("PUBLIC URLS FOR FRONTEND ACCESS:")
            print("="*60)
            print(f"Leaderboard CSV: {base_url}/leaderboard.csv")
            print(f"Race Metadata CSV: {base_url}/race_metadata.csv")
            print(f"Manifest JSON: {base_url}/manifest.json")
            print("="*60)
            print("Note: Ensure your R2 bucket has public access configured")
            print("Or use signed URLs for private access")
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"Error generating public URLs: {e}")
    
    def check_file_exists(self, filename):
        """Check if a file exists in R2"""
        try:
            url = f"{self.base_url}/{filename}"
            
            # Use HEAD request to check if file exists
            response = requests.head(url, headers=self.headers, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error checking if {filename} exists: {e}")
            return False
    
    def update_r2(self):
        """Main method to fetch data and update R2"""
        try:
            # Fetch live feed data
            print("Fetching live feed data...")
            data = self.fetch_live_feed()
            
            if not data:
                print("No data received from live feed")
                return False
            
            timestamp = datetime.now()
            
            # Create CSV content
            leaderboard_csv = None
            if "vehicles" in data:
                leaderboard_csv = self.create_leaderboard_csv(data["vehicles"])
                if not leaderboard_csv:
                    print("Failed to create leaderboard CSV")
                    return False
            
            metadata_csv = self.create_race_metadata_csv(data)
            if not metadata_csv:
                print("Failed to create race metadata CSV")
                return False
            
            # Upload current versions
            success = True
            if leaderboard_csv:
                success &= self.upload_to_r2("leaderboard.csv", leaderboard_csv)
            success &= self.upload_to_r2("race_metadata.csv", metadata_csv)
            
            # Upload manifest
            self.upload_manifest(timestamp)
            
            # Print URLs for frontend access
            self.print_public_urls()
            
            print(f"Successfully updated R2 at {timestamp}")
            return True
            
        except Exception as e:
            print(f"Error in update_r2: {e}")
            return False
    
    def run_once(self):
        """Run a single update - idempotent for cron execution"""
        try:
            success = self.update_r2()
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
    """Main function to run the live feed to R2 updater"""
    
    # Configuration - set via environment variables
    LIVE_FEED_URL = os.getenv('LIVE_FEED_URL', 'https://cf.nascar.com/live/feeds/live-feed.json')
    
    # R2 Configuration using Cloudflare API
    R2_CONFIG = {
        'account_id': os.getenv('CLOUDFLARE_ACCOUNT_ID'),
        'api_token': os.getenv('CLOUDFLARE_API_TOKEN'),
        'bucket': os.getenv('R2_BUCKET_NAME', 'nascar-live-feed'),
        'custom_domain': os.getenv('R2_CUSTOM_DOMAIN')  # Optional
    }
    
    # Validate configuration
    required_vars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Set the following environment variables:")
        print("- CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID")
        print("- CLOUDFLARE_API_TOKEN: Your Cloudflare API token with R2 permissions")
        print("- R2_BUCKET_NAME: Your R2 bucket name (optional, defaults to 'nascar-live-feed')")
        print("- R2_CUSTOM_DOMAIN: Custom domain for R2 (optional)")
        print("\nTo create an API token:")
        print("1. Go to https://dash.cloudflare.com/profile/api-tokens")
        print("2. Click 'Create Token'")
        print("3. Use 'Custom token' template")
        print("4. Add permissions: Account - Cloudflare R2:Edit")
        print("5. Add account resources: Include - Your Account")
        sys.exit(1)
    
    try:
        # Create instance and run once
        updater = LiveFeedToR2(LIVE_FEED_URL, R2_CONFIG)
        exit_code = updater.run_once()
        sys.exit(exit_code)
        
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()