"""
Test script for Advanced Hallucination Detection System
"""

import asyncio
import os
from dotenv import load_dotenv
from advanced_detection import AdvancedHallucinationDetector, DetectionConfig

# Load environment variables from .env file
load_dotenv()

# Set your OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

async def test_fast_mode():
    """Test fast mode (semantic entropy only)"""
    print("\n" + "="*60)
    print("TEST 1: FAST MODE (Semantic Entropy Only)")
    print("="*60)
    
    config = DetectionConfig.fast()
    detector = AdvancedHallucinationDetector(config)
    
    result = await detector.detect(
        question="What is the capital of France?",
        answer="Paris is the capital of France with about 2.1 million people.",
        openai_key=OPENAI_API_KEY
    )
    
    print(f"\n✅ Risk Level: {result['risk_level']}")
    print(f"📊 Risk Probability: {result['risk_probability']}")
    print(f"💡 Explanation: {result['explanation']}")
    print(f"🎯 Action: {result['action']}")
    print(f"\nChecks Run: {result['summary']['checks_run']}")
    print(f"Issues Found: {result['summary']['issues_found']}")


async def test_with_hallucination():
    """Test with a likely hallucination"""
    print("\n" + "="*60)
    print("TEST 2: DETECTING HALLUCINATION")
    print("="*60)
    
    config = DetectionConfig.fast()
    detector = AdvancedHallucinationDetector(config)
    
    # This answer contains a fabricated statistic
    result = await detector.detect(
        question="What is the population of Mars?",
        answer="Mars has a population of approximately 50,000 people living in underground colonies as of 2024.",
        openai_key=OPENAI_API_KEY
    )
    
    print(f"\n✅ Risk Level: {result['risk_level']}")
    print(f"📊 Risk Probability: {result['risk_probability']}")
    print(f"💡 Explanation: {result['explanation']}")
    print(f"🎯 Action: {result['action']}")
    
    if result['semantic_entropy']:
        print(f"\n🔬 Semantic Entropy: {result['semantic_entropy']['semantic_entropy']}")
        print(f"   Suspicious: {result['semantic_entropy']['suspicious']}")
        print(f"   Interpretation: {result['semantic_entropy']['interpretation']}")


async def test_balanced_mode_with_context():
    """Test balanced mode with RAG context"""
    print("\n" + "="*60)
    print("TEST 3: BALANCED MODE WITH CONTEXT")
    print("="*60)
    
    config = DetectionConfig.balanced()
    detector = AdvancedHallucinationDetector(config)
    
    context = [
        "France is a country in Western Europe. Its capital is Paris.",
        "Paris has a population of approximately 2.1 million people within its city limits.",
        "The Paris metropolitan area has about 12 million inhabitants."
    ]
    
    result = await detector.detect(
        question="What is the capital of France and its population?",
        answer="Paris is the capital of France with 2.1 million people in the city.",
        context=context,
        openai_key=OPENAI_API_KEY
    )
    
    print(f"\n✅ Risk Level: {result['risk_level']}")
    print(f"📊 Risk Probability: {result['risk_probability']}")
    print(f"💡 Explanation: {result['explanation']}")
    
    if 'claims' in result:
        print(f"\n📋 Claims Analysis:")
        print(f"   Support Rate: {result['claims']['support_rate']*100:.0f}%")
        print(f"   Total Claims: {result['claims']['num_claims']}")
        print(f"   Supported: {result['claims']['num_supported']}")
        print(f"   Unsupported: {result['claims']['num_unverifiable']}")


async def main():
    """Run all tests"""
    print("\n🚀 ADVANCED HALLUCINATION DETECTION - TEST SUITE")
    print("="*60)
    
    # Check if API key is set
    if OPENAI_API_KEY == "sk-your-key-here":
        print("\n⚠️  WARNING: Please set your OPENAI_API_KEY environment variable")
        print("   export OPENAI_API_KEY='sk-...'")
        print("\n   Or edit this file and replace 'sk-your-key-here' with your key")
        return
    
    try:
        # Run tests
        await test_fast_mode()
        await test_with_hallucination()
        await test_balanced_mode_with_context()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())