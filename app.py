import os
import numpy as np
from PIL import Image
import cv2
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Ensure uploads directory exists (needed on ephemeral filesystems like Render)
os.makedirs(os.path.join(os.path.dirname(__file__), 'uploads'), exist_ok=True)

# ── Model loading (synchronous — runs at startup before gunicorn forks) ───────
# gunicorn is started with --preload so this block executes once in the master
# process and the loaded model is shared across all workers via fork().
print("Loading TensorFlow...", flush=True)
import tensorflow as tf
print(f"TensorFlow {tf.__version__} loaded.", flush=True)

_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'BrainTumor10Epochs.h5')
print(f"Loading model from {_MODEL_PATH} ...", flush=True)

model = None
model_ready = False
model_error = None

try:
    model = tf.keras.models.load_model(_MODEL_PATH)
    # Warm-up: one dummy pass so the first real request is instant
    _dummy = np.zeros((1, 64, 64, 3), dtype=np.float32)
    model.predict(_dummy, verbose=0)
    model_ready = True
    print("Model loaded and warmed up. Ready.", flush=True)
except Exception as _exc:
    import traceback
    model_error = str(_exc)
    print(f"Model load ERROR: {_exc}", flush=True)
    traceback.print_exc()


# ── Brain MRI Validation ────────────────────────────────────────────────────

