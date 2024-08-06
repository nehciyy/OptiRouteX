import { saveAs } from "file-saver";

export const saveAsJSON = (data, fileName) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, `${fileName}.json`);
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
