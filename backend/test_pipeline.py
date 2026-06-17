import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add workspace directory to path so we can import backend packages correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.services.phoneme_service import phoneme_service
from backend.services.whisper_service import whisper_service
from backend.services.pronunciation_service import pronunciation_service
from backend.database.connection import get_db

class TestPronunciationCoaching(unittest.TestCase):
    
    def test_g2p_word_conversion(self):
        """
        Verify that expected word converts to ARPAbet phonemes
        and stress digits are stripped.
        """
        word = "three"
        phonemes = phoneme_service.word_to_phonemes(word)
        print(f"\n[Test G2P] '{word}' -> {phonemes}")
        
        # 'three' in ARPAbet: ['TH', 'R', 'IY1']
        # Stripped should be: ['TH', 'R', 'IY']
        self.assertEqual(phonemes, ["TH", "R", "IY"])
        
        # Check digit stripping
        for ph in phonemes:
            self.assertFalse(any(char.isdigit() for char in ph))

    def test_forced_linear_alignment(self):
        """
        Verify linear forced time alignment distributes word duration
        and assigns confidence correctly to phonemes.
        """
        word = "three"
        start_time = 1.0
        end_time = 1.6
        confidence = 90
        
        aligned = phoneme_service.forced_align_phonemes(
            word=word,
            start_time=start_time,
            end_time=end_time,
            word_confidence=confidence
        )
        print(f"[Test Align] Word: '{word}' (1.0s - 1.6s) -> {aligned}")
        
        self.assertEqual(len(aligned), 3) # 'TH', 'R', 'IY'
        self.assertEqual(aligned[0]["phoneme"], "TH")
        self.assertEqual(aligned[0]["start_time"], 1.0)
        self.assertEqual(aligned[0]["end_time"], 1.2) # (1.6 - 1.0) / 3 = 0.2s duration
        self.assertEqual(aligned[0]["confidence"], 90)
        
        self.assertEqual(aligned[2]["phoneme"], "IY")
        self.assertEqual(aligned[2]["start_time"], 1.4)
        self.assertEqual(aligned[2]["end_time"], 1.6)

    def test_database_connection(self):
        """
        Verify database connection connects to MongoDB or prints local fallback warn.
        """
        db = get_db()
        if db is not None:
            print("[Test DB] MongoDB connection is active and healthy.")
            self.assertEqual(db.client.admin.command('ping')['ok'], 1.0)
        else:
            print("[Test DB] MongoDB connection is offline. Running in JSON fallback mode.")

class TestFastAPIRoutes(unittest.TestCase):
    
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        """
        Verify root status endpoint is reachable.
        """
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "online")

    def test_history_endpoint(self):
        """
        Verify history retrieval format.
        """
        response = self.client.get("/history")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

if __name__ == "__main__":
    unittest.main()
