import { saveAs } from "file-saver";

export const saveAsJSON = (data, fileName) => {
  fetch("http://localhost:5000/save-json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName, data }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

export const loadFromJSON = async () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        reject("No file selected");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject("Error parsing JSON");
        }
      };
      reader.onerror = () => reject("Error reading file");
      reader.readAsText(file);
    };

    input.click();
  });
};
