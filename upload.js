// Buttons
const submitButton = document.getElementById("submit");
const cancelButton = document.getElementById("cancel");

// Array to store the chunks of the file
let chunks = [];

// Timeout to start the upload
let uploadTimeout;

// Boolean to check if a chunk is currently being uploaded
let uploading = false;

// Maximum number of retries for a chunk
const maxRetries = 3;

// Create an AbortController to cancel the fetch request
let controller;

// Function to cancel the upload and abort the fetch requests
const cancelUpload = () => {
    clearUpload();
    if (controller)
        controller.abort();
    enableUpload();
};

// Function to clear/reset the upload varaibles
const clearUpload = () => {
    clearTimeout(uploadTimeout);
    uploading = false;
    chunks = [];
};

// Function to enable the submit button
const enableUpload = () => {
    submitButton.removeAttribute("disabled");
    submitButton.setAttribute("value","Upload");
};

// Function to enable the submit button
const disableUpload = () => {
    submitButton.setAttribute("disabled","disabled");
    submitButton.setAttribute("value","Uploading...");
};

// Event listener for the cancel button
cancelButton.addEventListener("click",(e) => {
    cancelUpload();
});

// Event listener for the submit button
submitButton.addEventListener("click",(e) => {
    const fileInput = document.getElementById("file");

    if (fileInput.files.length) {
        disableUpload();

        const file = fileInput.files[0];

        // Break the file into 1MB chunks
        const chunkSize = 1024 * 1024;
        const totalChunks = Math.ceil(file.size / chunkSize);

        // Setup chunk array with starting byte and endbyte that will be slied from the file and uploaded
        let startByte = 0;
        for (var i = 1; i <= totalChunks; i++) {
            let endByte = Math.min(startByte + chunkSize,file.size);
            // [chunk number, start byte, end byte, uploaded, retry count, error, promise]
            chunks.push([i,startByte, Math.min(startByte + chunkSize,file.size), null, 0, null, null]);
            startByte = endByte;
        }

        // Begin uploading the chunks one after the other
        uploadTimeout = setInterval(() => {
            if (!uploading) {
                uploading = true;  // Prevent the next interval from starting until the current chunk is uploaded

                // Upload the first chunk that hasn't already been uploaded
                for (var i = 0; i < chunks.length; i++) {
                    if (!chunks[i][3] && chunks[i][4] < maxRetries) {
                        // Get the binary chunk (start byte / end byte)
                        const chunk = file.slice(chunks[i][1],chunks[i][2]);

                        const formData = new FormData();

                        formData.append("chunk",chunk);
                        formData.append("chunknumber",chunks[i][0]);
                        formData.append("totalchunks",totalChunks);
                        formData.append("filename",file.name);

                        // Create an AbortController to cancel the fetch request
                        // Need a new one for each fetch request
                        controller = new AbortController();

                        fetch(document.getElementById("form").getAttribute("action"), {
                            method: "POST",
                            body: formData,
                            signal: controller.signal
                        }).then(response => {
                            if (response.status == 413) {
                                cancelUpload();
                                alert("The chunk is too large. Try a smaller chunk size.");
                            } else {
                                response.json().then(data => {
                                    if (data && data.success) {
                                        // Uploaded successfully
                                        chunks[i][3] = true; // Mark the chunk as uploaded
                                        uploading = false; // Allow the next chunk to be uploaded
                                        if (chunks[i][0] == totalChunks) {
                                            // Last chunk uploaded successfully
                                            clearUpload();
                                            enableUpload();
                                            alert("File uploaded successfully");
                                        }
                                    } else {
                                        // Error uplooading
                                        cancelUpload();
                                        alert("Error uploading chunk. Check the browser debug window for details.");
                                        console.error("Unhandled error uploading chunk");
                                    }
                                }).catch(error => {
                                    // Error uploading
                                    cancelUpload();
                                    alert("Error uploading chunk. Check the browser debug window for details.");
                                    console.error("Error:",error);
                                });
                            }
                        }).catch(error => {
                            // Error uploading
                            chunks[i][4]++; // Increment the retry count
                            chunks[i][5] = error; // Store the error
                            uploading = false; // Allow retrying this chunk
                            console.error("Error:",error); // Log the error
                        });
                        break;
                    }
                }
            }
        },1000);            
    } else {
        alert("No file selected.");
    }
});