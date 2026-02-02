"""Generate demo image for landing page using fal.ai FLUX."""
import os
import httpx
import fal_client
from dotenv import load_dotenv

load_dotenv()

# Set FAL_KEY from .env (it might be named FAL_API_KEY)
fal_key = os.getenv("FAL_KEY") or os.getenv("FAL_API_KEY")
if fal_key:
    os.environ["FAL_KEY"] = fal_key

# Prompt for beautiful pizzeria scene
PROMPT = """
Professional food photography of an authentic Italian pizzeria scene.
A delicious Neapolitan pizza with melted mozzarella, fresh basil, and tomatoes
sits on a rustic wooden table. In the background, warm ambient lighting,
wine glasses with red wine, and the glow of a traditional wood-fired oven.
Cozy Italian restaurant atmosphere with brick walls and warm colors.
High-end commercial photography style, appetizing, inviting, 8k quality.
"""

def generate_image():
    print("Generating demo image with FLUX Pro...")

    result = fal_client.subscribe(
        "fal-ai/flux-pro/v1.1",
        arguments={
            "prompt": PROMPT,
            "image_size": "square_hd",
            "num_images": 1,
            "enable_safety_checker": True,
            "safety_tolerance": "2"
        }
    )

    image_url = result["images"][0]["url"]
    print(f"Image generated: {image_url}")

    # Download image
    print("Downloading image...")
    response = httpx.get(image_url)

    output_path = "app/static/images/demo-pizza.jpg"
    with open(output_path, "wb") as f:
        f.write(response.content)

    print(f"Image saved to: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_image()
