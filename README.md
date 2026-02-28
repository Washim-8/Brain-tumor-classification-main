<div align="center">

# 🧠 BrainScan AI - Brain Tumor Detection System

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=22&duration=3000&color=0F766E&center=true&vCenter=true&width=850&lines=AI-Powered+Brain+Tumor+Detection;Deep+Learning+with+CNN+%26+Computer+Vision;Medical+Image+Classification+System;Built+for+Healthcare+Applications" />
</p>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-DeepLearning-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![Keras](https://img.shields.io/badge/Keras-D00000?style=for-the-badge&logo=keras&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-ComputerVision-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-WebApp-000000?style=for-the-badge&logo=flask&logoColor=white)

</div>

---

## 📌 Overview

BrainScan AI is an intelligent medical imaging system that detects and classifies brain tumors from MRI scans using deep learning. Built with a Convolutional Neural Network (CNN), this system analyzes medical images to assist in early diagnosis, helping reduce manual effort and improving accuracy in identifying tumor presence.

**Key Highlights:**
- 🎯 94.2% accuracy on test dataset
- ⚡ Real-time prediction (< 3 seconds)
- 🔍 Advanced 6-gate MRI validation pipeline
- 🌐 Modern web interface with drag-and-drop upload
- 📊 Confidence score visualization
- 🎨 Premium UI/UX with glassmorphism design

---

## ✨ Features

### Core Functionality
- 🧠 **Brain Tumor Classification** - Binary classification (Tumor / No Tumor)
- 🖼️ **MRI Image Analysis** - Processes grayscale medical imaging data
- 🤖 **Deep Learning Pipeline** - CNN-based feature extraction and prediction
- 📊 **Confidence Scoring** - Visual confidence indicators for predictions
- ⚡ **Real-time Processing** - Fast inference with pre-trained model

### Advanced MRI Validation System

The system includes a sophisticated 6-gate validation pipeline that ensures only genuine brain MRI scans are processed:

#### Gate 1: Resolution Check
- Minimum resolution: 100×100 pixels
- Rejects thumbnails, icons, and corrupt files

#### Gate 2: Grayscale Channel Similarity
- Analyzes R, G, B channel differences
- Threshold: max mean(|R-G|, |R-B|, |G-B|) < 13
- Rejects colored cartoons, logos, natural photos
- Catches screenshots with colored UI elements

#### Gate 3: Edge Density Filtering
- Canny edge density < 20%
- Rejects text-heavy documents, menus, receipts
- Brain MRI edge density: 10-17%
- Text documents typically exceed 20%

#### Gate 4: Intensity Statistics
- Grayscale mean in [10, 210]
- Standard deviation ≥ 15
- Rejects pitch-black fills, pure-white pages, flat images
- Lenient range accommodates MRI exposure/window variations

#### Gate 5: Dark-Pixel Fraction (Bounded Range)
- Dark pixels (brightness < 30): [10%, 65%]
- Lower bound: Real MRI always have dark background (≥10%)
- Upper bound: Dark screenshots/wallpapers have 70-90% dark pixels
- Brain tissue fills 30-70% of image, keeping dark fraction below 65%

#### Gate 6: Brain-Blob Detection (Morphological Closing)
Uses advanced computer vision techniques:

**Why Morphological Closing?**
- Raw thresholding fragments the brain into 20-80 pieces
- Sulci (dark folds), ventricles, and falx cerebri split bright brain tissue
- Large closing kernel merges fragments back into one dominant blob
- Reveals characteristic oval brain shape

**Three-Part Check:**
1. **At least ONE significant bright region** after merging
2. **Dominant blob covers ≥25% of image**
   - Brain cross-section: 30-70% of scan
   - Screenshot content: typically <25% of screen
3. **Blob fill-ratio ≥0.30** (area / bounding-box)
   - Brain blob (oval): 0.60-0.85 fill ratio
   - Text lines (thin bands): 0.05-0.25 fill ratio

### Web Interface
- 🎨 **Modern UI/UX** - Glassmorphism design with smooth animations
- 📤 **Drag & Drop Upload** - Intuitive file upload experience
- 👁️ **Image Preview** - Real-time preview before analysis
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎯 **Professional Portfolio** - Integrated About & Contact page

### User Experience
- ⚠️ **Smart Validation Warnings** - Clear feedback for invalid images
- 🔄 **Change Image Option** - Easy re-upload functionality
- 📈 **Visual Progress** - Loading animations during analysis
- 🎭 **Smooth Animations** - Fade-in effects and hover interactions
- 🌐 **Seamless Navigation** - Smooth scrolling between sections

---

## 🛠 Tech Stack

### Backend
- **Language:** Python 3.10+
- **Framework:** Flask (Web Application)
- **Deep Learning:** TensorFlow 2.x, Keras
- **Computer Vision:** OpenCV, PIL (Pillow)
- **Data Processing:** NumPy, Pandas
- **Model:** Convolutional Neural Network (CNN)

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with glassmorphism
- **JavaScript** - Vanilla JS with jQuery for AJAX
- **Fonts:** Google Fonts (Inter, Poppins)

### Machine Learning
- **Architecture:** Sequential CNN
- **Layers:** Conv2D, MaxPooling2D, Dense, Dropout
- **Activation:** ReLU (hidden), Sigmoid (output)
- **Optimizer:** Adam
- **Loss Function:** Binary Crossentropy

---

## 📂 Project Structure

```
BrainScan-AI/
├── app.py                          # Flask application
├── mainTrain.py                    # Model training script
├── mainTest.py                     # Model testing script
├── BrainTumor10Epochs.h5          # Pre-trained CNN model
├── requirements.txt                # Python dependencies
│
├── templates/                      # HTML templates
│   ├── import.html                # Base template
│   ├── index.html                 # Home page
│   └── about_contact.html         # About & Contact page
│
├── static/                         # Static assets
│   ├── css/
│   │   └── brainscan.css         # Main stylesheet
│   └── js/
│       └── brainscan.js          # Main JavaScript
│
├── uploads/                        # Uploaded MRI images
├── datasets/                       # Training datasets
│   ├── yes/                       # Tumor images
│   └── no/                        # No tumor images
│
└── sample/                         # Sample MRI images
```

---

## ⚙️ How It Works

### 1. Image Upload & Validation
User uploads MRI scan via drag-and-drop or file picker. The system validates through a 6-gate pipeline:

**Gate 1:** Resolution check (≥100×100 px)
**Gate 2:** Grayscale channel similarity (rejects colored images)
**Gate 3:** Edge density measurement (filters text/documents)
**Gate 4:** Intensity statistics validation (mean, std-dev)
**Gate 5:** Dark-pixel fraction analysis (bounded range)
**Gate 6:** Brain-blob detection using morphological closing

### 2. Preprocessing
- Image converted to RGB format
- Resized to 64×64 pixels
- Normalized pixel values (0-1 range)
- Expanded dimensions for batch processing

### 3. CNN Prediction
- Pre-trained model processes the image
- Extracts features through convolutional layers
- Applies max pooling for dimensionality reduction
- Outputs probability score (0-1)

### 4. Result Display
- Classification: "No Brain Tumor" or "Yes, Brain Tumor Detected"
- Confidence score visualization
- Color-coded badges
- Medical disclaimer

### 5. MRI Validation Technical Details

**Morphological Closing Process:**
```python
# Step A: Threshold to isolate bright brain tissue
_, binary = cv2.threshold(gray, 25, 255, cv2.THRESH_BINARY)

# Step B: Morphological closing merges brain fragments
k = max(9, min(h, w) // 25)  # Kernel size ~4% of smaller dimension
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
merged = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

# Step C: Connected components analysis on merged image
n_labels, labels, cc_stats, _ = cv2.connectedComponentsWithStats(merged, connectivity=8)
```

**Why This Works:**
- Text documents produce many thin horizontal bands → low fill-ratio
- Brain produces compact oval blob → high fill-ratio
- Screenshot content blobs are typically <25% of total area
- Brain cross-section occupies 30-70% of MRI scan

---

## ▶️ Installation & Setup

### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)

### Step 1: Clone Repository
```bash
git clone https://github.com/Washim-8/Brain-Tumor-Detection.git
cd Brain-Tumor-Detection
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

**Required packages:**
```
tensorflow>=2.10.0
keras>=2.10.0
opencv-python>=4.6.0
pillow>=9.2.0
numpy>=1.23.0
flask>=2.2.0
werkzeug>=2.2.0
scikit-learn>=1.1.0
```

### Step 3: Download Datasets (For Training)
- **Br35H Dataset:** [Kaggle Link](https://www.kaggle.com/ahmedhamada0/brain-tumor-detection)
- **Brain MRI Images:** [Kaggle Link](https://www.kaggle.com/navoneel/brain-mri-images-for-brain-tumor-detection)

### Step 4: Run Application
```bash
python app.py
```

Expected output:
```
Model loaded. Check http://127.0.0.1:5000/
 * Running on http://127.0.0.1:5000
```

### Step 5: Access Application
- **Home:** `http://127.0.0.1:5000/`
- **About:** `http://127.0.0.1:5000/about`

---

## 🔬 MRI Validation Evolution

### Development Journey

The MRI validation system went through multiple iterations to achieve production-grade reliability:

#### Version 1: Basic Statistical Checks
- Resolution and intensity statistics only
- **Problem:** Accepted dark images with any content

#### Version 2: Added Color Channel Analysis
- Detected colored images (cartoons, photos)
- **Problem:** Dark screenshots with sparse text still passed

#### Version 3: Added Edge Density Check
- Rejected text-heavy documents
- **Problem:** Dark-themed code editors with sparse content passed

#### Version 4: Added Dark-Pixel Upper Bound
- Bounded dark fraction to [10%, 65%]
- **Problem:** Some screenshots with large content areas still passed

#### Version 5: Morphological Closing (Current)
- Merges brain fragments before analysis
- Measures blob coverage and fill-ratio
- **Result:** Robust rejection of all non-MRI images

### Validation Test Cases

| Image Type | Rejection Gate | Reason |
|------------|----------------|---------|
| Colorful cartoon | Gate 2 | Large R/G/B channel differences |
| Restaurant menu | Gate 3 | Text creates 20-35% edge density |
| Dark screenshot | Gate 5 | 70-90% dark pixels (exceeds upper bound) |
| Code editor | Gate 6 | Content blob <25% coverage |
| Natural photo | Gate 5 | <10% dark pixels (below lower bound) |
| Solid color fill | Gate 4 or Gate 6 | No significant regions |
| ✅ Real brain MRI | Passes all gates | Meets all criteria |

---

## 🎨 Portfolio Features

### Premium About & Contact Page

The project includes a professionally designed portfolio section with:

- **Glassmorphism Design** - Modern semi-transparent cards with backdrop blur
- **Smooth Animations** - Fade-in on scroll, hover effects
- **Responsive Layout** - Works on all devices
- **Professional Content** - Natural storytelling highlighting skills
- **Interactive Elements** - Contact grid with hover animations

#### Color System
- **Primary:** `#0F766E` (Teal)
- **Background:** Soft gradient from `#F8FAF9` to `#E6F4F1`
- **Cards:** White with glassmorphism effect
- **Text:** `#1F2937` (primary), `#6B7280` (secondary)

---

## 🚀 Future Improvements

### Model Enhancements
- Improve accuracy with larger datasets
- Multi-class classification (tumor types: glioma, meningioma, pituitary)
- Implement advanced architectures (ResNet, EfficientNet, Vision Transformers)
- Add tumor segmentation to highlight affected regions

### Feature Additions
- Deploy as production web application (Heroku, AWS, Azure)
- User authentication and history tracking
- Batch processing for multiple images
- Integration with hospital management systems
- Mobile application (React Native, Flutter)

### UI/UX Improvements
- Dark mode toggle
- Interactive data visualizations
- Projects showcase page
- Contact form with backend
- Real-time collaboration features

### Validation Enhancements
- Secondary ML-based MRI classifier
- Support for different MRI modalities (T1, T2, FLAIR)
- DICOM format support
- Multi-slice MRI analysis

---

## 👨‍💻 About the Developer

I'm **Washim Shaikh**, a Computer Science Engineering student focused on building practical and scalable software solutions. My work blends web development and artificial intelligence, creating systems that solve real-world problems.

### Skills & Expertise
- **Programming:** Python, Java, C, C++
- **Web Development:** HTML, CSS, JavaScript, PHP, Django
- **Database:** MySQL
- **AI/ML:** TensorFlow, Keras, OpenCV, Scikit-learn
- **Tools:** Git, GitHub, VS Code, Jupyter Notebook
- **Domains:** Machine Learning, Deep Learning, Computer Vision, Full Stack Development

### Experience
- 🤖 **AI with Python Internship** - Coincent
- 🧠 **Machine Learning Internship** - Yhills
- 💻 **Full Stack Development Internship** - 1Stop
- ☁️ **AWS Internship** - iStudio (Ongoing)

### Notable Projects
- **AgriTrade** - E-auction platform connecting farmers directly with buyers
- **AI Chatbot** - LLM-based conversational system
- **Fraud Detection System** - ML-based anomaly detection
- **House Price Prediction** - Regression model for real estate
- **Customer Churn Prediction** - Classification model for retention
- **Driver Drowsiness Detection** - Computer vision safety system
- **FinTrackAI** - Personal finance tracker with AI insights

Currently, I'm expanding my expertise in AI systems and deep learning to build scalable, production-ready applications.

---

## 📬 Contact

<div align="center">

### Let's Build Something Great Together

[![Email](https://img.shields.io/badge/Email-washimshaikh33%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:washimshaikh33@gmail.com)
[![Phone](https://img.shields.io/badge/Phone-%2B91%208884958185-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](tel:+918884958185)
[![GitHub](https://img.shields.io/badge/GitHub-Washim--8-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Washim-8)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Washim%20Shaikh-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/washim-shaikh-349868281/)

</div>

---

## 📊 GitHub Stats

<div align="center">

<img src="https://github-readme-stats.vercel.app/api?username=Washim-8&show_icons=true&theme=default&hide_border=true" alt="GitHub Stats" />

<img src="https://github-readme-streak-stats.herokuapp.com/?user=Washim-8&theme=default&hide_border=true" alt="GitHub Streak" />

</div>

---

## ⚠️ Medical Disclaimer

**IMPORTANT:** This tool is intended for research and educational purposes only. AI results are for assistance and should NOT be used as the sole basis for medical diagnosis. Always consult a qualified radiologist or medical professional for accurate diagnosis and treatment decisions.

---

## 📝 License

This project is open-source and available for educational and research purposes. Feel free to use, modify, and distribute with proper attribution.

---

## 🙏 Acknowledgments

- **Datasets:** Kaggle contributors for Brain MRI datasets
- **Libraries:** TensorFlow, Keras, OpenCV, Flask communities
- **Inspiration:** Healthcare professionals working on early diagnosis
- **Design:** Apple, Stripe, Linear, Vercel for UI/UX inspiration

---

<div align="center">

### ✨ Built with passion for innovation using AI and Deep Learning

**Exploring AI applications in healthcare through computer vision and deep learning**

---

**⭐ Star this repository if you find it helpful!**

**🔗 Share with others interested in AI and healthcare**

**💡 Contribute to make it even better**

---

© 2026 Washim Shaikh · Built for Healthcare Innovation

</div>
