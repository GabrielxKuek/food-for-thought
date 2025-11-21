from datasets import load_dataset

dataset = load_dataset("lowyisan/malaysian_food_images", split="train")
class_names = dataset.features['label'].names

print("CLASS_NAME_MAP = {")
for i, name in enumerate(class_names):
    print(f"    '{i}': '{name}',")
print("}")