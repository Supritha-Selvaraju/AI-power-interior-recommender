import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNet
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Flatten, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras import mixed_precision

# Enable mixed precision
policy = mixed_precision.Policy('mixed_float16')
mixed_precision.set_global_policy(policy)

# Path to your image dataset
base_dir = 'images/design_types/'

# ImageDataGenerator for loading and augmenting the data
train_datagen = ImageDataGenerator(
    rescale=1./255,
    shear_range=0.2,
    zoom_range=0.2,
    rotation_range=20,   # Added rotation for more augmentation
    brightness_range=[0.8, 1.2],  # Adjust brightness for more variation
    horizontal_flip=True,
    validation_split=0.2
)

# Load training and validation data from directories
train_generator = train_datagen.flow_from_directory(
    base_dir,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='training'
)

validation_generator = train_datagen.flow_from_directory(
    base_dir,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='validation'
)

# Load the MobileNet model with pre-trained weights from ImageNet, without the top classification layer
base_model = MobileNet(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Freeze the base model
base_model.trainable = False

# Add custom classification layers on top of MobileNet
x = base_model.output
x = Flatten()(x)
x = Dense(512, activation='relu')(x)  # Reduced the number of units to fit MobileNet's smaller structure
x = Dropout(0.5)(x)
predictions = Dense(4, activation='softmax', dtype='float32')(x)  # 4 classes: modern, vintage, aesthetic, neutral

# Create the full model
model = Model(inputs=base_model.input, outputs=predictions)

# Compile the model with mixed precision optimizer
optimizer = mixed_precision.LossScaleOptimizer(Adam(learning_rate=0.0001))
model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])

# Train the model
history = model.fit(
    train_generator,
    epochs=10,
    validation_data=validation_generator
)

# Fine-tune: unfreeze the base model and retrain part of it
base_model.trainable = True
for layer in base_model.layers[:-10]:  # Unfreeze only the last 20 layers of the base model
    layer.trainable = False

# Compile again with a lower learning rate for fine-tuning
optimizer = mixed_precision.LossScaleOptimizer(Adam(learning_rate=0.000001))
model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])

# Fine-tune the model
fine_tune_history = model.fit(
    train_generator,
    epochs=5,
    validation_data=validation_generator
)

# Save the trained model
model.save('model/ai_model.keras')

# Evaluate the model
val_loss, val_accuracy = model.evaluate(validation_generator)
print(f"Validation Loss: {val_loss}")
print(f"Validation Accuracy: {val_accuracy}")
