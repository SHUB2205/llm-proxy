"""
Enhanced Hallucination Detection with Context/RAG
This version provides ground truth context to improve detection accuracy
"""

import asyncio
import os
from dotenv import load_dotenv
from advanced_detection import AdvancedHallucinationDetector, DetectionConfig

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# Test cases with context for verification
TEST_CASES = [
    # ===== HALLUCINATIONS WITH CONTEXT =====
    {
        "question": "What is the population of Mars?",
        "answer": "Mars has a thriving population of approximately 2.5 million people living in underground colonies as of 2024.",
        "context": [
            "Mars is a planet in our solar system.",
            "As of 2024, Mars has no permanent human population.",
            "Mars is currently uninhabited by humans, though several robotic missions have been sent there.",
            "NASA and other space agencies are planning future manned missions to Mars."
        ],
        "expected": "high",
        "description": "Fabricated Mars population"
    },
    {
        "question": "Who was the first president of the United States?",
        "answer": "Benjamin Franklin was the first president of the United States, serving from 1776 to 1784.",
        "context": [
            "George Washington was the first President of the United States.",
            "George Washington served as president from 1789 to 1797.",
            "Benjamin Franklin was a Founding Father but never served as president.",
            "The United States presidency began in 1789, not 1776."
        ],
        "expected": "high",
        "description": "Wrong president"
    },
    {
        "question": "What is the capital of Australia?",
        "answer": "Sydney is the capital of Australia and has been since 1788.",
        "context": [
            "Canberra is the capital city of Australia.",
            "Canberra became the capital in 1913.",
            "Sydney is the largest city in Australia but not the capital.",
            "The capital was moved from Melbourne to Canberra in 1927."
        ],
        "expected": "high",
        "description": "Wrong capital"
    },
    {
        "question": "How many moons does Earth have?",
        "answer": "Earth has three moons: Luna, Selene, and Artemis.",
        "context": [
            "Earth has one natural satellite, commonly called the Moon.",
            "The Moon is Earth's only natural satellite.",
            "Luna is another name for Earth's moon, not a separate moon.",
            "Selene and Artemis are mythological names, not actual moons of Earth."
        ],
        "expected": "high",
        "description": "Fabricated moons"
    },
    
    # ===== CORRECT ANSWERS WITH CONTEXT =====
    {
        "question": "What is the capital of France?",
        "answer": "Paris is the capital of France.",
        "context": [
            "Paris is the capital and largest city of France.",
            "Paris has been the capital of France for centuries.",
            "The city of Paris is located in northern France."
        ],
        "expected": "safe",
        "description": "Correct capital"
    },
    {
        "question": "When did World War II end?",
        "answer": "World War II ended in 1945 when Germany surrendered in May and Japan surrendered in August.",
        "context": [
            "World War II ended in 1945.",
            "Germany surrendered on May 8, 1945 (V-E Day).",
            "Japan surrendered on August 15, 1945 (V-J Day).",
            "The formal surrender of Japan was signed on September 2, 1945."
        ],
        "expected": "safe",
        "description": "Correct historical fact"
    },
    
    # ===== SUBTLE HALLUCINATIONS =====
    {
        "question": "Tell me about the Eiffel Tower.",
        "answer": "The Eiffel Tower in Paris was built in 1889 and stands at 450 meters tall.",
        "context": [
            "The Eiffel Tower was completed in 1889 for the World's Fair.",
            "The Eiffel Tower is 330 meters (1,083 feet) tall.",
            "The tower was designed by Gustave Eiffel.",
            "It took about 2 years to construct the Eiffel Tower."
        ],
        "expected": "medium",
        "description": "Correct year, wrong height"
    },
    {
        "question": "What causes seasons on Earth?",
        "answer": "Seasons are caused by Earth's distance from the Sun changing throughout the year.",
        "context": [
            "Seasons are caused by Earth's axial tilt of 23.5 degrees.",
            "Earth's distance from the Sun varies slightly but this is not the primary cause of seasons.",
            "The tilt of Earth's axis causes different hemispheres to receive varying amounts of sunlight.",
            "When the Northern Hemisphere is tilted toward the Sun, it experiences summer."
        ],
        "expected": "high",
        "description": "Common misconception about seasons"
    },
    {
        "question": "What is the speed of light?",
        "answer": "The speed of light is approximately 300,000 kilometers per second in a vacuum.",
        "context": [
            "The speed of light in a vacuum is exactly 299,792,458 meters per second.",
            "This is approximately 300,000 km/s or 186,000 miles per second.",
            "The speed of light is a fundamental constant in physics.",
            "Light travels slower in materials like water or glass."
        ],
        "expected": "safe",
        "description": "Approximately correct scientific constant"
    },
    {
        "question": "How tall is Mount Everest?",
        "answer": "Mount Everest stands at 9,500 meters above sea level.",
        "context": [
            "Mount Everest is 8,848.86 meters (29,031.7 feet) tall.",
            "It is the highest mountain on Earth above sea level.",
            "The height was most recently measured in 2020.",
            "Mount Everest is located in the Himalayas on the border of Nepal and Tibet."
        ],
        "expected": "high",
        "description": "Significantly wrong height"
    },
]


