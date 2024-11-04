from flask import Flask, request, jsonify
import numpy as np
import cv2
import mediapipe as mp
from tensorflow import keras
import language_tool_python
from models.models.sign_language_translator.my_functions import image_process, draw_landmarks, keypoint_extraction

app = Flask(__name__)

# Load the trained model and initialize language tool
model = keras.models.load_model('model.py') 
tool = language_tool_python.LanguageToolPublicAPI('en-UK')

# Define the actions based on the labels in your model
actions = np.array(['a', 'b'])  

@app.route('/translate', methods=['POST'])
def translate():
    # Get the image file from the request
    image_file = request.files['image']
    image = cv2.imdecode(np.fromstring(image_file.read(), np.uint8), cv2.IMREAD_COLOR)

    # Process the image and extract keypoints
    with mp.solutions.holistic.Holistic(min_detection_confidence=0.75, min_tracking_confidence=0.75) as holistic:
        results = image_process(image, holistic)
        keypoints = keypoint_extraction(results)

        # Prepare data for prediction
        keypoints = np.array([keypoints])
        prediction = model.predict(keypoints)
        if np.amax(prediction) > 0.9:
            action = actions[np.argmax(prediction)]
        else:
            action = "Unknown"

    # Grammar check if needed
    grammar_result = tool.correct(action)

    return jsonify({"translation": grammar_result})

if __name__ == '__main__':
    app.run(port=3000)
