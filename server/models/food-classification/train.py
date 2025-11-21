import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from datasets import load_dataset
from PIL import Image
import os
import io
import pickle

# ----------------------------
# Custom Dataset from Hugging Face
# ----------------------------
class MalaysianFoodDataset(Dataset):
    def __init__(self, hf_dataset, transform=None):
        self.data = []
        self.transform = transform
        self.classes = []
        self.class_to_idx = {}
        
        # Load all data (non-streaming)
        print("Processing dataset...")
        skipped = 0
        
        for idx in range(len(hf_dataset)):
            try:
                item = hf_dataset[idx]
                # Verify image is valid
                image = item['image']
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                self.data.append(item)
                
                if (idx + 1) % 100 == 0:
                    print(f"  Processed {len(self.data)} images... (skipped {skipped})")
                    
            except Exception as e:
                skipped += 1
                print(f"  Warning: Skipping corrupted image at index {idx}")
                continue
        
        print(f"✓ Total: {len(self.data)} valid images (skipped {skipped})")
        
        # Get unique labels
        self.classes = sorted(list(set([item['label'] for item in self.data])))
        self.class_to_idx = {cls: i for i, cls in enumerate(self.classes)}
        print(f"✓ Classes: {self.classes}")

    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        
        try:
            image = item['image']
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            label = self.class_to_idx[item['label']]
            
            if self.transform:
                image = self.transform(image)
            
            return image, label
            
        except Exception as e:
            print(f"Error at index {idx}: {str(e)}")
            # Return next valid image
            return self.__getitem__((idx + 1) % len(self.data))

# ----------------------------
# Configuration
# ----------------------------
BATCH_SIZE = 16
EPOCHS = 20
LEARNING_RATE = 0.001
MODEL_SAVE_DIR = "./models"
CACHE_FILE = "./models/dataset_cache.pkl"

# Create models directory
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"\n{'='*60}")
print(f"Device: {device}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
print(f"{'='*60}\n")

# ----------------------------
# Data Transforms
# ----------------------------
train_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ----------------------------
# Load or Cache Dataset
# ----------------------------
# ----------------------------
# Load or Cache Dataset
# ----------------------------
print("="*60)
print("Loading Dataset")
print("="*60)

if os.path.exists(CACHE_FILE):
    print(f"\n✓ Found cached dataset at {CACHE_FILE}")
    print("Loading from cache (this is fast)...\n")
    
    with open(CACHE_FILE, 'rb') as f:
        cached_data = pickle.load(f)
    
    # Create datasets with transforms
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
            try:
                # Convert bytes back to PIL Image
                image = Image.open(io.BytesIO(item['image_bytes'])).convert('RGB')
                label = self.class_to_idx[item['label']]
                
                if self.transform:
                    image = self.transform(image)
                
                return image, label
            except Exception as e:
                print(f"Error at index {idx}: {str(e)}")
                return self.__getitem__((idx + 1) % len(self.data))
    
    train_dataset = CachedDataset(
        cached_data['train_data'],
        cached_data['classes'],
        cached_data['class_to_idx'],
        transform=train_transform
    )
    
    test_dataset = CachedDataset(
        cached_data['test_data'],
        cached_data['classes'],
        cached_data['class_to_idx'],
        transform=val_transform
    )
    
    print(f"✓ Loaded from cache:")
    print(f"  Train: {len(train_dataset)} images")
    print(f"  Test: {len(test_dataset)} images")
    print(f"  Classes: {train_dataset.classes}")
    
else:
    print("\n⚠ No cache found. Loading from Hugging Face...")
    print("(This will take a few minutes, but only happens once)\n")
    
    import io
    
    print("[1/2] Loading TRAINING data...")
    train_hf = load_dataset("lowyisan/malaysian_food_images", split="train")
    
    # Process training data and convert images to bytes
    train_data_cached = []
    print("Converting training images to bytes for caching...")
    skipped = 0
    
    for idx in range(len(train_hf)):
        try:
            item = train_hf[idx]
            image = item['image']
            
            # Convert to RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert PIL Image to bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='JPEG')
            img_bytes = img_byte_arr.getvalue()
            
            # Store as bytes instead of PIL Image
            train_data_cached.append({
                'image_bytes': img_bytes,
                'label': item['label']
            })
            
            if (idx + 1) % 100 == 0:
                print(f"  Processed {len(train_data_cached)} images... (skipped {skipped})")
                
        except Exception as e:
            skipped += 1
            print(f"  Warning: Skipping corrupted image at index {idx}")
            continue
    
    print(f"✓ Train: {len(train_data_cached)} valid images (skipped {skipped})")
    
    print("\n[2/2] Loading TEST data...")
    test_hf = load_dataset("lowyisan/malaysian_food_images", split="test")
    
    # Process test data
    test_data_cached = []
    print("Converting test images to bytes for caching...")
    skipped = 0
    
    for idx in range(len(test_hf)):
        try:
            item = test_hf[idx]
            image = item['image']
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='JPEG')
            img_bytes = img_byte_arr.getvalue()
            
            test_data_cached.append({
                'image_bytes': img_bytes,
                'label': item['label']
            })
            
            if (idx + 1) % 100 == 0:
                print(f"  Processed {len(test_data_cached)} images... (skipped {skipped})")
                
        except Exception as e:
            skipped += 1
            print(f"  Warning: Skipping corrupted image at index {idx}")
            continue
    
    print(f"✓ Test: {len(test_data_cached)} valid images (skipped {skipped})")
    
    # Get classes
    train_hf = load_dataset("lowyisan/malaysian_food_images", split="train")
    classes = train_hf.features['label'].names
    class_to_idx = {cls: i for i, cls in enumerate(classes)}

    print(f"✓ Classes: {classes}")
    
    class_to_idx = {cls: i for i, cls in enumerate(classes)}
    
    print(f"✓ Classes: {classes}")
    
    # Save to cache
    print("\n💾 Saving dataset to cache...")
    cache_data = {
        'train_data': train_data_cached,
        'test_data': test_data_cached,
        'classes': classes,
        'class_to_idx': class_to_idx
    }
    
    with open(CACHE_FILE, 'wb') as f:
        pickle.dump(cache_data, f)
    
    print(f"✓ Dataset cached to {CACHE_FILE}")
    print("  Next time this will load instantly!\n")
    
    # Create datasets with transforms
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
            try:
                # Convert bytes back to PIL Image
                image = Image.open(io.BytesIO(item['image_bytes'])).convert('RGB')
                label = self.class_to_idx[item['label']]
                
                if self.transform:
                    image = self.transform(image)
                
                return image, label
            except Exception as e:
                print(f"Error at index {idx}: {str(e)}")
                return self.__getitem__((idx + 1) % len(self.data))
    
    train_dataset = CachedDataset(
        cache_data['train_data'],
        cache_data['classes'],
        cache_data['class_to_idx'],
        transform=train_transform
    )
    
    test_dataset = CachedDataset(
        cache_data['test_data'],
        cache_data['classes'],
        cache_data['class_to_idx'],
        transform=val_transform
    )

