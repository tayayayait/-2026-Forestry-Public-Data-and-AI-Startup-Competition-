import cv2
from PIL import Image
import os
import sys

def convert(input_path, output_path, fps_target=20, max_width=1280):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    print(f"Loading video from {input_path}...")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Error opening video stream")
        return

    orig_fps = cap.get(cv2.CAP_PROP_FPS)
    if orig_fps == 0: orig_fps = 30
    frame_skip = max(1, int(orig_fps / fps_target))
    
    frames = []
    count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if count % frame_skip == 0:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            if pil_img.width > max_width:
                ratio = max_width / pil_img.width
                new_size = (max_width, int(pil_img.height * ratio))
                pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)
            frames.append(pil_img)
        count += 1
        
    cap.release()
    print(f"Extracted {len(frames)} frames. Saving as WebP...")
    
    if frames:
        duration = int(1000 / (orig_fps / frame_skip))
        frames[0].save(output_path, format='WebP', append_images=frames[1:],
                       save_all=True, duration=duration, loop=0, quality=85, method=4)
        print("Done!")
    else:
        print("No frames were extracted.")

convert('배경영상.mp4', '배경영상.webp')
