import os
from PIL import Image

def optimize_assets(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(input_dir, filename)
            with Image.open(img_path) as img:
                # Resize to 1080p max (1920x1080)
                img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
                
                # Output path (WebP)
                output_filename = os.path.splitext(filename)[0] + ".webp"
                output_path = os.path.join(output_dir, output_filename)
                
                # Save as WebP
                img.save(output_path, "WEBP", quality=85)
                print(f"Processed: {filename} -> {output_filename}")

if __name__ == "__main__":
    optimize_assets("raw_assets", "web-visual-novel/public/assets/images")
