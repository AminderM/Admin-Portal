#!/usr/bin/env python3
import requests
import sys
import json
import time
from datetime import datetime

class WebAnalyticsAPITester:
    def __init__(self, base_url="https://api.staging.integratedtech.ca"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "message": message,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}: {message}")
        return success

    def test_login(self, email="aminderpro@gmail.com", password="Admin@123!"):
        """Test login with provided credentials"""
        print(f"\n🔍 Testing Login with {email}...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    return self.log_test(
                        "Login Authentication",
                        True,
                        f"Login successful, token acquired",
                        {"user": data.get('user', {})}
                    )
                else:
                    return self.log_test(
                        "Login Authentication",
                        False,
                        "Login response missing access_token"
                    )
            else:
                return self.log_test(
                    "Login Authentication",
                    False,
                    f"Login failed with status {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            return self.log_test(
                "Login Authentication",
                False,
                f"Login request failed: {str(e)}"
            )

    def test_dashboard_overview(self, days=7):
        """Test dashboard overview endpoint"""
        if not self.token:
            return self.log_test(
                "Dashboard Overview",
                False,
                "No auth token available"
            )
            
        print(f"\n🔍 Testing Dashboard Overview (days={days})...")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/dashboard/overview?days={days}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['total_visitors', 'conversions', 'bounce_rate', 'avg_session_duration']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    return self.log_test(
                        "Dashboard Overview API",
                        True,
                        f"All KPI fields present: {expected_fields}",
                        data
                    )
                else:
                    return self.log_test(
                        "Dashboard Overview API",
                        False,
                        f"Missing fields: {missing_fields}"
                    )
            else:
                return self.log_test(
                    "Dashboard Overview API",
                    False,
                    f"Status {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            return self.log_test(
                "Dashboard Overview API",
                False,
                f"Request failed: {str(e)}"
            )

    def test_realtime_data(self):
        """Test realtime dashboard endpoint"""
        if not self.token:
            return self.log_test(
                "Realtime Data",
                False,
                "No auth token available"
            )
            
        print(f"\n🔍 Testing Realtime Data...")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/dashboard/realtime",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['active_visitors', 'active_sessions', 'visitors_timeline', 'sessions_by_source', 'top_pages']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    return self.log_test(
                        "Realtime Data API",
                        True,
                        f"All realtime fields present: {expected_fields}",
                        data
                    )
                else:
                    return self.log_test(
                        "Realtime Data API",
                        False,
                        f"Missing fields: {missing_fields}"
                    )
            else:
                return self.log_test(
                    "Realtime Data API",
                    False,
                    f"Status {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            return self.log_test(
                "Realtime Data API",
                False,
                f"Request failed: {str(e)}"
            )

    def test_heatmap_data(self, page_url="/pricing", days=30):
        """Test heatmap data endpoint"""
        if not self.token:
            return self.log_test(
                "Heatmap Data",
                False,
                "No auth token available"
            )
            
        print(f"\n🔍 Testing Heatmap Data (page={page_url}, days={days})...")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/api/dashboard/heatmap-data?page_url={page_url}&days={days}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['page_url', 'total_clicks', 'ctr', 'avg_scroll_depth', 'engagement_score', 'click_zones', 'click_points']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    return self.log_test(
                        "Heatmap Data API",
                        True,
                        f"All heatmap fields present: {expected_fields}",
                        data
                    )
                else:
                    return self.log_test(
                        "Heatmap Data API",
                        False,
                        f"Missing fields: {missing_fields}"
                    )
            else:
                return self.log_test(
                    "Heatmap Data API",
                    False,
                    f"Status {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            return self.log_test(
                "Heatmap Data API",
                False,
                f"Request failed: {str(e)}"
            )

    def test_websocket_endpoint(self):
        """Test WebSocket endpoint accessibility (basic connectivity check)"""
        if not self.token:
            return self.log_test(
                "WebSocket Endpoint",
                False,
                "No auth token available"
            )
            
        print(f"\n🔍 Testing WebSocket Endpoint...")
        
        try:
            # Simple check - we can't fully test WebSocket in this simple test but can check if endpoint responds
            import websockets
            import asyncio
            
            async def test_ws():
                try:
                    ws_url = f"wss://api.staging.integratedtech.ca/api/ws/analytics?token={self.token}"
                    async with websockets.connect(ws_url, timeout=5) as websocket:
                        # Send ping and wait for response
                        await websocket.send("ping")
                        response = await asyncio.wait_for(websocket.recv(), timeout=2)
                        return response == "pong"
                except Exception:
                    return False
            
            # Try to run the async test
            try:
                loop = asyncio.get_event_loop()
                ws_success = loop.run_until_complete(test_ws())
            except:
                ws_success = False
                
            if ws_success:
                return self.log_test(
                    "WebSocket Endpoint",
                    True,
                    "WebSocket connection and ping/pong successful"
                )
            else:
                return self.log_test(
                    "WebSocket Endpoint",
                    False,
                    "WebSocket connection failed or no pong response"
                )
                
        except ImportError:
            return self.log_test(
                "WebSocket Endpoint",
                False,
                "websockets package not available for testing"
            )
        except Exception as e:
            return self.log_test(
                "WebSocket Endpoint",
                False,
                f"WebSocket test failed: {str(e)}"
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Web Analytics API Tests...\n")
        print(f"Testing against: {self.base_url}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # Test authentication first
        login_success = self.test_login()
        
        if login_success:
            # Test all dashboard endpoints
            self.test_dashboard_overview(7)
            self.test_dashboard_overview(14)
            self.test_dashboard_overview(30)
            self.test_realtime_data()
            self.test_heatmap_data("/pricing", 30)
            self.test_heatmap_data("/features", 14)
            self.test_heatmap_data("/home", 7)
            self.test_websocket_endpoint()
        else:
            print("\n❌ Skipping API tests due to login failure")
        
        # Print summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['message']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WebAnalyticsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed test results
    results_file = f"/app/web_analytics_api_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump({
            "test_summary": {
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "test_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())