import re
from typing import List, Dict, Any
from g2p_en import G2p

class PhonemeService:
    def __init__(self):
        self.g2p_engine = None

    def _lazy_load(self):
        if self.g2p_engine is None:
            print("Initializing g2p-en engine...")
            self.g2p_engine = G2p()
            print("g2p-en engine initialized.")

    def word_to_phonemes(self, word: str) -> List[str]:
        """
        Translates a single word to a list of ARPAbet phonemes (with stress digits stripped).
        """
        self._lazy_load()
        if not word.strip():
            return []
            
        # Run g2p
        raw_phonemes = self.g2p_engine(word)
        
        cleaned_phonemes = []
        for ph in raw_phonemes:
            ph_clean = ph.strip()
            # Filter spacing or punctuation returned by g2p-en
            if not ph_clean or ph_clean == '-' or not re.match(r'^[A-Za-z0-9]+$', ph_clean):
                continue
            # Strip stress numbers (e.g. IH1 -> IH)
            ph_no_stress = re.sub(r'\d+', '', ph_clean)
            cleaned_phonemes.append(ph_no_stress)
            
        return cleaned_phonemes

    def forced_align_phonemes(
        self,
        word: str,
        start_time: float,
        end_time: float,
        word_confidence: int
    ) -> List[Dict[str, Any]]:
        """
        Translates a word to phonemes and interpolates timing boundaries linearly
        across the word's active speech duration.
        """
        phonemes = self.word_to_phonemes(word)
        if not phonemes:
            return []
            
        num_phonemes = len(phonemes)
        duration = max(0.0, end_time - start_time)
        dt = duration / num_phonemes
        
        aligned_phonemes = []
        for idx, ph in enumerate(phonemes):
            ph_start = start_time + idx * dt
            ph_end = start_time + (idx + 1) * dt
            
            aligned_phonemes.append({
                "phoneme": ph,
                "start_time": round(ph_start, 3),
                "end_time": round(ph_end, 3),
                "confidence": word_confidence
            })
            
        return aligned_phonemes

# Singleton instance
phoneme_service = PhonemeService()
