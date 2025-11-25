import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import io
import pickle
import matplotlib.pyplot as plt
import numpy as np
from scikitlearn.metrics import confusion_matrix

# ----------------------------
# Configuration
# ----------------------------
MODEL_PATH = "./models/food_classifier_best.pth"
CACHE_FILE = "./models/dataset_cache.pkl"
BATCH_SIZE = 16
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"\nUsing device: {DEVICE}\n")

# ----------------------------
# Image Transforms (Validation)
# ----------------------------
val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])


# ----------------------------
# Cached Dataset Loader
# ----------------------------
class CachedDataset(Dataset):
    def __init__(self, data, classes, class_to_idx, transform=None):
        self.data = data
        self.classes = classes
        self.class_to_idx = class_to_idx
        self.transform = transform
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]

        # Convert bytes → image
        image = Image.open(io.BytesIO(item['image_bytes'])).convert('RGB')
        label = self.class_to_idx[item['label']]

        if self.transform:
            image = self.transform(image)

        return image, label


# ----------------------------
# Load Cached Dataset
# ----------------------------
print("Loading cached dataset...\n")

with open(CACHE_FILE, "rb") as f:
    cached_data = pickle.load(f)

test_dataset = CachedDataset(
    cached_data["test_data"],
    cached_data["classes"],
    cached_data["class_to_idx"],
    transform=val_transform
)

test_loader = DataLoader(
    test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0
)

classes = cached_data["classes"]
num_classes = len(classes)

print(f"✓ Loaded test dataset: {len(test_dataset)} images")
print(f"✓ Classes: {classes}\n")


# ----------------------------
# Load Model
# ----------------------------
print("Loading trained model...\n")

checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)

model = models.resnet18(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(checkpoint["model_state_dict"])
model.to(DEVICE)
model.eval()

print("✓ Model loaded\n")


# ----------------------------
# Compute Confusion Matrix
# ----------------------------
def compute_confusion_matrix(model, loader, device):
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    return confusion_matrix(all_labels, all_preds)


cm = compute_confusion_matrix(model, test_loader, DEVICE)
print("✓ Confusion matrix computed\n")


# ----------------------------
# Plot Confusion Matrix
# ----------------------------
def plot_confusion_matrix(cm, classes, normalize=False, title="Confusion Matrix"):
    if normalize:
        cm = cm.astype("float") / cm.sum(axis=1, keepdims=True)

    plt.figure(figsize=(12, 10))
    plt.imshow(cm, interpolation="nearest", cmap="Blues")
    plt.title(title)
    plt.colorbar()

    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, rotation=45, ha="right")
    plt.yticks(tick_marks, classes)

    fmt = ".2f" if normalize else "d"
    thresh = cm.max() / 2

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], fmt),
                     ha="center", color="white" if cm[i, j] > thresh else "black")

    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    plt.show()


# ----------------------------
# Show Matrices
# ----------------------------
print("Plotting confusion matrices...\n")

plot_confusion_matrix(cm, classes, normalize=False, title="Confusion Matrix (Counts)")
plot_confusion_matrix(cm, classes, normalize=True, title="Confusion Matrix (Normalized)")

print("Done!\n")
