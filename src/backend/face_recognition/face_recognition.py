# face_recognition_service.py

import logging as log
from openvino import Core
from utils import crop
from landmarks_detector import LandmarksDetector
from face_detector import FaceDetector
from faces_database import FacesDatabase
from face_identifier import FaceIdentifier

class FaceRecognitionService:
    def __init__(self, models_paths, device='CPU', t_fd=0.6, t_id=0.3, match_algo='HUNGARIAN', gallery_path='', run_detector=False):
        log.info('Initializing Face Recognition Service')
        self.core = Core()

        # Initialize models
        self.face_detector = FaceDetector(self.core, models_paths['fd'], confidence_threshold=t_fd)
        self.landmarks_detector = LandmarksDetector(self.core, models_paths['lm'])
        self.face_identifier = FaceIdentifier(self.core, models_paths['reid'], match_threshold=t_id, match_algo=match_algo)

        # Deploy models
        self.face_detector.deploy(device)
        self.landmarks_detector.deploy(device)
        self.face_identifier.deploy(device)

        # Initialize Faces Database
        log.debug(f'Building faces database using images from {gallery_path}')
        self.faces_database = FacesDatabase(gallery_path, self.face_identifier,
                                            self.landmarks_detector,
                                            self.face_detector if run_detector else None)
        self.face_identifier.set_faces_database(self.faces_database)
        log.info(f'Database is built, registered {len(self.faces_database)} identities')

    def recognize_faces(self, frame):
        rois = self.face_detector.infer((frame,))
        landmarks = self.landmarks_detector.infer((frame, rois))
        face_identities, unknowns = self.face_identifier.infer((frame, rois, landmarks))
        return rois, landmarks, face_identities

    def draw_detections(self, frame, rois, landmarks, identities):
        for roi, lm, identity in zip(rois, landmarks, identities):
            text = self.face_identifier.get_identity_label(identity.id)
            if identity.id != FaceIdentifier.UNKNOWN_ID:
                text += f' {100.0 * (1 - identity.distance):.2f}%'

            xmin = max(int(roi.position[0]), 0)
            ymin = max(int(roi.position[1]), 0)
            xmax = min(int(roi.position[0] + roi.size[0]), frame.shape[1])
            ymax = min(int(roi.position[1] + roi.size[1]), frame.shape[0])

            cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (0, 220, 0), 2)

            for point in lm:
                x = xmin + int(roi.size[0] * point[0])
                y = ymin + int(roi.size[1] * point[1])
                cv2.circle(frame, (x, y), 2, (0, 255, 255), -1)

            cv2.putText(frame, text, (xmin, ymin - 10), cv2.FONT_HERSHEY