# ----------------------------
# DataLoaders
# ----------------------------
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

print(f"\n✓ DataLoaders created:")
print(f"  Train batches: {len(train_loader)}")
print(f"  Test batches: {len(test_loader)}")

# ----------------------------
# Model Setup
# ----------------------------
num_classes = len(train_dataset.classes)

print("\n" + "="*60)
print("Initializing Model")
print("-" * 60)
print(f"Model: ResNet-18")
print(f"Number of classes: {num_classes}")
print(f"Classes: {train_dataset.classes}")

model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=3, verbose=True)

# ----------------------------
# Training Functions
# ----------------------------
def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for batch_idx, (images, labels) in enumerate(loader):
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
        
        if (batch_idx + 1) % 10 == 0:
            print(f"    Batch [{batch_idx+1}/{len(loader)}] Loss: {loss.item():.4f}")
    
    avg_loss = running_loss / len(loader)
    accuracy = 100 * correct / total
    return avg_loss, accuracy

def evaluate(model, loader, device, dataset):
    model.eval()
    correct = 0
    total = 0
    
    # Per-class accuracy
    num_classes = len(dataset.classes)
    class_correct = [0] * num_classes
    class_total = [0] * num_classes
    
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            # Per-class accuracy
            c = (predicted == labels)
            for i in range(labels.size(0)):
                label = labels[i].item()
                class_correct[label] += c[i].item()
                class_total[label] += 1
    
    accuracy = 100 * correct / total
    
    # Print per-class accuracy
    print("\n    Per-class Test Accuracy:")
    for i in range(num_classes):
        if class_total[i] > 0:
            class_acc = 100 * class_correct[i] / class_total[i]
            print(f"      • {str(dataset.classes[i]):20s}: {class_acc:5.2f}% ({int(class_correct[i])}/{class_total[i]})")
    
    return accuracy

# ----------------------------
# Main Training Loop
# ----------------------------
def train_model():
    print("\n" + "="*60)
    print("Training Model")
    print("="*60)
    
    best_acc = 0.0
    
    for epoch in range(EPOCHS):
        print(f"\n{'─'*60}")
        print(f"Epoch [{epoch+1}/{EPOCHS}]")
        print(f"{'─'*60}")
        
        # Train
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        print(f"\n  Training Results:")
        print(f"    Loss: {train_loss:.4f}")
        print(f"    Accuracy: {train_acc:.2f}%")
        
        # Evaluate
        print(f"\n  Testing...")
        test_acc = evaluate(model, test_loader, device, train_dataset)
        print(f"\n  Overall Test Accuracy: {test_acc:.2f}%")
        
        # Learning rate scheduling
        scheduler.step(test_acc)
        
        # Save best model
        if test_acc > best_acc:
            best_acc = test_acc
            checkpoint_path = os.path.join(MODEL_SAVE_DIR, 'food_classifier_best.pth')
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'accuracy': test_acc,
                'classes': train_dataset.classes
            }, checkpoint_path)
            print(f"\n  ✓ Saved new best model! (Accuracy: {best_acc:.2f}%)")
    
    print(f"\n{'='*60}")
    print(f"Training Complete!")
    print(f"Best Test Accuracy: {best_acc:.2f}%")
    print(f"{'='*60}")
    
    # Save class names
    classes_path = os.path.join(MODEL_SAVE_DIR, 'food_classes.txt')
    with open(classes_path, 'w') as f:
        for cls in train_dataset.classes:
            f.write(f"{cls}\n")
    
    print(f"\nModel saved to: {checkpoint_path}")
    print(f"Classes saved to: {classes_path}")

if __name__ == "__main__":
    print("="*60)
    print("Malaysian Food Classifier Training")
    print("="*60)
    print(f"\nDataset: lowyisan/malaysian_food_images")
    print(f"Training samples: {len(train_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Epochs: {EPOCHS}")
    print(f"Learning rate: {LEARNING_RATE}")
    
    train_model()