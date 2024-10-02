# main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from face_recognition import FaceRecognitionService
import cv2
import numpy as np
import uvicorn
import logging as log
from typing import List

app = FastAPI(title="Face Recognition API")

# Configure logging
log.basicConfig(level=log.INFO)

# Initialize FaceRecognitionService at startup
@app.on_event("startup")
def load_models():
    global face_recognition_service
    models_paths = {
        'fd': 'models/face_detection.xml',
        'lm': 'models/landmarks_detection.xml',
        'reid': 'models/face_reid.xml'
    }
    face_recognition_service = FaceRecognitionService(
        models_paths=models_paths,
        device='CPU',
        t_fd=0.6,
        t_id=0.3,
        match_algo='HUNGARIAN',
        gallery_path='gallery/',
        run_detector=True
    )
    log.info("FaceRecognitionService initialized.")

@app.post("/recognize")
async def recognize_faces(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid image file.")

    # Read image file
    image_bytes = await file.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    # Perform face recognition
    try:
        rois, landmarks, identities = face_recognition_service.recognize_faces(img)
    except Exception as e:
        log.error(f"Error during face recognition: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # Prepare response
    results = []
    for roi, lm, identity in zip(rois, landmarks, identities):
        face_info = {
            "bounding_box": {
                "xmin": int(roi.position[0]),
                "ymin": int(roi.position[1]),
                "xmax": int(roi.position[0] + roi.size[0]),
                "ymax": int(roi.position[1] + roi.size[1]),
            },
            "landmarks": [{"x": float(p[0]), "y": float(p[1])} for p in lm],
            "identity": {
                "id": identity.id,
                "label": face_recognition_service.face_identifier.get_identity_label(identity.id),
                "confidence": float(1 - identity.distance) if identity.id != face_recognition_service.face_identifier.UNKNOWN_ID else None
            }
        }
        results.append(face_info)

    return JSONResponse(content={"faces": results})

@app.get("/")
def read_root():
    return {"message": "Welcome to the Face Recognition API. Use the /recognize endpoint to upload images."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