async def run_context_tests():
    """Run tests with context for better detection."""
    print("\n" + "="*80)
    print("🧪 CONTEXT-BASED HALLUCINATION DETECTION TEST")
    print("="*80)
    print(f"\nTesting {len(TEST_CASES)} scenarios with ground truth context...\n")
    
    if not OPENAI_API_KEY:
        print("❌ ERROR: OPENAI_API_KEY not found")
        return
    
    config = DetectionConfig.balanced()
    detector = AdvancedHallucinationDetector(config)
    
    results = {"passed": 0, "failed": 0, "total": len(TEST_CASES)}
    
    for i, test in enumerate(TEST_CASES, 1):
        print(f"\n{'='*80}")
        print(f"TEST {i}/{len(TEST_CASES)}: {test['description']}")
        print(f"{'='*80}")
        print(f"❓ Question: {test['question']}")
        print(f"💬 Answer: {test['answer'][:80]}{'...' if len(test['answer']) > 80 else ''}")
        print(f"📚 Context: {len(test['context'])} reference documents")
        print(f"🎯 Expected: {test['expected'].upper()}")
        print()
        
        try:
            result = await detector.detect(
                question=test['question'],
                answer=test['answer'],
                context=test['context'],  # Provide ground truth
                openai_key=OPENAI_API_KEY
            )
            
            risk = result['risk_level']
            prob = result['risk_probability']
            
            print(f"📊 Detected: {risk.upper()} (probability: {prob:.2f})")
            print(f"💡 {result['explanation']}")
            
            # Show claim analysis
            if 'claims' in result:
                claims = result['claims']
                print(f"\n📋 Claim Analysis:")
                print(f"   Total Claims: {claims['num_claims']}")
                print(f"   Supported: {claims['num_supported']}")
                print(f"   Contradicted: {claims['num_contradicted']}")
                print(f"   Unverifiable: {claims['num_unverifiable']}")
                print(f"   Support Rate: {claims['support_rate']*100:.0f}%")
                
                if claims['num_contradicted'] > 0:
                    print(f"   ⚠️  {claims['num_contradicted']} claims CONTRADICT the context!")
            
            # Show entropy if available
            if 'semantic_entropy' in result and result['semantic_entropy']:
                entropy = result['semantic_entropy']['semantic_entropy']
                print(f"\n🔬 Semantic Entropy: {entropy:.4f}")
            
            # Evaluate result
            match = False
            if test['expected'] == 'safe' and risk in ['safe', 'low']:
                match = True
            elif test['expected'] == 'medium' and risk in ['low', 'medium']:
                match = True
            elif test['expected'] == 'high' and risk in ['medium', 'high']:
                match = True
            
            if match:
                print(f"\n✅ PASS")
                results['passed'] += 1
            else:
                print(f"\n⚠️  MISS - Expected {test['expected']}, got {risk}")
                results['failed'] += 1
                
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            results['failed'] += 1
        
        await asyncio.sleep(0.5)
    
    # Summary
    print("\n" + "="*80)
    print("📊 FINAL RESULTS")
    print("="*80)
    print(f"Total: {results['total']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📈 Accuracy: {(results['passed']/results['total'])*100:.1f}%")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(run_context_tests())
