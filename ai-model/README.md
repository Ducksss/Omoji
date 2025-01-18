## Getting Started
1. Install UV on your machine [here](https://docs.astral.sh/uv/getting-started/installation/).
2. Install dependencies.
```bash
uv run install
```
3. Expose the HTTP server.
```bash
uv run -- python main.py
```

4. Send curl request of base64 image to the server.
```bash
curl -X POST -H "Content-Type: application/json" -d '{"image": "base64_image"}' http://localhost:8000/image-to-emoji

curl -X POST -H "Content-Type: application/json" -d '{"image": "base64_image"}' http://localhost:8000/generate-image
```