def is_valid_brain_image(file_path):
    """
    6-Gate Brain MRI Validation Pipeline  (Balanced — v3)
    ───────────────────────────────────────────────────────
    Designed so that real brain MRI images reliably PASS and obvious
    non-brain images reliably FAIL.  Trade-offs are documented below.

    Gate 1 │ Resolution ≥ 100×100 px
    Gate 2 │ Grayscale channels: max mean(|R-G|, |R-B|, |G-B|) < 13
            │  → rejects coloured cartoons, logos, natural colour photos
            │  Threshold 13 also catches screenshots with any coloured
            │  browser/app UI chrome (teal icons, red title bars, etc.).
    Gate 3 │ Canny edge density < 20 %
            │  → rejects text-heavy documents, menus, receipts.
            │  Brain sulci/gyri push real MRI edge density to 10–17 %;
            │  text documents typically exceed 20 %.
    Gate 4 │ Grayscale mean in [10, 210]  AND  std-dev ≥ 15
            │  → rejects pitch-black fills, pure-white pages, flat images.
            │  Very lenient range because MRI exposure/window varies widely.
    Gate 5 │ Dark-pixel fraction (brightness < 30) in [10 %, 65 %]
            │  Lower bound: real MRI always have a dark background (≥ 10 %).
            │  UPPER bound (NEW): dark-themed screenshots, dark wallpapers,
            │  and code-editor captures have 70–90 % near-black pixels.
            │  Real brain MRI: brain tissue fills 30–70 % of the image,
            │  so dark fraction stays comfortably below 65 %.
    Gate 6 │ Brain-blob detection via morphological closing:
            │  (a) At least ONE significant bright region after merging
            │  (b) Dominant merged blob covers ≥ 25 % of image
            │      Brain cross-section occupies 30–70 % of a real MRI scan.
            │      Screenshot content blobs are typically < 25 % of the
            │      total captured screen area.
            │  (c) Blob fill-ratio (area / bounding-box) ≥ 0.30
            │
            │  WHY morphological closing?
            │  Raw thresholding fragments the brain: sulci (dark folds),
            │  ventricles, and the falx cerebri (mid-line dark gap) split
            │  bright brain tissue into 20–80 pieces.  A large closing
            │  kernel merges these back into one dominant blob, revealing
            │  the characteristic oval brain shape.
            │  After closing, text-documents produce many thin horizontal
            │  bands → low fill-ratio; brain produces a compact oval blob
            │  → high fill-ratio.
    """
    try:
        # ── Load ──────────────────────────────────────────────────────────────
        img_bgr = cv2.imread(file_path)
        if img_bgr is None:
            return False
        h, w = img_bgr.shape[:2]

        # ── Gate 1: Resolution ────────────────────────────────────────────────
        if h < 100 or w < 100:
            return False

        # ── Gate 2: Grayscale channel similarity ──────────────────────────────
        b = img_bgr[:, :, 0].astype(np.int32)
        g = img_bgr[:, :, 1].astype(np.int32)
        r = img_bgr[:, :, 2].astype(np.int32)
        max_ch_diff = max(
            float(np.mean(np.abs(r - g))),
            float(np.mean(np.abs(r - b))),
            float(np.mean(np.abs(g - b)))
        )
        if max_ch_diff > 13:       # tightened 15 → 13
            return False

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # ── Gate 3: Edge density ──────────────────────────────────────────────
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0)) / (h * w)
        if edge_density > 0.20:        # 0.22 → 0.20
            return False

        # ── Gate 4: Intensity statistics ──────────────────────────────────────
        mean_val = float(np.mean(gray))
        std_val  = float(np.std(gray))
        if mean_val < 10 or mean_val > 210:
            return False
        if std_val < 15:
            return False

        # ── Gate 5: Dark-pixel fraction (bounded range) ──────────────────────
        dark_frac = float(np.sum(gray < 30)) / (h * w)
        # Lower bound: real MRI must have some dark background
        # Upper bound: dark screenshots / wallpapers have 70-90 % dark pixels;
        #              brain tissue in MRI always creates a substantial
        #              bright region keeping dark_frac below 65 %
        if dark_frac < 0.10 or dark_frac > 0.65:
            return False

        # ── Gate 6: Brain-blob detection (morphological closing) ──────────────
        # Step A: Threshold — isolate bright (brain) tissue
        _, binary = cv2.threshold(gray, 25, 255, cv2.THRESH_BINARY)

        # Step B: Morphological closing — merge brain fragments caused by
        #   sulci, ventricles, and the interhemispheric fissure back into
        #   one continuous oval blob.
        #   Kernel size is proportional to image size (≈ 4 % of smaller dim).
        k = max(9, min(h, w) // 25)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        merged = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        # Step C: Connected components on the MERGED image
        n_labels, labels, cc_stats, _ = cv2.connectedComponentsWithStats(
            merged, connectivity=8
        )

        # Ignore tiny specks (< 1 % of image)
        min_area = h * w * 0.01
        sig = [
            i for i in range(1, n_labels)
            if cc_stats[i, cv2.CC_STAT_AREA] >= min_area
        ]

        # (a) Must have at least one significant merged region
        if not sig:
            return False

        # (b) Dominant blob must cover ≥ 25 % of image
        #     Brain cross-section: 30–70 % of scan.
        #     Screenshot content blobs: typically < 25 % of total screen.
        best_i = max(sig, key=lambda i: cc_stats[i, cv2.CC_STAT_AREA])
        best_area = int(cc_stats[best_i, cv2.CC_STAT_AREA])
        coverage  = best_area / (h * w)
        if coverage < 0.25:
            return False

        # (c) Fill-ratio: area / bounding-box area ≥ 0.30
        #   Brain blob (oval): fills its bounding box compactly → 0.60–0.85
        #   Text line (thin horizontal band): very low fill → 0.05–0.25
        bb_w = int(cc_stats[best_i, cv2.CC_STAT_WIDTH])
        bb_h = int(cc_stats[best_i, cv2.CC_STAT_HEIGHT])
        if bb_w > 0 and bb_h > 0:
            fill_ratio = best_area / (bb_w * bb_h)
            if fill_ratio < 0.30:
                return False

        return True

    except Exception:
        # Never crash the application due to validation
        return False


# Warning sentinel prefix — detected by brainscan.js to render the warning card
WARNING_PREFIX = "__WARNING__:"


# ── Tumor Classification ─────────────────────────────────────────────────────

def get_className(classNo):
    if classNo == 0:
        return "No Brain Tumor"
    else:
        return "Yes, Brain Tumor Detected"


def getResult(img_path):
    import tensorflow as tf  # already imported in thread; cached by Python
    image = cv2.imread(img_path)
    image = Image.fromarray(image, 'RGB')
    image = image.resize((64, 64))
    image = np.array(image, dtype=np.float32)
    input_img = np.expand_dims(image, axis=0)
    predictions = model.predict(input_img, verbose=0)
    # predictions[0] is shape (1,) for sigmoid output → scalar float
    score = float(predictions[0][0])
    return int(round(score))


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/about', methods=['GET'])
def about():
    return render_template('about_contact.html')


@app.route('/status', methods=['GET'])
def status():
    """Polled by the frontend to know when the model is ready."""
    return jsonify({
        'ready': model_ready,
        'error': model_error
    })


@app.route('/debug', methods=['GET'])
def debug():
    """Shows model status — useful for diagnosing Render failures."""
    import sys
    return jsonify({
        'ready': model_ready,
        'error': model_error,
        'tf_version': tf.__version__,
        'python_version': sys.version,
        'model_file_exists': os.path.exists(_MODEL_PATH),
        'model_file_size_mb': round(os.path.getsize(_MODEL_PATH) / 1e6, 1) if os.path.exists(_MODEL_PATH) else None
    })


@app.route('/predict', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        if not model_ready:
            return jsonify({'error': 'model_loading'}), 503

        f = request.files['file']

        basepath = os.path.dirname(__file__)
        file_path = os.path.join(
            basepath, 'uploads', secure_filename(f.filename))
        f.save(file_path)
        # ── Brain MRI validation gate ──────────────────────────────────
        if not is_valid_brain_image(file_path):
            return (
                WARNING_PREFIX
                + "Invalid Image: Please upload a valid Brain MRI scan "
                  "(Tumor / No Tumor). Only brain MRI images are supported."
            )

        # ── Tumor prediction (only reached if MRI validation passes) ───
        value  = getResult(file_path)
        result = get_className(value)
        return result
    return None


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)