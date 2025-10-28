"""
Direct test without proxy - just test advanced detection
"""
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from advanced_detection import AdvancedHallucinationDetector

load_dotenv()

async def test_detection():
    print("\n" + "="*80)
    print("🧪 DIRECT ADVANCED DETECTION TEST (No Proxy)")
    print("="*80)
    
    # Initialize detector
    detector = AdvancedHallucinationDetector(mode="balanced")
    
    # Initialize OpenAI client
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Test prompts
    tests = [
        ("What is the capital of France?", "Should be SAFE"),
        ("What is the population of Mars?", "Should be HIGH RISK - hallucination"),
        ("How many moons does Earth have?", "Should catch if wrong"),
    ]
    
    for i, (prompt, expected) in enumerate(tests, 1):
        print(f"\n{'='*80}")
        print(f"TEST {i}/{len(tests)}: {expected}")
        print(f"{'='*80}")
        print(f"❓ Prompt: {prompt}")
        
        # Get response from OpenAI
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        answer = response.choices[0].message.content
        print(f"\n💬 Answer: {answer}")
        
        # Run advanced detection
        print(f"\n🔬 Running advanced detection...")
        detection = await detector.detect(
            prompt=prompt,
            response=answer,
            context=[]
        )
        
        # Display results
        print(f"\n📊 DETECTION RESULTS:")
        print(f"   Risk Level: {detection['risk_level'].upper()}")
        print(f"   Risk Probability: {detection['risk_probability']:.1%}")
        print(f"   Explanation: {detection['explanation']}")
        print(f"   Action: {detection['action']}")
        
        if detection.get('issues_found'):
            print(f"   ⚠️  Issues: {', '.join(detection['issues_found'])}")
        
        # Claims
        if detection.get('claims'):
            claims = detection['claims']
            print(f"\n   📋 Claims Analysis:")
            print(f"      Total: {claims['num_claims']}")
            print(f"      Supported: {claims['num_supported']}")
            print(f"      Contradicted: {claims['num_contradicted']}")
            print(f"      Support Rate: {claims['support_rate']:.0%}")
        
        # Semantic Entropy
        if detection.get('semantic_entropy'):
            entropy = detection['semantic_entropy']
            print(f"\n   🔬 Semantic Entropy: {entropy.get('semantic_entropy', 0):.4f}")
            print(f"      Suspicious: {entropy.get('suspicious', False)}")
        
        # LLM Judge
        if detection.get('llm_judge'):
            judge = detection['llm_judge']
            print(f"\n   ⚖️  LLM Judge: {judge.get('factuality_score', 'N/A')}/10")
            if judge.get('reasoning'):
                print(f"      Reasoning: {judge['reasoning']}")
    
    print("\n" + "="*80)
    print("✅ TEST COMPLETE!")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(test_detection())
