document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("room-photo");
    const preview = document.getElementById("image-preview");
    const imageUploadForm = document.getElementById("image-upload-form");

    if (fileInput) {
        fileInput.addEventListener("change", function (event) {
            const file = event.target.files[0];

            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Room Preview" class="uploaded-image">`;

                    // Store the base64 image data in sessionStorage
                    sessionStorage.setItem("uploadedImage", e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = "Please upload a valid image file.";
            }
        });

        imageUploadForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const file = fileInput.files[0];

            if (file && file.type.startsWith("image/")) {
                // Upload the image and get AI predictions
                try {
                    const formData = new FormData();
                    formData.append("file", file); // Change 'image' to 'file'

                    const response = await fetch("http://127.0.0.1:8000/predict", { // Update the URL
                        method: "POST",
                        body: formData,
                    });

                    const result = await response.json();
                    const predictedStyle = result.predicted_style; // Update this line

                    // Store the predicted style in sessionStorage
                    sessionStorage.setItem("predictedStyle", predictedStyle);

                    // Redirect to recommendations page
                    window.location.href = "../html/recommendations.html";
                } catch (error) {
                    console.error("Error fetching AI predictions:", error);
                    alert("Failed to analyze the image. Please try again.");
                }
            } else {
                alert("Please upload a valid image file.");
            }
        });
    }

    const uploadedRoomPhoto = document.getElementById("uploaded-room");
    const storedImage = sessionStorage.getItem("uploadedImage");

    if (uploadedRoomPhoto && storedImage) {
        uploadedRoomPhoto.src = storedImage;
    } else if (uploadedRoomPhoto) {
        uploadedRoomPhoto.alt = "No image uploaded.";
    }

    // Fetch decor items based on AI prediction
    async function fetchDecorItems() {
        const predictedStyle = sessionStorage.getItem("predictedStyle") || "neutral"; // Fallback to neutral style if not available
        const apiUrl = `http://localhost:3000/api/ai-recommendations?style=${predictedStyle}`;
    
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            console.log(data); // Log the response data to see its structure
            displayDecorCategories(data);
        } catch (error) {
            console.error("Error fetching decor items:", error);
            alert("Failed to fetch decor items.");
        }
    }
    

    function displayDecorCategories(data) {
        const decorContainer = document.querySelector(".decor-items-container");
    
        decorContainer.innerHTML = "";
    
        // Ensure data is an array before iterating
        if (Array.isArray(data)) {
            data.forEach(item => {
                const decorItem = document.createElement("div");
                decorItem.classList.add("decor-item");
                decorItem.innerHTML = `
                    <img src="${item.item_image_url || 'placeholder.png'}" alt="${item.item_name || 'Decor Item'}">
                    <p>${item.item_name || 'Unknown Item'}</p>
                `;
                decorContainer.appendChild(decorItem);
            });
        } else {
            console.error("Data is not an array:", data);
        }
    }
    
if (window.location.pathname.includes("recommendations.html")) {
    fetchDecorItems();
}
});
