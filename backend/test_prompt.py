import requests
body = {
    'model': 'tinyllama',
    'system': '''You are a helpful AI assistant analyzing product reviews for the iPhone.
RULES:
- Answer ONLY based on provided context.
- Assume all user questions are about the iPhone reviews provided in the context.
- If the context doesn't contain the answer, say "Not enough data".
- Keep answers simple and clear.''',
    'prompt': '''Please read the Context below and answer the Question. If the answer is not in the Context, say "Not enough data".

Context:
- The camera is amazing and takes great photos.
- Best camera on a phone so far.
- Camera quality drops in low light.

Question: how is the camera quality?

Answer:''',
    'stream': False
}
print(requests.post('http://localhost:11434/api/generate', json=body).json().get('response', 'error'))
