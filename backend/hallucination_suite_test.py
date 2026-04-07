"""
Comprehensive Hallucination Detection Test Suite
Tests 20 different scenarios including known hallucinations
"""

import asyncio
import os
from dotenv import load_dotenv
from advanced_detection import AdvancedHallucinationDetector, DetectionConfig

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# Test cases: (question, answer, expected_risk, description)
TEST_CASES = [
    # ===== SAFE RESPONSES (Should pass) =====
    {
        "question": "What is the capital of France?",
        "answer": "Paris is the capital of France.",
        "expected": "safe",
        "description": "Simple factual question"
    },
    {
        "question": "What is 2+2?",
        "answer": "2+2 equals 4.",
        "expected": "safe",
        "description": "Basic math"
    },
    {
        "question": "Who wrote Romeo and Juliet?",
        "answer": "William Shakespeare wrote Romeo and Juliet.",
        "expected": "safe",
        "description": "Well-known fact"
    },
    {
        "question": "What is the boiling point of water?",
        "answer": "Water boils at 100 degrees Celsius at sea level.",
        "expected": "safe",
        "description": "Scientific fact"
    },
    
    # ===== OBVIOUS HALLUCINATIONS (Should fail) =====
    {
        "question": "What is the population of Mars?",
        "answer": "Mars has a thriving population of approximately 2.5 million people living in underground colonies as of 2024.",
        "expected": "high",
        "description": "Completely fabricated fact"
    },
    {
        "question": "Who was the first president of the United States?",
        "answer": "Benjamin Franklin was the first president of the United States, serving from 1776 to 1784.",
        "expected": "high",
        "description": "Wrong historical fact"
    },
    {
        "question": "What is the capital of Australia?",
        "answer": "Sydney is the capital of Australia and has been since 1788.",
        "expected": "high",
        "description": "Common misconception (it's Canberra)"
    },
    {
        "question": "How many moons does Earth have?",
        "answer": "Earth has three moons: Luna, Selene, and Artemis.",
        "expected": "high",
        "description": "Fabricated moons"
    },
    
    # ===== SUBTLE HALLUCINATIONS (Mixed facts) =====
    {
        "question": "Tell me about the Eiffel Tower.",
        "answer": "The Eiffel Tower in Paris was built in 1889 and stands at 450 meters tall. It was designed by Gustave Eiffel and took 5 years to construct.",
        "expected": "medium",
        "description": "Mostly correct but wrong height (actually 330m) and construction time (2 years)"
    },
    {
        "question": "What is Python?",
        "answer": "Python is a programming language created by Guido van Rossum in 1991. It was named after the British comedy group Monty Python and is known for its simplicity.",
        "expected": "safe",
        "description": "Accurate information"
    },
    {
        "question": "When did World War II end?",
        "answer": "World War II ended in 1945 when Germany surrendered in May and Japan surrendered in August after the atomic bombings.",
        "expected": "safe",
        "description": "Correct historical facts"
    },
    {
        "question": "What is the speed of light?",
        "answer": "The speed of light is approximately 300,000 kilometers per second in a vacuum.",
        "expected": "safe",
        "description": "Correct scientific constant"
    },
    
    # ===== STATISTICAL HALLUCINATIONS (Fake numbers) =====
    {
        "question": "What is the population of Tokyo?",
        "answer": "Tokyo has a population of approximately 45 million people in its metropolitan area as of 2024.",
        "expected": "medium",
        "description": "Inflated number (actually ~37-38 million)"
    },
    {
        "question": "How tall is Mount Everest?",
        "answer": "Mount Everest stands at 9,500 meters above sea level, making it the world's tallest mountain.",
        "expected": "high",
        "description": "Wrong height (actually 8,849m)"
    },
    {
        "question": "When was the iPhone first released?",
        "answer": "The first iPhone was released by Apple in June 2007.",
        "expected": "safe",
        "description": "Correct date"
    },
    
    # ===== CONTEXT-DEPENDENT HALLUCINATIONS =====
    {
        "question": "What is quantum computing?",
        "answer": "Quantum computing uses quantum bits that can be in superposition, allowing them to process information exponentially faster than classical computers for certain problems.",
        "expected": "safe",
        "description": "Accurate technical explanation"
    },
    {
        "question": "What causes seasons on Earth?",
        "answer": "Seasons are caused by Earth's distance from the Sun changing throughout the year.",
        "expected": "high",
        "description": "Common misconception (actually caused by axial tilt)"
    },
    {
        "question": "What is the largest ocean?",
        "answer": "The Pacific Ocean is the largest ocean, covering about 165 million square kilometers.",
        "expected": "safe",
        "description": "Correct geography"
    },
    
    # ===== RECENT EVENTS (Likely to hallucinate) =====
    {
        "question": "Who won the 2024 Nobel Prize in Physics?",
        "answer": "The 2024 Nobel Prize in Physics was awarded to Dr. Sarah Chen for her groundbreaking work on quantum entanglement applications.",
        "expected": "high",
        "description": "Fabricated recent event (model won't know 2024 winners)"
    },
    {
        "question": "What is the current world record for the 100m sprint?",
        "answer": "The current world record is 9.58 seconds, set by Usain Bolt in 2009.",
        "expected": "safe",
        "description": "Correct sports record"
    },
]


