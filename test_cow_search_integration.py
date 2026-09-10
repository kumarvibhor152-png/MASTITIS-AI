"""
test_cow_search_integration.py
Automated end-to-end test suite for Instant Cattle Database Search & Telemetry.
"""
import sys
import json
import urllib.request
import unittest

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:5173"

class TestCowSearchIntegration(unittest.TestCase):

    def test_01_health(self):
        req = urllib.request.urlopen(f"{BASE_URL}/api/health")
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(data.get("status"), "healthy")
        print("PASS: /api/health OK")

    def test_02_search_all_cows(self):
        req = urllib.request.urlopen(f"{BASE_URL}/api/cattle/search")
        data = json.loads(req.read().decode("utf-8"))
        self.assertTrue(data.get("success"))
        self.assertGreaterEqual(data.get("count", 0), 10)
        cows = data.get("data", [])
        names = [c["name"] for c in cows]
        print(f"PASS: Indexed {len(cows)} cows: {[c['id'] for c in cows]}")
        self.assertTrue(any("Kaveri" in n for n in names))
        self.assertTrue(any("Kamdhenu" in n for n in names))
        self.assertTrue(any("Lakshmi" in n for n in names))

    def test_03_search_by_name(self):
        url = f"{BASE_URL}/api/cattle/search?q=" + urllib.parse.quote("Kaveri")
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(len(data.get("data")), 1)
        cow = data["data"][0]
        self.assertIn("Kaveri", cow["name"])
        self.assertEqual(cow["id"], "COW-108")
        self.assertEqual(cow["risk_level"], "HIGH")
        self.assertGreaterEqual(cow["ec_lf"], 8.0)
        print(f"PASS: Name search 'Kaveri' -> {cow['name']} ({cow['id']}) [Risk: {cow['risk_level']}]")

    def test_04_search_by_id(self):
        url = f"{BASE_URL}/api/cattle/search?q=" + urllib.parse.quote("COW-102")
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(len(data.get("data")), 1)
        cow = data["data"][0]
        self.assertIn("Kamdhenu", cow["name"])
        self.assertEqual(cow["risk_level"], "MEDIUM")
        self.assertEqual(cow["ec_rh"], 6.4)
        print(f"PASS: ID search 'COW-102' -> {cow['name']} [EC RH: {cow['ec_rh']} mS/cm]")

    def test_05_search_by_tag(self):
        url = f"{BASE_URL}/api/cattle/search?q=" + urllib.parse.quote("TAG-IND-807")
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(len(data.get("data")), 1)
        cow = data["data"][0]
        self.assertIn("Gauri", cow["name"])
        self.assertEqual(cow["id"], "COW-107")
        print(f"PASS: Tag search 'TAG-IND-807' -> {cow['name']} ({cow['id']})")

    def test_06_search_by_breed(self):
        url = f"{BASE_URL}/api/cattle/search?q=" + urllib.parse.quote("Murrah")
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        cows = data.get("data", [])
        self.assertGreaterEqual(len(cows), 2)
        print(f"PASS: Breed search 'Murrah' -> Found {len(cows)} buffaloes: {[c['name'].split()[0] for c in cows]}")

    def test_07_voice_chat_cow_search_kaveri(self):
        payload = json.dumps({"query": "Search cow Kaveri COW-108 details"}).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/voice/chat", data=payload, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode("utf-8"))
        self.assertTrue(data.get("success"))
        self.assertIn("LactoGuard Database", data.get("source"))
        self.assertTrue(data.get("cattle_data"))
        self.assertEqual(data["cattle_data"]["id"], "COW-108")
        self.assertIn("Kaveri", data["response"])
        self.assertIn("8.12", data["response"])
        print("PASS: Voice chat instant cow search -> Kaveri (COW-108) with 4-quarter telemetry")

    def test_08_voice_chat_cow_search_lakshmi(self):
        payload = json.dumps({"query": "tell me details of cow Lakshmi"}).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/voice/chat", data=payload, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode("utf-8"))
        self.assertTrue(data.get("success"))
        self.assertIn("Lakshmi", data.get("response"))
        self.assertEqual(data.get("cattle_data", {}).get("id"), "COW-101")
        print("PASS: Voice chat search -> Lakshmi (COW-101) Healthy status")

    def test_09_static_client_assets(self):
        req = urllib.request.urlopen(f"{BASE_URL}/app.js")
        content = req.read().decode("utf-8")
        self.assertIn("cowSearchInput", content)
        self.assertIn("cow-search-widget", content)
        self.assertIn("cowDossierModalBackdrop", content)
        self.assertIn("renderInChatCattleCard", content)
        self.assertIn("openCowDossier", content)
        print("PASS: Client app.js contains all instant search & dossier logic")


if __name__ == "__main__":
    unittest.main(verbosity=2)
