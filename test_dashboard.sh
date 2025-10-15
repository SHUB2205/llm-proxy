#!/bin/bash

echo "🚀 Generating test data for LLM Proxy Dashboard..."

# Short requests
echo "📝 Sending short requests..."
for i in {1..5}; do
  curl -s -X POST http://localhost:8000/proxy/openai/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"Quick fact $i\"}]}" > /dev/null
  echo "  ✓ Short request $i sent"
  sleep 1
done

# Medium requests
echo "📊 Sending medium requests..."
topics=("AI" "Python" "React" "Databases" "Cloud Computing")
for topic in "${topics[@]}"; do
  curl -s -X POST http://localhost:8000/proxy/openai/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"Explain $topic in 2-3 sentences\"}]}" > /dev/null
  echo "  ✓ Medium request about $topic sent"
  sleep 1
done

# Long requests
echo "📚 Sending long requests..."
curl -s -X POST http://localhost:8000/proxy/openai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Write a detailed tutorial on building REST APIs"}]}' > /dev/null
echo "  ✓ Long request 1 sent"
sleep 2

curl -s -X POST http://localhost:8000/proxy/openai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Create a comprehensive guide to database design principles"}]}' > /dev/null
echo "  ✓ Long request 2 sent"

echo "✅ Done! Check your dashboard at http://localhost:3000"