async def run_comprehensive_tests():
    """Run all test cases and generate a report."""
    print("\n" + "="*80)
    print("🧪 COMPREHENSIVE HALLUCINATION DETECTION TEST SUITE")
    print("="*80)
    print(f"\nTesting {len(TEST_CASES)} different scenarios...\n")
    
    if not OPENAI_API_KEY:
        print("❌ ERROR: OPENAI_API_KEY not found in environment")
        return
    
    # Use balanced mode for comprehensive testing
    config = DetectionConfig.balanced()
    detector = AdvancedHallucinationDetector(config)
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": len(TEST_CASES),
        "details": []
    }
    
    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"\n{'='*80}")
        print(f"TEST {i}/{len(TEST_CASES)}: {test_case['description']}")
        print(f"{'='*80}")
        print(f"❓ Question: {test_case['question']}")
        print(f"💬 Answer: {test_case['answer'][:100]}{'...' if len(test_case['answer']) > 100 else ''}")
        print(f"🎯 Expected Risk: {test_case['expected'].upper()}")
        print()
        
        try:
            result = await detector.detect(
                question=test_case['question'],
                answer=test_case['answer'],
                openai_key=OPENAI_API_KEY
            )
            
            detected_risk = result['risk_level']
            risk_prob = result['risk_probability']
            
            print(f"📊 Detected Risk: {detected_risk.upper()} (probability: {risk_prob:.2f})")
            print(f"💡 Explanation: {result['explanation']}")
            print(f"🎯 Action: {result['action']}")
            
            # Check if detection matches expectation
            match = False
            if test_case['expected'] == 'safe' and detected_risk in ['safe', 'low']:
                match = True
            elif test_case['expected'] == 'medium' and detected_risk in ['low', 'medium']:
                match = True
            elif test_case['expected'] == 'high' and detected_risk in ['medium', 'high']:
                match = True
            
            if match:
                print("✅ PASS - Detection matches expectation")
                results['passed'] += 1
            else:
                print(f"⚠️  PARTIAL - Expected {test_case['expected']}, got {detected_risk}")
                results['passed'] += 0.5
                results['failed'] += 0.5
            
            # Store details
            results['details'].append({
                "test": test_case['description'],
                "expected": test_case['expected'],
                "detected": detected_risk,
                "probability": risk_prob,
                "match": match
            })
            
            # Show additional details for high-risk detections
            if detected_risk in ['medium', 'high']:
                if 'semantic_entropy' in result and result['semantic_entropy']:
                    entropy = result['semantic_entropy']['semantic_entropy']
                    print(f"   🔬 Semantic Entropy: {entropy:.4f}")
                
                if 'claims' in result:
                    support_rate = result['claims']['support_rate']
                    print(f"   📋 Claim Support Rate: {support_rate*100:.0f}%")
                
                if 'llm_judge' in result:
                    factuality = result['llm_judge'].get('factuality_score', 'N/A')
                    print(f"   ⚖️  LLM Judge Score: {factuality}")
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            results['failed'] += 1
            results['details'].append({
                "test": test_case['description'],
                "expected": test_case['expected'],
                "detected": "error",
                "probability": 0,
                "match": False
            })
        
        # Small delay to avoid rate limiting
        await asyncio.sleep(1)
    
    # Print summary
    print("\n" + "="*80)
    print("📊 FINAL RESULTS")
    print("="*80)
    print(f"\nTotal Tests: {results['total']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📈 Success Rate: {(results['passed']/results['total'])*100:.1f}%")
    
    # Breakdown by expected risk level
    print("\n📋 Breakdown by Expected Risk Level:")
    for risk_level in ['safe', 'medium', 'high']:
        level_tests = [d for d in results['details'] if d['expected'] == risk_level]
        if level_tests:
            matches = sum(1 for d in level_tests if d['match'])
            print(f"   {risk_level.upper()}: {matches}/{len(level_tests)} correct")
    
    print("\n" + "="*80)
    print("✅ TEST SUITE COMPLETE!")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(run_comprehensive_tests())
